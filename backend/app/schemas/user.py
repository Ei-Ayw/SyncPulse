from pydantic import BaseModel
from typing import Optional

class UserBase(BaseModel):
    pass

class UserCreate(UserBase):
    pass

class TokenLinkRequest(BaseModel):
    user_id: int
    platform: str # "github" or "gitee"
    username: str
    access_token: str

class UserResponse(BaseModel):
    id: int
    github_username: Optional[str] = None
    gitee_username: Optional[str] = None
    
    class Config:
        from_attributes = True

class PlatformStatus(BaseModel):
    github_linked: bool
    gitee_linked: bool
