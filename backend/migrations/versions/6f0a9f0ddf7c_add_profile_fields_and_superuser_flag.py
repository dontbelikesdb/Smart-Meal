"""Add profile fields and superuser flag

Revision ID: 6f0a9f0ddf7c
Revises: add_dietary_restrictions
Create Date: 2026-03-13 16:20:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '6f0a9f0ddf7c'
down_revision: Union[str, Sequence[str], None] = 'add_dietary_restrictions'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    bind = op.get_bind()
    inspector = sa.inspect(bind)

    user_columns = {col["name"] for col in inspector.get_columns("users")}
    if "is_superuser" not in user_columns:
        op.add_column('users', sa.Column('is_superuser', sa.Boolean(), nullable=True, server_default=sa.false()))
    op.execute("UPDATE users SET is_superuser = FALSE WHERE is_superuser IS NULL")
    op.alter_column('users', 'is_superuser', server_default=None)

    profile_columns = {col["name"] for col in inspector.get_columns("user_profiles")}
    if "activity_level" not in profile_columns:
        op.add_column('user_profiles', sa.Column('activity_level', sa.String(), nullable=True))
    if "fitness_goal" not in profile_columns:
        op.add_column('user_profiles', sa.Column('fitness_goal', sa.String(), nullable=True))


def downgrade() -> None:
    """Downgrade schema."""
    bind = op.get_bind()
    inspector = sa.inspect(bind)

    profile_columns = {col["name"] for col in inspector.get_columns("user_profiles")}
    if "fitness_goal" in profile_columns:
        op.drop_column('user_profiles', 'fitness_goal')
    if "activity_level" in profile_columns:
        op.drop_column('user_profiles', 'activity_level')

    user_columns = {col["name"] for col in inspector.get_columns("users")}
    if "is_superuser" in user_columns:
        op.drop_column('users', 'is_superuser')
