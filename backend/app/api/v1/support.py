from collections import defaultdict
from datetime import date, datetime, time, timedelta, timezone
import re
from zoneinfo import ZoneInfo

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field
from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.config import get_settings
from app.db.session import get_db
from app.models.learning import DailyCheckIn, ResolvedWeakness, WritingRecord
from app.models.user import User
from app.models.word import UserWordProgress, Word, WordReviewRecord

router = APIRouter()
settings = get_settings()


class VocabularyValidateRequest(BaseModel):
    text: str
    checkLemmas: bool = False


class WritingRecordRequest(BaseModel):
    title: str | None = Field(default=None, max_length=255)
    content: str = Field(min_length=1)
    score: int | None = Field(default=None, ge=0, le=100)
    grammarErrors: object | None = None
    spellingErrors: object | None = None
    outOfLevelWords: list[str] | None = None
    vocabularyCoverage: float | None = Field(default=None, ge=0, le=1)
    writingTime: int | None = Field(default=None, ge=0)


class WritingAssistantRequest(BaseModel):
    content: str | None = None
    text: str | None = None
    chineseIdea: str | None = None
    originalText: str | None = None
    maxWords: int | None = Field(default=None, ge=1, le=500)


ACHIEVEMENTS = [
    ("streak_3", "初出茅庐", "连续学习3天", "🔥", "streak", 3, 30),
    ("streak_7", "一周之星", "连续学习7天", "⭐", "streak", 7, 70),
    ("streak_30", "月度学霸", "连续学习30天", "💎", "streak", 30, 300),
    ("words_50", "初学者", "掌握50个单词", "📖", "vocabulary", 50, 50),
    ("words_200", "单词达人", "掌握200个单词", "📚", "vocabulary", 200, 200),
    ("words_500", "词汇大师", "掌握500个单词", "🏆", "vocabulary", 500, 500),
    ("writing_5", "作文起步", "完成5篇作文", "✏️", "writing", 5, 50),
    ("writing_20", "写作达人", "完成20篇作文", "🖊️", "writing", 20, 200),
    ("xp_1000", "千分达人", "累计获得1000经验值", "💪", "general", 1000, 100),
]


def local_today() -> date:
    return datetime.now(ZoneInfo(settings.app_timezone)).date()


def utc_day_bounds(day: date) -> tuple[datetime, datetime]:
    local_zone = ZoneInfo(settings.app_timezone)
    start = datetime.combine(day, time.min, tzinfo=local_zone).astimezone(timezone.utc)
    return start, start + timedelta(days=1)


def count_words(content: str) -> int:
    return len(re.findall(r"[A-Za-z]+(?:'[A-Za-z]+)?", content))


def serialize_writing(record: WritingRecord) -> dict:
    return {
        "id": record.id,
        "title": record.title or "未命名作文",
        "content": record.content,
        "score": record.score,
        "createdAt": record.created_at.isoformat(),
        "updatedAt": record.updated_at.isoformat(),
        "wordCount": record.word_count,
        "grammarErrors": record.grammar_errors,
        "spellingErrors": record.spelling_errors,
        "outOfLevelWords": record.out_of_level_words,
        "vocabularyCoverage": record.vocabulary_coverage,
        "writingTime": record.writing_time,
    }


def error_words(value: object) -> list[str]:
    if not isinstance(value, list):
        return []
    words: list[str] = []
    for item in value:
        if isinstance(item, str):
            words.append(item)
        elif isinstance(item, dict):
            candidate = item.get("word") or item.get("originalText")
            if isinstance(candidate, str):
                words.append(candidate)
    return words


def weakness_items(db: Session, user_id: str) -> list[dict]:
    rows = db.execute(
        select(UserWordProgress, Word)
        .join(Word, Word.id == UserWordProgress.word_id)
        .where(UserWordProgress.user_id == user_id, UserWordProgress.wrong_count > 0)
        .order_by(UserWordProgress.wrong_count.desc(), UserWordProgress.updated_at.desc())
    ).all()
    writings = db.scalars(
        select(WritingRecord)
        .where(WritingRecord.user_id == user_id)
        .order_by(WritingRecord.updated_at.desc())
        .limit(50)
    ).all()
    resolved = {
        (item.weakness_type, item.ref_id)
        for item in db.scalars(
            select(ResolvedWeakness).where(ResolvedWeakness.user_id == user_id)
        ).all()
    }

    items: list[dict] = []
    for progress, word in rows:
        if ("word", word.id) in resolved:
            continue
        priority = min(10, 3 + progress.wrong_count)
        items.append(
            {
                "id": f"word:{word.id}",
                "type": "word",
                "title": word.word,
                "description": f"{word.meaning} · 错 {progress.wrong_count} 次 · 掌握度 {progress.mastery_level}/5",
                "sources": ["单词错题"],
                "actionHref": f"/words/{word.id}",
                "priority": priority,
                "severity": "high" if priority >= 6 else "medium",
                "status": "open",
                "lastSeenAt": progress.updated_at.isoformat() if progress.updated_at else None,
                "refId": word.id,
            }
        )

    for record in writings:
        problem_words = list(dict.fromkeys((record.out_of_level_words or []) + error_words(record.spelling_errors)))
        if not problem_words or ("writing", record.id) in resolved:
            continue
        items.append(
            {
                "id": f"writing:{record.id}",
                "type": "writing",
                "title": problem_words[0],
                "description": f"作文《{record.title or '未命名作文'}》中有 {len(problem_words)} 个问题词",
                "sources": ["作文问题词"],
                "actionHref": "/writing",
                "priority": min(10, 2 + len(problem_words)),
                "severity": "high" if len(problem_words) >= 4 else "medium",
                "status": "open",
                "lastSeenAt": record.updated_at.isoformat(),
                "refId": record.id,
            }
        )
    return sorted(items, key=lambda item: (-item["priority"], item["title"]))


def analytics_payload(db: Session, user: User, days: int) -> dict:
    today_date = local_today()
    first_date = today_date - timedelta(days=days - 1)
    start, _ = utc_day_bounds(first_date)
    _, end = utc_day_bounds(today_date)

    reviews = db.scalars(
        select(WordReviewRecord).where(
            WordReviewRecord.user_id == user.id,
            WordReviewRecord.created_at >= start,
            WordReviewRecord.created_at < end,
        )
    ).all()
    writings = db.scalars(
        select(WritingRecord).where(
            WritingRecord.user_id == user.id,
            WritingRecord.created_at >= start,
            WritingRecord.created_at < end,
        )
    ).all()
    checkins = db.scalars(
        select(DailyCheckIn).where(
            DailyCheckIn.user_id == user.id,
            DailyCheckIn.checkin_date >= first_date,
            DailyCheckIn.checkin_date <= today_date,
        )
    ).all()

    buckets: dict[date, dict] = defaultdict(
        lambda: {"reviewed": 0, "learnedIds": set(), "writingCount": 0, "writingSeconds": 0, "xp": 0}
    )
    local_zone = ZoneInfo(settings.app_timezone)
    for review in reviews:
        stamp = review.created_at
        if stamp.tzinfo is None:
            stamp = stamp.replace(tzinfo=timezone.utc)
        bucket = buckets[stamp.astimezone(local_zone).date()]
        bucket["reviewed"] += 1
        if review.result == "correct":
            bucket["learnedIds"].add(review.word_id)
    for writing in writings:
        stamp = writing.created_at
        if stamp.tzinfo is None:
            stamp = stamp.replace(tzinfo=timezone.utc)
        bucket = buckets[stamp.astimezone(local_zone).date()]
        bucket["writingCount"] += 1
        bucket["writingSeconds"] += writing.writing_time
    for checkin in checkins:
        buckets[checkin.checkin_date]["xp"] += checkin.xp_awarded

    history = []
    for offset in range(days):
        day = first_date + timedelta(days=offset)
        bucket = buckets[day]
        history.append(
            {
                "date": day.isoformat(),
                "studyMinutes": round(bucket["writingSeconds"] / 60),
                "xpGained": bucket["xp"],
                "wordsLearned": len(bucket["learnedIds"]),
            }
        )

    total_words = db.scalar(select(func.count()).select_from(Word)) or 0
    mastered_words = db.scalar(
        select(func.count()).select_from(UserWordProgress).where(
            UserWordProgress.user_id == user.id, UserWordProgress.mastery_level >= 4
        )
    ) or 0
    total_reviews = db.scalar(
        select(func.count()).select_from(WordReviewRecord).where(WordReviewRecord.user_id == user.id)
    ) or 0
    total_writings = db.scalar(
        select(func.count()).select_from(WritingRecord).where(WritingRecord.user_id == user.id)
    ) or 0
    total_writing_seconds = db.scalar(
        select(func.coalesce(func.sum(WritingRecord.writing_time), 0)).where(WritingRecord.user_id == user.id)
    ) or 0

    today_bucket = buckets[today_date]
    today = {
        "wordsLearned": len(today_bucket["learnedIds"]),
        "wordsReviewed": today_bucket["reviewed"],
        "articlesRead": 0,
        "dictations": 0,
        "writingCount": today_bucket["writingCount"],
        "studyMinutes": round(today_bucket["writingSeconds"] / 60),
        "xpGained": today_bucket["xp"],
    }
    return {
        "today": today,
        "user": {
            "masteredWords": mastered_words,
            "totalWords": total_words,
            "streak": user.streak,
            "level": user.level,
            "xp": user.xp,
        },
        "totals": {
            "wordsLearned": mastered_words,
            "wordsReviewed": total_reviews,
            "articlesRead": 0,
            "dictations": 0,
            "writingCount": total_writings,
            "studyMinutes": round(total_writing_seconds / 60),
            "xpGained": user.xp,
        },
        "history": history,
    }


@router.get("/analytics")
def analytics(
    days: int = Query(default=90, ge=1, le=365),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> dict:
    return analytics_payload(db, current_user, days)


@router.get("/dashboard/today")
def today_dashboard(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)) -> dict:
    today = analytics_payload(db, current_user, 1)["today"]
    weak_count = len(weakness_items(db, current_user.id))
    now = datetime.now(timezone.utc)
    due_count = db.scalar(
        select(func.count()).select_from(UserWordProgress).where(
            UserWordProgress.user_id == current_user.id,
            UserWordProgress.next_review_time.is_not(None),
            UserWordProgress.next_review_time <= now,
        )
    ) or 0
    current = {
        "words": today["wordsLearned"] + today["wordsReviewed"],
        "reading": today["articlesRead"],
        "dictation": today["dictations"],
        "writing": today["writingCount"],
    }
    templates = [
        ("words", "单词复习", "优先处理到期复习词和错词", "/learn", 100, 3 + min(7, due_count // 20), "review" if due_count else "system", 9),
        ("reading", "阅读训练", "完成 1 篇分级阅读并复盘生词", "/reading", 1, 2, "system", 12),
        ("dictation", "默写练习", "从错词和未掌握词中完成 1 组默写", "/dictation", 1, 6 if weak_count else 3, "weakness" if weak_count else "system", 18),
        ("writing", "作文练习", "完成 1 篇四级作文并复盘问题词", "/writing", 1, 2 if current["writing"] else 4, "progress" if current["writing"] else "system", 21),
    ]
    tasks = []
    completed = 0
    for task_type, title, description, href, target, priority, source, due_hour in templates:
        progress = min(100, round(current[task_type] / target * 100))
        task_status = "done" if progress == 100 else "active" if progress else "pending"
        completed += task_status == "done"
        tasks.append(
            {
                "type": task_type,
                "title": title,
                "description": description,
                "href": href,
                "target": target,
                "current": current[task_type],
                "progress": progress,
                "status": task_status,
                "priority": priority,
                "dueAt": datetime.combine(local_today(), time(hour=due_hour), ZoneInfo(settings.app_timezone)).isoformat(),
                "source": source,
            }
        )
    tasks.sort(key=lambda task: task["priority"], reverse=True)
    return {
        "summary": {
            **today,
            "weakPointCount": weak_count,
            "dueWordCount": due_count,
            "unreadArticleCount": 0,
            "unresolvedWeaknessCount": weak_count,
            "lastWritingAt": None,
            "completedTasks": completed,
            "totalTasks": len(tasks),
        },
        "tasks": tasks,
    }


@router.get("/achievements")
def achievements(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)) -> dict:
    mastered = db.scalar(
        select(func.count()).select_from(UserWordProgress).where(
            UserWordProgress.user_id == current_user.id, UserWordProgress.mastery_level >= 4
        )
    ) or 0
    writing_count = db.scalar(
        select(func.count()).select_from(WritingRecord).where(WritingRecord.user_id == current_user.id)
    ) or 0
    values = {"streak": current_user.streak, "vocabulary": mastered, "writing": writing_count, "general": current_user.xp}
    result = []
    for key, name, description, icon, category, requirement, reward in ACHIEVEMENTS:
        progress = values[category]
        result.append(
            {
                "key": key,
                "name": name,
                "description": description,
                "icon": icon,
                "category": category,
                "requirement": requirement,
                "xpReward": reward,
                "progress": min(progress, requirement),
                "isUnlocked": progress >= requirement,
                "unlockedAt": None,
            }
        )
    unlocked = sum(item["isUnlocked"] for item in result)
    return {
        "achievements": result,
        "unlockedCount": unlocked,
        "totalCount": len(result),
        "completionRate": round(unlocked / len(result) * 100),
    }


@router.get("/checkin")
def get_checkin(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)) -> dict:
    checked_in = db.scalar(
        select(DailyCheckIn).where(
            DailyCheckIn.user_id == current_user.id, DailyCheckIn.checkin_date == local_today()
        )
    )
    return {"checkedInToday": checked_in is not None, "todayStreak": current_user.streak}


@router.post("/checkin")
def post_checkin(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)) -> dict:
    today_date = local_today()
    existing = db.scalar(
        select(DailyCheckIn).where(
            DailyCheckIn.user_id == current_user.id, DailyCheckIn.checkin_date == today_date
        )
    )
    if existing is not None:
        return {"checkedIn": False, "alreadyCheckedIn": True, "streak": existing.streak_after, "xpBonus": 0}

    latest = db.scalar(
        select(DailyCheckIn)
        .where(DailyCheckIn.user_id == current_user.id)
        .order_by(DailyCheckIn.checkin_date.desc())
        .limit(1)
    )
    streak = latest.streak_after + 1 if latest and latest.checkin_date == today_date - timedelta(days=1) else 1
    checkin = DailyCheckIn(user_id=current_user.id, checkin_date=today_date, streak_after=streak, xp_awarded=10)
    current_user.streak = streak
    current_user.xp += 10
    db.add(checkin)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        existing = db.scalar(
            select(DailyCheckIn).where(
                DailyCheckIn.user_id == current_user.id, DailyCheckIn.checkin_date == today_date
            )
        )
        return {"checkedIn": False, "alreadyCheckedIn": True, "streak": existing.streak_after if existing else streak, "xpBonus": 0}
    return {"checkedIn": True, "alreadyCheckedIn": False, "streak": streak, "xpBonus": 10}


@router.get("/weakness")
def weakness(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)) -> dict:
    return {"items": weakness_items(db, current_user.id)}


@router.post("/weakness/{weakness_type}/{ref_id}/resolve")
def resolve_weakness(
    weakness_type: str,
    ref_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> dict:
    if weakness_type not in {"word", "writing"}:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Unsupported weakness type")
    existing = db.scalar(
        select(ResolvedWeakness).where(
            ResolvedWeakness.user_id == current_user.id,
            ResolvedWeakness.weakness_type == weakness_type,
            ResolvedWeakness.ref_id == ref_id,
        )
    )
    if existing is None:
        db.add(ResolvedWeakness(user_id=current_user.id, weakness_type=weakness_type, ref_id=ref_id))
        db.commit()
    return {"success": True}


@router.get("/reading")
def reading_list(page: int = 1, limit: int = 20) -> dict:
    return {"articles": [], "pagination": {"page": page, "limit": limit, "total": 0, "totalPages": 0}}


@router.get("/reading/{article_id}")
def reading_detail(article_id: str) -> dict:
    return {
        "id": article_id,
        "title": "Reading content unavailable",
        "content": "",
        "level": 1,
        "tags": [],
        "wordCount": 0,
        "estimatedTime": 1,
        "progress": None,
    }


@router.post("/reading/{_article_id}/progress")
def reading_progress(_article_id: str) -> dict:
    return {"success": True}


@router.post("/vocabulary/validate")
def vocabulary_validate(payload: VocabularyValidateRequest, db: Session = Depends(get_db)) -> dict:
    token = payload.text.strip().lower()
    word = db.scalar(select(Word).where(func.lower(Word.word) == token))
    return {
        "word": payload.text,
        "phonetic": word.phonetic if word else None,
        "meaning": word.meaning if word else "",
        "example": word.example if word else None,
        "exampleCn": word.example_cn if word else None,
        "partOfSpeech": word.part_of_speech if word else None,
        "isInWordList": word is not None,
        "isCET4": word is not None,
        "suggestions": [],
        "lemma": word.word if word else token,
    }


@router.get("/vocabulary/writing")
def writing_history(
    id: str | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> dict:
    if id is not None:
        record = db.scalar(
            select(WritingRecord).where(WritingRecord.id == id, WritingRecord.user_id == current_user.id)
        )
        if record is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Writing record not found")
        return serialize_writing(record)
    records = db.scalars(
        select(WritingRecord)
        .where(WritingRecord.user_id == current_user.id)
        .order_by(WritingRecord.created_at.desc())
        .limit(100)
    ).all()
    return {"records": [serialize_writing(record) for record in records]}


@router.post("/vocabulary/writing", status_code=status.HTTP_201_CREATED)
def save_writing(
    payload: WritingRecordRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> dict:
    content = payload.content.strip()
    record = WritingRecord(
        user_id=current_user.id,
        title=payload.title.strip() if payload.title else None,
        content=content,
        score=payload.score,
        grammar_errors=payload.grammarErrors or [],
        spelling_errors=payload.spellingErrors or [],
        out_of_level_words=list(dict.fromkeys(payload.outOfLevelWords or [])),
        vocabulary_coverage=payload.vocabularyCoverage,
        writing_time=payload.writingTime or 0,
        word_count=count_words(content),
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return {"id": record.id}


@router.delete("/vocabulary/writing")
def delete_writing(
    id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> dict:
    record = db.scalar(
        select(WritingRecord).where(WritingRecord.id == id, WritingRecord.user_id == current_user.id)
    )
    if record is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Writing record not found")
    db.delete(record)
    db.commit()
    return {"success": True}


@router.post("/vocabulary/writing/assistant")
def writing_assistant(payload: WritingAssistantRequest) -> dict:
    idea = (payload.chineseIdea or payload.content or payload.text or "").strip()
    if not idea:
        return {"suggestions": [], "usedWords": []}
    suggestion = f"In my opinion, {idea}."
    return {"suggestions": [suggestion], "usedWords": re.findall(r"[A-Za-z]+", suggestion.lower())}


@router.post("/vocabulary/writing/simplify")
def writing_simplify(payload: WritingAssistantRequest) -> dict:
    text = payload.originalText or payload.text or payload.content or ""
    return {"simplifiedText": text, "changes": []}


@router.get("/admin/stats")
def admin_stats(
    db: Session = Depends(get_db),
    _current_user: User = Depends(get_current_user),
) -> dict:
    return {
        "users": db.scalar(select(func.count()).select_from(User)) or 0,
        "words": db.scalar(select(func.count()).select_from(Word)) or 0,
        "articles": 0,
        "dictationSessions": 0,
        "writingRecords": db.scalar(select(func.count()).select_from(WritingRecord)) or 0,
    }


@router.get("/ai/debug")
def ai_debug(_current_user: User = Depends(get_current_user)) -> dict:
    return {"stats": {"fastapi": {"calls": 0, "totalTokens": 0, "avgLatency": 0, "errors": 0}}}
