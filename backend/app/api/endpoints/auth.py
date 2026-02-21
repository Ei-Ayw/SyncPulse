from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.user import User
from app.schemas.user import TokenLinkRequest, UserResponse, PlatformStatus

router = APIRouter()

@router.post("/link", response_model=UserResponse)
def link_account(req: TokenLinkRequest, db: Session = Depends(get_db)):
    # Very basic user fetching/creation logic for POC
    user = db.query(User).filter(User.id == req.user_id).first()
    if not user:
        user = User(id=req.user_id)
        db.add(user)
    
    if req.platform == "github":
        user.github_username = req.username
        user.github_access_token = req.access_token # Should be encrypted in production
    elif req.platform == "gitee":
        user.gitee_username = req.username
        user.gitee_access_token = req.access_token
    else:
        raise HTTPException(status_code=400, detail="Invalid platform")
        
    db.commit()
    db.refresh(user)
    
    return user

@router.delete("/unlink/{user_id}/{platform}")
def unlink_account(user_id: int, platform: str, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    if platform == "github":
        user.github_username = None
        user.github_access_token = None
    elif platform == "gitee":
        user.gitee_username = None
        user.gitee_access_token = None
    else:
        raise HTTPException(status_code=400, detail="Invalid platform")
        
    db.commit()
    return {"status": "success", "message": f"Unlinked {platform} account"}

@router.get("/status/{user_id}", response_model=PlatformStatus)
def get_link_status(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        return PlatformStatus(github_linked=False, gitee_linked=False)
        
    return PlatformStatus(
        github_linked=bool(user.github_access_token),
        gitee_linked=bool(user.gitee_access_token)
    )
