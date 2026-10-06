from datetime import datetime, timezone
from uuid import uuid4

from sqlalchemy import DateTime, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String(191), primary_key=True, default=lambda: uuid4().hex)
    name: Mapped[str | None] = mapped_column(String(191), nullable=True)
    email: Mapped[str] = mapped_column(String(191), unique=True, index=True, nullable=False)
    password: Mapped[str] = mapped_column(String(255), nullable=False)
    image: Mapped[str | None] = mapped_column(String(500), nullable=True)
    level: Mapped[int] = mapped_column(Integer, default=1)
    total_words: Mapped[int] = mapped_column(Integer, default=0)
    mastered_words: Mapped[int] = mapped_column(Integer, default=0)
    streak: Mapped[int] = mapped_column(Integer, default=0)
    xp: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)

    word_progress = relationship("UserWordProgress", back_populates="user", cascade="all, delete-orphan")
    review_records = relationship("WordReviewRecord", back_populates="user", cascade="all, delete-orphan")
    check_ins = relationship("DailyCheckIn", back_populates="user", cascade="all, delete-orphan")
    writing_records = relationship("WritingRecord", back_populates="user", cascade="all, delete-orphan")
    resolved_weaknesses = relationship("ResolvedWeakness", back_populates="user", cascade="all, delete-orphan")
