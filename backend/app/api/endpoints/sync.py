from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.user import User, RepositorySyncTask
from app.schemas.sync import RepoInfo, SyncRequest, SyncResponse
from app.worker.tasks import sync_repository
import requests

router = APIRouter()

@router.get("/github/repos/{user_id}", response_model=list[RepoInfo])
def list_github_repos(user_id: int, db: Session = Depends(get_db)):
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
    return [RepoInfo(**repo) for repo in repos]

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
