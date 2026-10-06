"""add persisted learning activity tables

Revision ID: 202610050002
Revises: 202606220001
Create Date: 2026-10-05 00:02:00.000000
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "202610050002"
down_revision: str | None = "202606220001"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "daily_check_ins",
        sa.Column("id", sa.String(length=191), nullable=False),
        sa.Column("user_id", sa.String(length=191), nullable=False),
        sa.Column("checkin_date", sa.Date(), nullable=False),
        sa.Column("streak_after", sa.Integer(), nullable=False),
        sa.Column("xp_awarded", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("user_id", "checkin_date", name="uq_daily_check_ins_user_date"),
    )
    op.create_index("ix_daily_check_ins_user_id", "daily_check_ins", ["user_id"])
    op.create_index("ix_daily_check_ins_checkin_date", "daily_check_ins", ["checkin_date"])

    op.create_table(
        "writing_records",
        sa.Column("id", sa.String(length=191), nullable=False),
        sa.Column("user_id", sa.String(length=191), nullable=False),
        sa.Column("title", sa.String(length=255), nullable=True),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("score", sa.Integer(), nullable=True),
        sa.Column("grammar_errors", sa.JSON(), nullable=False),
        sa.Column("spelling_errors", sa.JSON(), nullable=False),
        sa.Column("out_of_level_words", sa.JSON(), nullable=False),
        sa.Column("vocabulary_coverage", sa.Float(), nullable=True),
        sa.Column("writing_time", sa.Integer(), nullable=False),
        sa.Column("word_count", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_writing_records_user_id", "writing_records", ["user_id"])
    op.create_index("ix_writing_records_created_at", "writing_records", ["created_at"])

    op.create_table(
        "resolved_weaknesses",
        sa.Column("id", sa.String(length=191), nullable=False),
        sa.Column("user_id", sa.String(length=191), nullable=False),
        sa.Column("weakness_type", sa.String(length=32), nullable=False),
        sa.Column("ref_id", sa.String(length=191), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "user_id", "weakness_type", "ref_id", name="uq_resolved_weakness_user_type_ref"
        ),
    )
    op.create_index("ix_resolved_weaknesses_user_id", "resolved_weaknesses", ["user_id"])


def downgrade() -> None:
    op.drop_table("resolved_weaknesses")
    op.drop_table("writing_records")
    op.drop_table("daily_check_ins")
