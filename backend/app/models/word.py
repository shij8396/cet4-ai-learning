from datetime import datetime, timezone
from uuid import uuid4

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, JSON, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


class Word(Base):
    __tablename__ = "words"

    id: Mapped[str] = mapped_column(String(191), primary_key=True, default=lambda: uuid4().hex)
    word: Mapped[str] = mapped_column(String(191), unique=True, index=True, nullable=False)
    phonetic: Mapped[str | None] = mapped_column(String(191), nullable=True)
    meaning: Mapped[str] = mapped_column(Text, nullable=False)
    part_of_speech: Mapped[str | None] = mapped_column(String(64), nullable=True)
    level: Mapped[str] = mapped_column(String(32), default="cet4", index=True)
    frequency: Mapped[int] = mapped_column(Integer, default=0, index=True)
    example: Mapped[str | None] = mapped_column(Text, nullable=True)
    example_cn: Mapped[str | None] = mapped_column(Text, nullable=True)
    tags: Mapped[list[str]] = mapped_column(JSON, default=list)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)

    progress = relationship("UserWordProgress", back_populates="word", cascade="all, delete-orphan")
    review_records = relationship("WordReviewRecord", back_populates="word", cascade="all, delete-orphan")


class UserWordProgress(Base):
    __tablename__ = "user_word_progress"
    __table_args__ = (UniqueConstraint("user_id", "word_id", name="uq_user_word_progress_user_word"),)

    id: Mapped[str] = mapped_column(String(191), primary_key=True, default=lambda: uuid4().hex)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    word_id: Mapped[str] = mapped_column(ForeignKey("words.id", ondelete="CASCADE"), index=True)
    mastery_level: Mapped[int] = mapped_column(Integer, default=0)
    review_count: Mapped[int] = mapped_column(Integer, default=0)
    wrong_count: Mapped[int] = mapped_column(Integer, default=0)
    last_review_time: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    next_review_time: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    is_favorite: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)

    user = relationship("User", back_populates="word_progress")
    word = relationship("Word", back_populates="progress")


class WordReviewRecord(Base):
    __tablename__ = "word_review_records"

    id: Mapped[str] = mapped_column(String(191), primary_key=True, default=lambda: uuid4().hex)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    word_id: Mapped[str] = mapped_column(ForeignKey("words.id", ondelete="CASCADE"), index=True)
    result: Mapped[str] = mapped_column(String(32), nullable=False)
    review_type: Mapped[str] = mapped_column(String(64), default="recognition")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, index=True)

    user = relationship("User", back_populates="review_records")
    word = relationship("Word", back_populates="review_records")
