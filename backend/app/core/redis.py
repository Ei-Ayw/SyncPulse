import redis
from app.core.config import settings

# Create a redis client instance
# We'll use the same URL as the celery broker for simplicity
redis_client = redis.from_url(settings.CELERY_BROKER_URL, decode_responses=True)

def get_redis():
    return redis_client
