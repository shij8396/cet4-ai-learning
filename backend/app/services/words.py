from datetime import datetime, timedelta, timezone

from fastapi import HTTPException, status
from sqlalchemy import Select, func, or_, select
from sqlalchemy.orm import Session

from app.models.user import User
from app.models.word import UserWordProgress, Word, WordReviewRecord


def get_word_or_404(db: Session, word_id: str) -> Word:
    word = db.get(Word, word_id)
    if word is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Word not found")
    return word


def get_progress(db: Session, user_id: str, word_id: str) -> UserWordProgress | None:
    return db.scalar(
        select(UserWordProgress).where(
            UserWordProgress.user_id == user_id,
            UserWordProgress.word_id == word_id,
        ),
    )


def ensure_progress(db: Session, user: User, word: Word) -> UserWordProgress:
    progress = get_progress(db, user.id, word.id)
    if progress is not None:
        return progress
    progress = UserWordProgress(user_id=user.id, word_id=word.id)
    db.add(progress)
    db.flush()
    return progress


def build_words_query(q: str | None, level: str, tag: str | None, sort_by: str, sort_order: str) -> Select:
    query = select(Word).where(Word.level == level)
    if q:
        keyword = f"%{q}%"
        query = query.where(or_(Word.word.like(keyword), Word.meaning.like(keyword)))
    if tag:
        query = query.where(func.json_contains(Word.tags, f'"{tag}"') == 1)

    sort_column = {
        "frequency": Word.frequency,
        "word": Word.word,
        "createdAt": Word.created_at,
    }.get(sort_by, Word.frequency)
    if sort_order == "asc":
        query = query.order_by(sort_column.asc())
    else:
        query = query.order_by(sort_column.desc())
    return query


def apply_review(progress: UserWordProgress, result: str) -> None:
    now = datetime.now(timezone.utc)
    progress.review_count += 1
    progress.last_review_time = now
    if result == "correct":
        progress.mastery_level = min(5, progress.mastery_level + 1)
    elif result == "wrong":
        progress.wrong_count += 1
        progress.mastery_level = max(0, progress.mastery_level - 1)
    progress.next_review_time = now + timedelta(days=max(1, progress.mastery_level + 1))


def record_review(db: Session, user: User, word: Word, result: str, review_type: str) -> UserWordProgress:
    progress = ensure_progress(db, user, word)
    apply_review(progress, result)
    db.add(
        WordReviewRecord(
            user_id=user.id,
            word_id=word.id,
            result=result,
            review_type=review_type,
        ),
    )
    db.commit()
    db.refresh(progress)
    return progress
