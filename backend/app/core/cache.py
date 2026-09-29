"""
Redis velocity and geolocation cache.
Fails gracefully if Redis is not available — the API continues without velocity/geo features.
"""
import logging
from collections import Counter
from typing import Optional

logger = logging.getLogger(__name__)

# Lazy Redis client — only connects when first used
_redis_client = None
_redis_available = None  # None = not tested yet


def _get_redis():
    """Return Redis client, or None if unavailable."""
    global _redis_client, _redis_available
    if _redis_available is False:
        return None
    if _redis_client is not None:
        return _redis_client
    try:
        import redis
        from app.core.config import settings
        pool = redis.ConnectionPool.from_url(settings.REDIS_URL, decode_responses=True, socket_connect_timeout=2)
        client = redis.Redis(connection_pool=pool)
        client.ping()  # Test connection
        _redis_client = client
        _redis_available = True
        logger.info('Redis connected successfully')
        return _redis_client
    except Exception as e:
        _redis_available = False
        logger.warning(f'Redis unavailable, velocity/geo features disabled: {e}')
        return None


def check_and_update_velocity(customer_id: int, window_seconds: int = 3600) -> int:
    """
    Increments the transaction count for a customer in the given time window.
    Returns the velocity count, or 0 if Redis is unavailable.
    """
    r = _get_redis()
    if r is None:
        return 0  # Safe default: no prior transactions known
    try:
        key = f'velocity:{customer_id}:1h'
        pipe = r.pipeline()
        pipe.incr(key)
        pipe.expire(key, window_seconds)
        results = pipe.execute()
        return results[0]
    except Exception as e:
        logger.warning(f'Redis velocity check failed: {e}')
        return 0


def update_geolocation(customer_id: int, country_code: str) -> None:
    """Pushes the country code to the user's recent countries list in Redis."""
    r = _get_redis()
    if r is None:
        return
    try:
        key = f'geo:{customer_id}'
        pipe = r.pipeline()
        pipe.lpush(key, country_code)
        pipe.ltrim(key, 0, 19)  # Keep last 20 transactions
        pipe.expire(key, 86400 * 30)  # 30 days
        pipe.execute()
    except Exception as e:
        logger.warning(f'Redis geo update failed: {e}')


def check_if_foreign(customer_id: int, current_country: str) -> int:
    """
    Returns 1 if transaction is in a non-home country, 0 otherwise.
    Returns 0 (safe default) if Redis is unavailable or no history exists.
    """
    r = _get_redis()
    if r is None:
        return 0  # Safe default: assume home country
    try:
        key = f'geo:{customer_id}'
        countries = r.lrange(key, 0, -1)
        if not countries:
            return 0
        country_counts = Counter(countries)
        home_country = country_counts.most_common(1)[0][0]
        return 1 if current_country != home_country else 0
    except Exception as e:
        logger.warning(f'Redis geo check failed: {e}')
        return 0
