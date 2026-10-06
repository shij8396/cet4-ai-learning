from math import ceil

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_optional_user
from app.db.session import get_db
from app.models.user import User
from app.models.word import UserWordProgress, Word
from app.schemas.word import (
    FavoriteEnvelope,
    ProgressEnvelope,
    ProgressUpdateRequest,
    ReviewRequest,
    WordsResponse,
)
from app.services.serializers import serialize_progress, serialize_word
from app.services.words import build_words_query, ensure_progress, get_progress, get_word_or_404, record_review

router = APIRouter()


@router.get("/list")
def word_list(
    limit: int = Query(default=5000, ge=1, le=10000),
    db: Session = Depends(get_db),
) -> dict:
    words = db.scalars(
        select(Word)
        .where(Word.level == "cet4")
        .order_by(Word.frequency.desc(), Word.word.asc())
        .limit(limit),
    ).all()
    return {"words": [{"id": word.id, "word": word.word} for word in words]}


@router.get("", response_model=WordsResponse)
def list_words(
    q: str | None = None,
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=50, ge=1, le=500),
    level: str = "cet4",
    tag: str | None = None,
    sortBy: str = "frequency",
    sortOrder: str = "desc",
    includeProgress: bool = True,
    includeTotal: bool = False,
    db: Session = Depends(get_db),
    current_user: User | None = Depends(get_optional_user),
) -> dict:
    query = build_words_query(q, level, tag, sortBy, sortOrder)
    total = db.scalar(select(func.count()).select_from(query.subquery())) if includeTotal else None
    words = db.scalars(query.offset((page - 1) * limit).limit(limit)).all()

    progress_by_word: dict[str, UserWordProgress] = {}
    if includeProgress and current_user is not None and words:
        progress_rows = db.scalars(
            select(UserWordProgress).where(
                UserWordProgress.user_id == current_user.id,
                UserWordProgress.word_id.in_([word.id for word in words]),
            ),
        ).all()
        progress_by_word = {progress.word_id: progress for progress in progress_rows}

    return {
        "words": [serialize_word(word, progress_by_word.get(word.id)) for word in words],
        "pagination": {
            "page": page,
            "limit": limit,
            "total": total,
            "totalPages": ceil(total / limit) if total is not None else None,
        },
    }


@router.get("/favorites", response_model=WordsResponse)
def favorites(
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=100, ge=1, le=500),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> dict:
    base = (
        select(Word, UserWordProgress)
        .join(UserWordProgress, UserWordProgress.word_id == Word.id)
        .where(UserWordProgress.user_id == current_user.id, UserWordProgress.is_favorite.is_(True))
        .order_by(UserWordProgress.updated_at.desc())
    )
    total = db.scalar(
        select(func.count()).select_from(
            select(UserWordProgress.id)
            .where(UserWordProgress.user_id == current_user.id, UserWordProgress.is_favorite.is_(True))
            .subquery(),
        ),
    )
    rows = db.execute(base.offset((page - 1) * limit).limit(limit)).all()
    return {
        "words": [serialize_word(word, progress) for word, progress in rows],
        "pagination": {"page": page, "limit": limit, "total": total, "totalPages": ceil(total / limit) if total else 0},
    }


@router.get("/wrong", response_model=WordsResponse)
def wrong_words(
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=100, ge=1, le=500),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> dict:
    base = (
        select(Word, UserWordProgress)
        .join(UserWordProgress, UserWordProgress.word_id == Word.id)
        .where(UserWordProgress.user_id == current_user.id, UserWordProgress.wrong_count > 0)
        .order_by(UserWordProgress.wrong_count.desc(), UserWordProgress.updated_at.desc())
    )
    total = db.scalar(
        select(func.count()).select_from(
            select(UserWordProgress.id)
            .where(UserWordProgress.user_id == current_user.id, UserWordProgress.wrong_count > 0)
            .subquery(),
        ),
    )
    rows = db.execute(base.offset((page - 1) * limit).limit(limit)).all()
    return {
        "words": [serialize_word(word, progress) for word, progress in rows],
        "pagination": {"page": page, "limit": limit, "total": total, "totalPages": ceil(total / limit) if total else 0},
    }


@router.get("/{word_id}")
def word_detail(
    word_id: str,
    db: Session = Depends(get_db),
    current_user: User | None = Depends(get_optional_user),
) -> dict:
    word = get_word_or_404(db, word_id)
    progress = get_progress(db, current_user.id, word.id) if current_user is not None else None
    return serialize_word(word, progress)


@router.post("/{word_id}/favorite", response_model=FavoriteEnvelope)
def toggle_favorite(
    word_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> dict:
    word = get_word_or_404(db, word_id)
    progress = ensure_progress(db, current_user, word)
    progress.is_favorite = not progress.is_favorite
    db.commit()
    db.refresh(progress)
    return {"isFavorite": progress.is_favorite, "progress": serialize_progress(progress)}


@router.post("/{word_id}/progress", response_model=ProgressEnvelope)
def update_progress(
    word_id: str,
    payload: ProgressUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> dict:
    word = get_word_or_404(db, word_id)
    progress = ensure_progress(db, current_user, word)
    progress.mastery_level = payload.masteryLevel
    db.commit()
    db.refresh(progress)
    return {"progress": serialize_progress(progress)}


@router.post("/{word_id}/review", response_model=ProgressEnvelope)
def review_word(
    word_id: str,
    payload: ReviewRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> dict:
    word = get_word_or_404(db, word_id)
    progress = record_review(db, current_user, word, payload.result, payload.reviewType)
    return {"progress": serialize_progress(progress)}
