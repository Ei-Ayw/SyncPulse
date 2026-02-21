from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.core.database import get_db
from app.models.user import RepositorySyncTask
from app.schemas.log import SyncLogResponse

router = APIRouter()

@router.get("/{user_id}", response_model=List[SyncLogResponse])
def get_sync_logs(
    user_id: int, 
    status: Optional[str] = Query(None, description="Filter by status (completed, failed, syncing, pending)"),
    limit: int = 50,
    offset: int = 0,
    db: Session = Depends(get_db)
):
    query = db.query(RepositorySyncTask).filter(RepositorySyncTask.user_id == user_id)
    if status:
        query = query.filter(RepositorySyncTask.status == status)
    
    tasks = query.order_by(RepositorySyncTask.created_at.desc()).offset(offset).limit(limit).all()
    return tasks
