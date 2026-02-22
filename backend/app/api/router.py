from fastapi import APIRouter
from .endpoints import auth, sync, logs, webhook

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(sync.router, prefix="/sync", tags=["sync"])
api_router.include_router(logs.router, prefix="/logs", tags=["logs"])
api_router.include_router(webhook.router, prefix="/webhook", tags=["webhook"])
