from celery import Celery
from celery.schedules import crontab
from ..core.config import settings

celery_app = Celery(
    "github_gitee_sync",
    broker=settings.CELERY_BROKER_URL,
    backend=settings.CELERY_RESULT_BACKEND,
    include=["app.worker.tasks", "app.worker.periodic_tasks"]
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="Asia/Shanghai",
    enable_utc=True,
)

celery_app.conf.beat_schedule = {
    "auto-sync-daily": {
        "task": "app.worker.periodic_tasks.auto_sync_all_users",
        "schedule": crontab(minute=0, hour=2), # 每天凌晨2点执行
    },
}
