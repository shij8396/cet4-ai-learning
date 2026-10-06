import json
import sys
from pathlib import Path

from sqlalchemy import select
from sqlalchemy.orm import Session

ROOT = Path(__file__).resolve().parents[2]
BACKEND_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND_ROOT))

from app.core.security import hash_password  # noqa: E402
from app.db.session import engine  # noqa: E402
from app.models.user import User  # noqa: E402
from app.models.word import Word  # noqa: E402


def load_words() -> list[dict]:
    full = ROOT / "data" / "cet4-words.json"
    sample = ROOT / "data" / "sample-cet4-words.json"
    path = full if full.exists() else sample
    return json.loads(path.read_text(encoding="utf-8"))


def normalize_tags(value: object) -> list[str]:
    if isinstance(value, list):
        return [str(item) for item in value]
    if isinstance(value, str):
        return [value] if value else []
    return []


def seed_words(session: Session) -> None:
    words = load_words()
    for item in words:
        key = item["word"].lower()
        word = session.scalar(select(Word).where(Word.word == key))
        if word is None:
            word = Word(word=key, meaning=item["meaning"])
            session.add(word)
        word.phonetic = item.get("phonetic")
        word.meaning = item["meaning"]
        word.part_of_speech = item.get("partOfSpeech")
        word.level = "cet4"
        word.frequency = item.get("frequency", 1)
        word.example = item.get("example")
        word.example_cn = item.get("exampleCn")
        word.tags = normalize_tags(item.get("tags", []))
    session.commit()
    print(f"Seeded {len(words)} words")


def seed_user(session: Session) -> None:
    email = "test@cet4.com"
    existing = session.scalar(select(User).where(User.email == email))
    if existing is None:
        session.add(User(email=email, name="Test User", password=hash_password("test123456")))
        session.commit()
        print("Created test user: test@cet4.com / test123456")
    else:
        print("Test user already exists: test@cet4.com")


def main() -> None:
    with Session(engine) as session:
        seed_words(session)
        seed_user(session)


if __name__ == "__main__":
    main()
