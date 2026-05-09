import json
import os
import logging
from typing import Optional
import redis

logger = logging.getLogger("cinerate.cache")

# Redis Connection Setup
REDIS_HOST = os.getenv("REDIS_HOST", "127.0.0.1")
REDIS_PORT = int(os.getenv("REDIS_PORT", "6380"))
REDIS_DB = int(os.getenv("REDIS_DB", "0"))
CACHE_TTL = int(os.getenv("CACHE_TTL", "300"))
CACHE_KEY_TOP10 = "cinerate:top10"

_pool: Optional[redis.ConnectionPool] = None

def get_redis_pool() -> redis.ConnectionPool:
    global _pool
    if _pool is None:
        _pool = redis.ConnectionPool(
            host=REDIS_HOST,
            port=REDIS_PORT,
            db=REDIS_DB,
            decode_responses=True,
            max_connections=10,
        )
    return _pool

def get_redis_client() -> redis.Redis:
    return redis.Redis(connection_pool=get_redis_pool())

# Cache Helpers
def get_top10_from_cache() -> Optional[list[dict]]:
    try:
        client = get_redis_client()
        data = client.get(CACHE_KEY_TOP10)
        if data:
            return json.loads(data)
        return None
    except redis.RedisError as exc:
        logger.warning("Redis read error: %s", exc)
        return None

def set_top10_in_cache(movies: list[dict], ttl: int = CACHE_TTL) -> None:
    try:
        client = get_redis_client()
        client.setex(CACHE_KEY_TOP10, ttl, json.dumps(movies, default=str))
    except redis.RedisError as exc:
        logger.warning("Redis write error: %s", exc)

def invalidate_top10_cache() -> None:
    try:
        client = get_redis_client()
        client.delete(CACHE_KEY_TOP10)
    except redis.RedisError as exc:
        logger.warning("Redis delete error: %s", exc)
