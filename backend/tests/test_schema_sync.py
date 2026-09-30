"""
Confirms sync_schema() (app/database.py) can start against a database
created by an *older* version of the models — missing columns added
since — and both adds the new columns and backfills them, without
losing any existing row's data.
"""
from sqlalchemy import text

from app.database import engine, sync_schema, SessionLocal
from app.models import Sermon


def test_schema_sync_adds_missing_columns_and_preserves_data(db_session):
    # Recreate `sermons` as it looked before category/scripture/published
    # existed, to simulate an already-deployed database.
    with engine.begin() as conn:
        conn.execute(text("DROP TABLE sermons"))
        conn.execute(
            text(
                """
                CREATE TABLE sermons (
                    id INTEGER PRIMARY KEY,
                    title VARCHAR NOT NULL,
                    speaker VARCHAR,
                    sermon_date VARCHAR,
                    media_path VARCHAR,
                    external_link VARCHAR,
                    notes TEXT
                )
                """
            )
        )
        conn.execute(
            text(
                "INSERT INTO sermons (id, title, speaker, sermon_date, media_path, external_link, notes) "
                "VALUES (1, 'Old Sermon', 'Old Speaker', '2020-01-01', '', '', '')"
            )
        )

    sync_schema()

    session = SessionLocal()
    try:
        sermon = session.get(Sermon, 1)
        assert sermon is not None
        assert sermon.title == "Old Sermon"  # existing data preserved
        assert sermon.speaker == "Old Speaker"
        assert sermon.category == ""  # new column, backfilled default
        assert sermon.scripture == ""
        assert sermon.published is True
    finally:
        session.close()


def test_schema_sync_is_idempotent(db_session):
    """Running it twice in a row (e.g. two app restarts) doesn't error."""
    sync_schema()
    sync_schema()
