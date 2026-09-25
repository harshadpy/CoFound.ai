import os
from datetime import datetime
from typing import Dict, Any, List, Optional
from sqlalchemy import create_engine, Column, String, Integer, Text, JSON, DateTime, desc
from sqlalchemy.orm import declarative_base, sessionmaker, scoped_session

DB_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(DB_DIR, "cofound.db")
DATABASE_URL = f"sqlite:///{DB_PATH}"

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False},
    echo=False
)
SessionLocal = scoped_session(sessionmaker(autocommit=False, autoflush=False, bind=engine))
Base = declarative_base()

DEFAULT_AGENT_STATUSES = {
    "structure": "pending",
    "ideation": "pending",
    "similarity": "pending",
    "validation": "pending",
    "trend": "pending",
    "competitor": "pending",
    "feasibility": "pending",
    "synthesis": "pending",
    "critic": "pending",
    "decision": "pending",
    "report": "pending"
}

class AnalysisRecord(Base):
    __tablename__ = "analyses"

    id = Column(String(64), primary_key=True, index=True)
    user_id = Column(String(64), default="default_user", index=True)
    raw_text = Column(Text, nullable=False)
    context_tags = Column(JSON, default=dict)
    status = Column(String(32), default="pending", index=True)
    progress_percentage = Column(Integer, default=0)
    agent_statuses = Column(JSON, default=lambda: dict(DEFAULT_AGENT_STATUSES))
    agent_metrics = Column(JSON, default=dict)
    result = Column(JSON, nullable=True)
    error = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "user_id": self.user_id,
            "raw_text": self.raw_text,
            "context_tags": self.context_tags or {},
            "status": self.status,
            "progress_percentage": self.progress_percentage,
            "agent_statuses": self.agent_statuses or dict(DEFAULT_AGENT_STATUSES),
            "agent_metrics": self.agent_metrics or {},
            "result": self.result,
            "error": self.error,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None
        }

def init_db():
    """Create tables if they do not exist."""
    Base.metadata.create_all(bind=engine)

def create_analysis(
    analysis_id: str,
    raw_text: str,
    context_tags: Optional[Dict[str, Any]] = None,
    user_id: str = "default_user"
) -> Dict[str, Any]:
    """Inserts a new analysis record into SQLite."""
    session = SessionLocal()
    try:
        record = AnalysisRecord(
            id=analysis_id,
            user_id=user_id,
            raw_text=raw_text,
            context_tags=context_tags or {},
            status="pending",
            progress_percentage=0,
            agent_statuses=dict(DEFAULT_AGENT_STATUSES),
            agent_metrics={},
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        session.add(record)
        session.commit()
        session.refresh(record)
        return record.to_dict()
    finally:
        session.close()

def update_analysis_status(
    analysis_id: str,
    status: str,
    error: Optional[str] = None,
    result: Optional[Dict[str, Any]] = None,
    progress_percentage: Optional[int] = None
) -> Optional[Dict[str, Any]]:
    """Updates overall status, error, and final result."""
    session = SessionLocal()
    try:
        record = session.query(AnalysisRecord).filter(AnalysisRecord.id == analysis_id).first()
        if not record:
            return None
        record.status = status
        record.updated_at = datetime.utcnow()
        if error is not None:
            record.error = error
        if result is not None:
            record.result = result
        if progress_percentage is not None:
            record.progress_percentage = progress_percentage
        elif status == "completed":
            record.progress_percentage = 100
        session.commit()
        session.refresh(record)
        return record.to_dict()
    finally:
        session.close()

def save_analysis_result(analysis_id: str, result: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """Convenience method to save completed state results."""
    return update_analysis_status(analysis_id, status="completed", result=result, progress_percentage=100)


def update_agent_progress(
    analysis_id: str,
    node_name: str,
    node_status: str = "completed",
    metric_label: Optional[str] = None
) -> Optional[Dict[str, Any]]:
    """Updates an individual agent's execution status and recalculates total progress."""
    session = SessionLocal()
    try:
        record = session.query(AnalysisRecord).filter(AnalysisRecord.id == analysis_id).first()
        if not record:
            return None
        
        statuses = dict(record.agent_statuses or DEFAULT_AGENT_STATUSES)
        statuses[node_name] = node_status
        record.agent_statuses = statuses

        if metric_label:
            metrics = dict(record.agent_metrics or {})
            metrics[node_name] = metric_label
            record.agent_metrics = metrics

        total_nodes = len(DEFAULT_AGENT_STATUSES)
        completed_nodes = sum(1 for s in statuses.values() if s == "completed")
        record.progress_percentage = int((completed_nodes / total_nodes) * 100)
        record.updated_at = datetime.utcnow()

        session.commit()
        session.refresh(record)
        return record.to_dict()
    finally:
        session.close()

def get_analysis(analysis_id: str) -> Optional[Dict[str, Any]]:
    """Fetches a single analysis record by ID."""
    session = SessionLocal()
    try:
        record = session.query(AnalysisRecord).filter(AnalysisRecord.id == analysis_id).first()
        return record.to_dict() if record else None
    finally:
        session.close()

def list_analyses(limit: int = 50) -> List[Dict[str, Any]]:
    """Returns past analyses ordered by created_at descending."""
    session = SessionLocal()
    try:
        records = session.query(AnalysisRecord).order_by(desc(AnalysisRecord.created_at)).limit(limit).all()
        return [r.to_dict() for r in records]
    finally:
        session.close()

def delete_analysis(analysis_id: str) -> bool:
    """Deletes an analysis record by ID. Returns True if deleted, False if not found."""
    session = SessionLocal()
    try:
        record = session.query(AnalysisRecord).filter(AnalysisRecord.id == analysis_id).first()
        if not record:
            return False
        session.delete(record)
        session.commit()
        return True
    finally:
        session.close()

