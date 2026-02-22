from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.user import User, RepositorySyncTask
from app.schemas.sync import RepoInfo, SyncRequest, SyncResponse
from app.worker.tasks import sync_repository
import requests

from app.core.redis import get_redis
import json

router = APIRouter()

@router.get("/github/repos/{user_id}", response_model=list[RepoInfo])
def list_github_repos(user_id: int, refresh: bool = False, db: Session = Depends(get_db), redis = Depends(get_redis)):
    cache_key = f"user:{user_id}:github_repos"
    
    if not refresh:
        cached_data = redis.get(cache_key)
        if cached_data:
            return [RepoInfo(**item) for item in json.loads(cached_data)]

    user = db.query(User).filter(User.id == user_id).first()
    if not user or not user.github_access_token:
        raise HTTPException(status_code=400, detail="GitHub account not linked")
        
    headers = {
        "Accept": "application/vnd.github+json",
        "Authorization": f"Bearer {user.github_access_token}",
        "X-GitHub-Api-Version": "2022-11-28"
    }
    
    response = requests.get("https://api.github.com/user/repos", headers=headers, params={"visibility": "all", "per_page": 100})
    
    if response.status_code != 200:
        raise HTTPException(status_code=response.status_code, detail="Failed to fetch repositories from GitHub")
        
    repos = response.json()
    
    # Get all sync tasks for this user
    sync_tasks = db.query(RepositorySyncTask).filter(RepositorySyncTask.user_id == user_id).all()
    
    # Pre-process tasks into maps for efficiency
    status_map = {}
    activity_map = {} # Maps repo_url -> list of 21 counters
    
    from datetime import datetime, timedelta, timezone
    now = datetime.now(timezone.utc)
    
    for task in sync_tasks:
        url = task.github_repo_url
        status_map[url] = task.status
        
        # Calculate activity for heatmap (last 21 days)
        if url not in activity_map:
            activity_map[url] = [0] * 21
            
        created = task.created_at
        if created.tzinfo is None:
            created = created.replace(tzinfo=timezone.utc)
            
        delta = now - created
        days_ago = delta.days
        if 0 <= days_ago < 21:
            index = 20 - days_ago
            activity_map[url][index] += 1

    repo_list = []
    for r in repos:
        info = RepoInfo(**r)
        url = info.clone_url
        info.sync_status = status_map.get(url)
        info.activity_data = activity_map.get(url, [0] * 21) # Default to 21 empty dots
        repo_list.append(info)
        
    # Cache the result for 30 minutes
    redis.setex(cache_key, 1800, json.dumps([r.model_dump() for r in repo_list]))
        
    return repo_list

@router.post("/trigger", response_model=SyncResponse)
def trigger_sync(req: SyncRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == req.user_id).first()
    if not user or not user.github_access_token or not user.gitee_access_token:
        raise HTTPException(status_code=400, detail="Both GitHub and Gitee accounts must be linked")
    
    # Extract repo name from url (simplified)
    repo_name = req.github_repo_url.split("/")[-1]
    if repo_name.endswith(".git"):
        repo_name = repo_name[:-4]
        
    # Check if repo exists on Gitee, if not create it
    # This logic is simplified for now
    
    # 1. Create a task record in the DB
    task_record = RepositorySyncTask(
        user_id=user.id,
        github_repo_url=req.github_repo_url,
        gitee_repo_url=f"https://gitee.com/{user.gitee_username}/{repo_name}.git",
        status="pending"
    )
    db.add(task_record)
    db.commit()
    db.refresh(task_record)
    
    # 2. Add to celery task queue
    # Extract PATs here to pass to the worker
    celery_task = sync_repository.delay(
        task_id=task_record.id,
        github_repo_url=task_record.github_repo_url,
        gitee_repo_url=task_record.gitee_repo_url,
        github_pat=user.github_access_token,
        gitee_pat=user.gitee_access_token
    )
    
    return SyncResponse(
        task_id=task_record.id,
        status="queued",
        message="Sync task has been added to the queue"
    )

@router.get("/dashboard/{user_id}")
def get_dashboard_stats(user_id: int, db: Session = Depends(get_db)):
    from sqlalchemy import func
    from datetime import datetime, timedelta, timezone

    tasks = db.query(RepositorySyncTask).filter(RepositorySyncTask.user_id == user_id).all()
    
    total = len(tasks)
    active = len([t for t in tasks if t.status == "syncing"])
    queued = len([t for t in tasks if t.status == "pending"])
    failed = len([t for t in tasks if t.status == "failed"])
    
    # Generate true heatmap data based on the last 120 days
    days = 120
    heatmap_data = [0] * days
    
    # Fast path if no tasks
    if total > 0:
        now = datetime.now(timezone.utc)
        
        # Calculate daily counts
        for task in tasks:
            # Check if created_at is naive or aware, enforce timezone.utc comparison
            created = task.created_at
            if created.tzinfo is None:
                created = created.replace(tzinfo=timezone.utc)
                
            delta = now - created
            days_ago = delta.days
            
            # If the task falls within our 120 days window
            if 0 <= days_ago < days:
                # We want visually older days at the beginning of the array (index 0) 
                # and recent days at the end of the array (index 119)
                index = (days - 1) - days_ago
                heatmap_data[index] += 1
                
        # Compress real counts to visual levels (0-4)
        for i in range(days):
            val = heatmap_data[i]
            if val == 0:
                heatmap_data[i] = 0
            elif val <= 2:
                heatmap_data[i] = 1
            elif val <= 5:
                heatmap_data[i] = 2
            elif val <= 10:
                heatmap_data[i] = 3
            else:
                heatmap_data[i] = 4

    return {
        "stats": {
            "total": total,
            "active": active,
            "queued": queued,
            "failed": failed,
        },
        "heatmapData": heatmap_data
    }
