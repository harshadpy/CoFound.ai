import hashlib
import json
from datetime import datetime, timedelta
from typing import Any, Optional, Dict
from sqlalchemy import Column, String, JSON, DateTime
from data.database import Base, engine, SessionLocal
from utils.logger import logger

class CacheEntry(Base):
    __tablename__ = "cache_entries"

    key = Column(String(64), primary_key=True, index=True)  # SHA-256
    namespace = Column(String(32), index=True, nullable=False)
    query_preview = Column(String(255), nullable=True)
    value = Column(JSON, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    expires_at = Column(DateTime, index=True, nullable=False)

def init_cache_table():
    """Ensures cache_entries table exists in SQLite database."""
    Base.metadata.create_all(bind=engine, tables=[CacheEntry.__table__])

def compute_cache_key(namespace: str, raw_key: str) -> str:
    """Computes a deterministic SHA-256 hash for a namespace and key."""
    normalized = f"{namespace}:{raw_key.strip().lower()}"
    return hashlib.sha256(normalized.encode("utf-8")).hexdigest()

def get_cached(namespace: str, raw_key: str) -> Optional[Any]:
    """
    Retrieves a cached value if present and unexpired.
    Returns None if missing or expired.
    """
    key = compute_cache_key(namespace, raw_key)
    session = SessionLocal()
    try:
        entry = session.query(CacheEntry).filter(CacheEntry.key == key).first()
        if not entry:
            return None

        # Check TTL expiration
        if entry.expires_at < datetime.utcnow():
            session.delete(entry)
            session.commit()
            return None

        logger.info("cache_hit", namespace=namespace, preview=entry.query_preview)
        return entry.value
    except Exception as e:
        logger.warning("cache_get_error", error=str(e), namespace=namespace)
        return None
    finally:
        session.close()

def set_cached(
    namespace: str,
    raw_key: str,
    value: Any,
    ttl_seconds: int = 86400,
    query_preview: Optional[str] = None
) -> bool:
    """
    Saves or updates a cached item with an expiration timestamp.
    Default TTL is 24 hours (86,400 seconds).
    """
    key = compute_cache_key(namespace, raw_key)
    expires_at = datetime.utcnow() + timedelta(seconds=ttl_seconds)
    preview = query_preview or raw_key[:120]

    session = SessionLocal()
    try:
        entry = session.query(CacheEntry).filter(CacheEntry.key == key).first()
        if entry:
            entry.value = value
            entry.query_preview = preview
            entry.created_at = datetime.utcnow()
            entry.expires_at = expires_at
        else:
            entry = CacheEntry(
                key=key,
                namespace=namespace,
                query_preview=preview,
                value=value,
                created_at=datetime.utcnow(),
                expires_at=expires_at
            )
            session.add(entry)
        session.commit()
        logger.info("cache_saved", namespace=namespace, preview=preview, ttl_seconds=ttl_seconds)
        return True
    except Exception as e:
        session.rollback()
        logger.warning("cache_set_error", error=str(e), namespace=namespace)
        return False
    finally:
        session.close()

def clear_expired() -> int:
    """Removes all expired entries across all namespaces."""
    session = SessionLocal()
    try:
        now = datetime.utcnow()
        deleted = session.query(CacheEntry).filter(CacheEntry.expires_at < now).delete()
        session.commit()
        return deleted
    except Exception as e:
        session.rollback()
        logger.warning("cache_clear_expired_error", error=str(e))
        return 0
    finally:
        session.close()

def purge_cache(namespace: Optional[str] = None) -> int:
    """Purges entries for a specific namespace or all cache if namespace is None."""
    session = SessionLocal()
    try:
        query = session.query(CacheEntry)
        if namespace:
            query = query.filter(CacheEntry.namespace == namespace)
        deleted = query.delete()
        session.commit()
        return deleted
    except Exception as e:
        session.rollback()
        logger.warning("cache_purge_error", error=str(e))
        return 0
    finally:
        session.close()

def get_cache_stats() -> Dict[str, Any]:
    """Returns total entries and breakdown by namespace."""
    session = SessionLocal()
    try:
        now = datetime.utcnow()
        total = session.query(CacheEntry).count()
        valid = session.query(CacheEntry).filter(CacheEntry.expires_at >= now).count()
        expired = total - valid

        # Breakdown by namespace
        from sqlalchemy import func
        by_ns = session.query(CacheEntry.namespace, func.count(CacheEntry.key)).group_by(CacheEntry.namespace).all()
        namespace_counts = {ns: count for ns, count in by_ns}

        return {
            "total_entries": total,
            "valid_entries": valid,
            "expired_entries": expired,
            "by_namespace": namespace_counts
        }
    except Exception as e:
        logger.warning("cache_stats_error", error=str(e))
        return {"total_entries": 0, "valid_entries": 0, "expired_entries": 0, "by_namespace": {}}
    finally:
        session.close()

# Auto-initialize table on module import
init_cache_table()
