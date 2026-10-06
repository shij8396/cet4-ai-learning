import os
import sys
from pathlib import Path

os.environ.setdefault("DATABASE_URL", "sqlite+pysqlite:///:memory:")
os.environ.setdefault("REDIS_URL", "memory://")
os.environ.setdefault("JWT_SECRET_KEY", "test-secret")

BACKEND_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND_ROOT))

from fastapi.testclient import TestClient  # noqa: E402

from app.db.session import Base, engine  # noqa: E402
from app.main import app  # noqa: E402
from app.models.word import Word  # noqa: E402
from sqlalchemy.orm import Session  # noqa: E402


def setup_function():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)


client = TestClient(app)


def auth_headers(token: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {token}"}


def register_user(email: str = "test@example.com") -> dict:
    response = client.post(
        "/api/v1/auth/register",
        json={"email": email, "password": "secret123", "name": "Test User"},
    )
    assert response.status_code == 201
    return response.json()


def login_user(email: str = "test@example.com") -> str:
    response = client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": "secret123"},
    )
    assert response.status_code == 200
    return response.json()["accessToken"]


def create_word(word: str = "overcome") -> str:
    with Session(engine) as session:
        entity = Word(
            word=word,
            phonetic="ˌoʊvərˈkʌm",
            meaning="克服",
            part_of_speech="v.",
            level="cet4",
            frequency=99,
            example="We can overcome difficulties.",
            example_cn="我们可以克服困难。",
            tags=["cet4", "verb"],
        )
        session.add(entity)
        session.commit()
        session.refresh(entity)
        return entity.id


def test_register_rejects_duplicate_email():
    register_user()

    response = client.post(
        "/api/v1/auth/register",
        json={"email": "test@example.com", "password": "secret123", "name": "Again"},
    )

    assert response.status_code == 409
    assert response.json()["code"] == "EMAIL_EXISTS"


def test_login_and_me_require_valid_token():
    register_user()
    token = login_user()

    unauthenticated = client.get("/api/v1/auth/me")
    authenticated = client.get("/api/v1/auth/me", headers=auth_headers(token))

    assert unauthenticated.status_code == 401
    assert authenticated.status_code == 200
    assert authenticated.json()["email"] == "test@example.com"


def test_login_rejects_wrong_password():
    register_user()

    response = client.post(
        "/api/v1/auth/login",
        json={"email": "test@example.com", "password": "bad-password"},
    )

    assert response.status_code == 401
    assert response.json()["code"] == "INVALID_CREDENTIALS"


def test_words_list_search_and_pagination():
    register_user()
    token = login_user()
    create_word("overcome")
    create_word("prevent")

    response = client.get(
        "/api/v1/words?q=over&page=1&limit=1&includeTotal=true",
        headers=auth_headers(token),
    )

    assert response.status_code == 200
    body = response.json()
    assert body["words"][0]["word"] == "overcome"
    assert body["words"][0]["tags"] == ["cet4", "verb"]
    assert body["words"][0]["progress"] is None
    assert body["pagination"] == {"page": 1, "limit": 1, "total": 1, "totalPages": 1}


def test_word_tags_are_normalized_to_arrays():
    with Session(engine) as session:
        entity = Word(word="ability", meaning="能力", tags="CET-4 A")
        session.add(entity)
        session.commit()

    response = client.get("/api/v1/words?q=ability&limit=1")

    assert response.status_code == 200
    assert response.json()["words"][0]["tags"] == ["CET-4 A"]


def test_favorite_progress_and_review_flow():
    register_user()
    token = login_user()
    word_id = create_word()

    favorite = client.post(f"/api/v1/words/{word_id}/favorite", headers=auth_headers(token))
    progress = client.post(
        f"/api/v1/words/{word_id}/progress",
        headers=auth_headers(token),
        json={"masteryLevel": 2},
    )
    review = client.post(
        f"/api/v1/words/{word_id}/review",
        headers=auth_headers(token),
        json={"result": "wrong", "reviewType": "recognition"},
    )
    detail = client.get(f"/api/v1/words/{word_id}", headers=auth_headers(token))
    favorites = client.get("/api/v1/words/favorites", headers=auth_headers(token))
    wrong = client.get("/api/v1/words/wrong", headers=auth_headers(token))

    assert favorite.status_code == 200
    assert favorite.json()["isFavorite"] is True
    assert progress.status_code == 200
    assert progress.json()["progress"]["masteryLevel"] == 2
    assert review.status_code == 200
    assert review.json()["progress"]["wrongCount"] == 1
    assert detail.json()["progress"]["isFavorite"] is True
    assert favorites.json()["words"][0]["id"] == word_id
    assert wrong.json()["words"][0]["id"] == word_id


def test_migrated_support_endpoints_return_frontend_shapes():
    register_user()
    token = login_user()
    create_word("ability")

    headers = auth_headers(token)
    checks = [
        client.get("/api/v1/words/list", headers=headers),
        client.get("/api/v1/analytics?days=7", headers=headers),
        client.get("/api/v1/achievements", headers=headers),
        client.get("/api/v1/checkin", headers=headers),
        client.post("/api/v1/checkin", headers=headers),
        client.get("/api/v1/weakness", headers=headers),
        client.get("/api/v1/reading", headers=headers),
        client.post("/api/v1/vocabulary/validate", json={"text": "ability"}, headers=headers),
        client.get("/api/v1/vocabulary/writing", headers=headers),
        client.get("/api/v1/admin/stats", headers=headers),
        client.get("/api/v1/ai/debug", headers=headers),
    ]

    assert all(response.status_code == 200 for response in checks)
    assert checks[0].json()["words"][0]["word"] == "ability"
    assert "history" in checks[1].json()
    assert "achievements" in checks[2].json()
    assert checks[3].json()["checkedInToday"] is False
    assert checks[4].json()["checkedIn"] is True
    assert checks[5].json()["items"] == []
    assert checks[6].json()["articles"] == []
    assert checks[7].json()["word"] == "ability"
    assert checks[8].json()["records"] == []
    assert checks[9].json()["words"] == 1
    assert "stats" in checks[10].json()


def test_checkin_is_idempotent_and_awards_xp_once():
    register_user()
    token = login_user()
    headers = auth_headers(token)

    first = client.post("/api/v1/checkin", headers=headers)
    second = client.post("/api/v1/checkin", headers=headers)
    profile = client.get("/api/v1/auth/me", headers=headers)

    assert first.status_code == 200
    assert first.json() == {
        "checkedIn": True,
        "alreadyCheckedIn": False,
        "streak": 1,
        "xpBonus": 10,
    }
    assert second.json()["alreadyCheckedIn"] is True
    assert second.json()["xpBonus"] == 0
    assert profile.json()["xp"] == 10


def test_wrong_review_creates_resolvable_weakness():
    register_user()
    token = login_user()
    headers = auth_headers(token)
    word_id = create_word()

    client.post(
        f"/api/v1/words/{word_id}/review",
        headers=headers,
        json={"result": "wrong", "reviewType": "recognition"},
    )
    weakness = client.get("/api/v1/weakness", headers=headers)

    assert weakness.status_code == 200
    assert weakness.json()["items"][0]["refId"] == word_id
    assert weakness.json()["items"][0]["sources"] == ["单词错题"]

    resolved = client.post(f"/api/v1/weakness/word/{word_id}/resolve", headers=headers)
    after = client.get("/api/v1/weakness", headers=headers)

    assert resolved.status_code == 200
    assert after.json()["items"] == []


def test_writing_history_and_analytics_are_persisted():
    register_user()
    token = login_user()
    headers = auth_headers(token)

    created = client.post(
        "/api/v1/vocabulary/writing",
        headers=headers,
        json={
            "title": "My plan",
            "content": "I will study English every day.",
            "score": 82,
            "spellingErrors": ["Englsh"],
            "outOfLevelWords": ["sophisticated"],
            "vocabularyCoverage": 0.8,
            "writingTime": 180,
        },
    )
    assert created.status_code == 201
    record_id = created.json()["id"]

    history = client.get("/api/v1/vocabulary/writing", headers=headers)
    detail = client.get(f"/api/v1/vocabulary/writing?id={record_id}", headers=headers)
    analytics = client.get("/api/v1/analytics?days=7", headers=headers)
    dashboard = client.get("/api/v1/dashboard/today", headers=headers)

    assert history.json()["records"][0]["wordCount"] == 6
    assert detail.json()["title"] == "My plan"
    assert analytics.json()["today"]["writingCount"] == 1
    assert analytics.json()["today"]["studyMinutes"] == 3
    assert dashboard.json()["summary"]["writingCount"] == 1
    assert any(task["type"] == "writing" and task["status"] == "done" for task in dashboard.json()["tasks"])

    deleted = client.delete(f"/api/v1/vocabulary/writing?id={record_id}", headers=headers)
    after = client.get("/api/v1/vocabulary/writing", headers=headers)
    assert deleted.status_code == 200
    assert after.json()["records"] == []
