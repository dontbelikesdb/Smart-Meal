"""Add dietary_restrictions JSON column to user_profiles

Revision ID: add_dietary_restrictions
Revises: e1b3779c9677
Create Date: 2026-03-13 15:05:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'add_dietary_restrictions'
down_revision: Union[str, Sequence[str], None] = 'e1b3779c9677'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    columns = {col["name"] for col in inspector.get_columns("user_profiles")}
    if "dietary_restrictions" not in columns:
        op.add_column('user_profiles', sa.Column('dietary_restrictions', sa.JSON(), nullable=True, default=list))


def downgrade() -> None:
    """Downgrade schema."""
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    columns = {col["name"] for col in inspector.get_columns("user_profiles")}
    if "dietary_restrictions" in columns:
        op.drop_column('user_profiles', 'dietary_restrictions')
