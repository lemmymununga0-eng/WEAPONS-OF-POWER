"""
Database connection setup.

Uses SQLite for local development (one file, zero setup) unless DATABASE_URL
points at a real database (e.g. Supabase/Postgres) — the rest of the app
(models, routes) does not need to change either way.
"""
import os
from sqlalchemy import create_engine, inspect, text
from sqlalchemy.orm import sessionmaker, declarative_base

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DB_PATH = os.path.join(BASE_DIR, "church.db")

SQLALCHEMY_DATABASE_URL = os.environ.get("DATABASE_URL", f"sqlite:///{DB_PATH}")

# Supabase (and most providers) hand out "postgres://" or "postgresql://"
# connection strings; SQLAlchemy needs the driver named explicitly to use
# psycopg3, and Supabase's external connections require SSL.
if SQLALCHEMY_DATABASE_URL.startswith("postgres://"):
    SQLALCHEMY_DATABASE_URL = SQLALCHEMY_DATABASE_URL.replace("postgres://", "postgresql+psycopg://", 1)
elif SQLALCHEMY_DATABASE_URL.startswith("postgresql://"):
    SQLALCHEMY_DATABASE_URL = SQLALCHEMY_DATABASE_URL.replace("postgresql://", "postgresql+psycopg://", 1)

is_sqlite = SQLALCHEMY_DATABASE_URL.startswith("sqlite")
if is_sqlite:
    connect_args = {"check_same_thread": False}
else:
    connect_args = {"sslmode": "require"}
    # Supabase's pooler (port 6543) runs in transaction mode, which does not
    # support server-side prepared statements.
    if ":6543/" in SQLALCHEMY_DATABASE_URL:
        connect_args["prepare_threshold"] = None

engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def sync_schema() -> None:
    """
    Adds any model columns missing from an existing table (e.g. a column
    added to models.py after the table was first created). Base.metadata's
    create_all only creates missing *tables*, never alters existing ones —
    this covers the common "one new nullable column" case without needing
    a full migration tool for a site this size.

    Kept to one connection and one backfill statement per table: against a
    remote database every statement is a network round trip.
    """
    inspector = inspect(engine)
    with engine.begin() as conn:
        for table in Base.metadata.sorted_tables:
            if not inspector.has_table(table.name):
                continue
            existing_columns = {col["name"] for col in inspector.get_columns(table.name)}
            defaults = {}
            for column in table.columns:
                if column.name not in existing_columns:
                    col_type = column.type.compile(dialect=engine.dialect)
                    conn.execute(text(f"ALTER TABLE {table.name} ADD COLUMN {column.name} {col_type}"))
                default = column.default.arg if column.default is not None else None
                if default is not None and not callable(default):
                    defaults[column.name] = default

            # ALTER TABLE only sets the DB-level default for *new* rows, and a
            # column can also be left NULL by an older app version or a partial
            # migration, so backfill NULLs to match the model's Python-side
            # default (schemas.py expects non-null strings). A no-op once every
            # row is filled in.
            if defaults:
                assignments = ", ".join(f"{name} = COALESCE({name}, :{name})" for name in defaults)
                any_null = " OR ".join(f"{name} IS NULL" for name in defaults)
                conn.execute(text(f"UPDATE {table.name} SET {assignments} WHERE {any_null}"), defaults)
