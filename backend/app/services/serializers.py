from datetime import datetime

from app.models.user import User
from app.models.word import UserWordProgress, Word


def normalize_tags(value: object) -> list[str]:
    if isinstance(value, list):
        return [str(item) for item in value]
    if isinstance(value, str):
        return [value] if value else []
    return []


def iso_or_none(value: datetime | None) -> str | None:
    return value.isoformat() if value else None


def serialize_user(user: User) -> dict:
    return {
        "id": user.id,
        "email": user.email,
        "name": user.name,
        "image": user.image,
        "level": user.level,
        "totalWords": user.total_words,
        "masteredWords": user.mastered_words,
        "streak": user.streak,
        "xp": user.xp,
    }


def serialize_progress(progress: UserWordProgress | None) -> dict | None:
    if progress is None:
        return None
    return {
        "id": progress.id,
        "masteryLevel": progress.mastery_level,
        "reviewCount": progress.review_count,
        "wrongCount": progress.wrong_count,
        "isFavorite": progress.is_favorite,
        "lastReviewTime": iso_or_none(progress.last_review_time),
        "nextReviewTime": iso_or_none(progress.next_review_time),
    }


def serialize_word(word: Word, progress: UserWordProgress | None = None) -> dict:
    return {
        "id": word.id,
        "word": word.word,
        "phonetic": word.phonetic,
        "meaning": word.meaning,
        "partOfSpeech": word.part_of_speech,
        "level": word.level,
        "frequency": word.frequency,
        "example": word.example,
        "exampleCn": word.example_cn,
        "tags": normalize_tags(word.tags),
        "progress": serialize_progress(progress),
    }
