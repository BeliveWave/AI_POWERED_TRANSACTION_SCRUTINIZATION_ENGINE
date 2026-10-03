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


# In-memory fallback if Redis is unavailable
import time as _time
from collections import defaultdict, deque

_mem_velocity = defaultdict(deque)  # customer_id -> deque of timestamps
_mem_geo = defaultdict(deque)       # customer_id -> deque of country_codes (max 20)


def check_and_update_velocity(customer_id: int, window_seconds: int = 3600) -> int:
    """
    Increments the transaction count for a customer in the given time window.
    Uses Redis if available, otherwise fast in-memory cache.
    """
    r = _get_redis()
    if r is not None:
        try:
            key = f'velocity:{customer_id}:1h'
            pipe = r.pipeline()
            pipe.incr(key)
            pipe.expire(key, window_seconds)
            results = pipe.execute()
            return results[0]
        except Exception as e:
            logger.warning(f'Redis velocity check failed: {e}')

    # In-memory fallback
    now = _time.time()
    q = _mem_velocity[customer_id]
    q.append(now)
    while q and q[0] < now - window_seconds:
        q.popleft()
    return len(q)


def update_geolocation(customer_id: int, country_code: str) -> None:
    """Pushes the country code to the user's recent countries list."""
    r = _get_redis()
    if r is not None:
        try:
            key = f'geo:{customer_id}'
            pipe = r.pipeline()
            pipe.lpush(key, country_code)
            pipe.ltrim(key, 0, 19)  # Keep last 20 transactions
            pipe.expire(key, 86400 * 30)  # 30 days
            pipe.execute()
            return
        except Exception as e:
            logger.warning(f'Redis geo update failed: {e}')

    # In-memory fallback
    if country_code:
        q = _mem_geo[customer_id]
        q.append(country_code)
        if len(q) > 20:
            q.popleft()


def check_if_foreign(customer_id: int, current_country: str) -> int:
    """
    Returns 1 if transaction is in a non-home country, 0 otherwise.
    Uses Redis if available, otherwise in-memory history.
    Default home country is Sri Lanka (LK).
    """
    if not current_country:
        return 0

    curr = str(current_country).strip().upper()

    r = _get_redis()
    if r is not None:
        try:
            key = f'geo:{customer_id}'
            countries = r.lrange(key, 0, -1)
            if countries:
                country_counts = Counter(countries)
                home_country = country_counts.most_common(1)[0][0].upper()
                return 1 if curr != home_country else 0
        except Exception as e:
            logger.warning(f'Redis geo check failed: {e}')

    # In-memory fallback
    q = _mem_geo[customer_id]
    if not q:
        # Default home country for customer cardholders is LK
        return 1 if curr not in ("LK", "LKA", "SRI LANKA") else 0

    country_counts = Counter(q)
    home_country = country_counts.most_common(1)[0][0].upper()
    return 1 if curr != home_country else 0


