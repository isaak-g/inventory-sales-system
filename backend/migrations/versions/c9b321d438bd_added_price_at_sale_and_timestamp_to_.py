"""Added price_at_sale and timestamp to orders

Revision ID: c9b321d438bd
Revises: 49817a4b0323
Create Date: 2025-03-14 15:23:22.871945

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'c9b321d438bd'
down_revision = '49817a4b0323'
branch_labels = None
depends_on = None


def upgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    with op.batch_alter_table('order', schema=None) as batch_op:
        batch_op.add_column(sa.Column('price_at_sale', sa.Float(), nullable=False))

    # ### end Alembic commands ###


def downgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    with op.batch_alter_table('order', schema=None) as batch_op:
        batch_op.drop_column('price_at_sale')

    # ### end Alembic commands ###
