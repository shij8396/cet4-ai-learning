"""initial core tables

Revision ID: 202606220001
Revises:
Create Date: 2026-06-22 00:01:00.000000
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "202606220001"
down_revision: str | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", sa.String(length=191), nullable=False),
        sa.Column("name", sa.String(length=191), nullable=True),
        sa.Column("email", sa.String(length=191), nullable=False),
        sa.Column("password", sa.String(length=255), nullable=False),
        sa.Column("image", sa.String(length=500), nullable=True),
        sa.Column("level", sa.Integer(), nullable=False),
        sa.Column("total_words", sa.Integer(), nullable=False),
        sa.Column("mastered_words", sa.Integer(), nullable=False),
        sa.Column("streak", sa.Integer(), nullable=False),
        sa.Column("xp", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_users")),
    )
    op.create_index(op.f("ix_users_email"), "users", ["email"], unique=True)

    op.create_table(
        "words",
        sa.Column("id", sa.String(length=191), nullable=False),
        sa.Column("word", sa.String(length=191), nullable=False),
        sa.Column("phonetic", sa.String(length=191), nullable=True),
        sa.Column("meaning", sa.Text(), nullable=False),
        sa.Column("part_of_speech", sa.String(length=64), nullable=True),
        sa.Column("level", sa.String(length=32), nullable=False),
        sa.Column("frequency", sa.Integer(), nullable=False),
        sa.Column("example", sa.Text(), nullable=True),
        sa.Column("example_cn", sa.Text(), nullable=True),
        sa.Column("tags", sa.JSON(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_words")),
    )
    op.create_index(op.f("ix_words_frequency"), "words", ["frequency"], unique=False)
    op.create_index(op.f("ix_words_level"), "words", ["level"], unique=False)
    op.create_index(op.f("ix_words_word"), "words", ["word"], unique=True)

    op.create_table(
        "user_word_progress",
        sa.Column("id", sa.String(length=191), nullable=False),
        sa.Column("user_id", sa.String(length=191), nullable=False),
        sa.Column("word_id", sa.String(length=191), nullable=False),
        sa.Column("mastery_level", sa.Integer(), nullable=False),
        sa.Column("review_count", sa.Integer(), nullable=False),
        sa.Column("wrong_count", sa.Integer(), nullable=False),
        sa.Column("last_review_time", sa.DateTime(timezone=True), nullable=True),
        sa.Column("next_review_time", sa.DateTime(timezone=True), nullable=True),
        sa.Column("is_favorite", sa.Boolean(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], name=op.f("fk_user_word_progress_user_id_users"), ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["word_id"], ["words.id"], name=op.f("fk_user_word_progress_word_id_words"), ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_user_word_progress")),
        sa.UniqueConstraint("user_id", "word_id", name="uq_user_word_progress_user_word"),
    )
    op.create_index(op.f("ix_user_word_progress_user_id"), "user_word_progress", ["user_id"], unique=False)
    op.create_index(op.f("ix_user_word_progress_word_id"), "user_word_progress", ["word_id"], unique=False)

    op.create_table(
        "word_review_records",
        sa.Column("id", sa.String(length=191), nullable=False),
        sa.Column("user_id", sa.String(length=191), nullable=False),
        sa.Column("word_id", sa.String(length=191), nullable=False),
        sa.Column("result", sa.String(length=32), nullable=False),
        sa.Column("review_type", sa.String(length=64), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], name=op.f("fk_word_review_records_user_id_users"), ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["word_id"], ["words.id"], name=op.f("fk_word_review_records_word_id_words"), ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_word_review_records")),
    )
    op.create_index(op.f("ix_word_review_records_created_at"), "word_review_records", ["created_at"], unique=False)
    op.create_index(op.f("ix_word_review_records_user_id"), "word_review_records", ["user_id"], unique=False)
    op.create_index(op.f("ix_word_review_records_word_id"), "word_review_records", ["word_id"], unique=False)


def downgrade() -> None:
    op.drop_table("word_review_records")
    op.drop_table("user_word_progress")
    op.drop_table("words")
    op.drop_table("users")
