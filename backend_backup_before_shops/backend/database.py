from sqlalchemy import create_engine, inspect, text
from sqlalchemy.orm import declarative_base, sessionmaker

from config import DATABASE_URL

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False}
)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

Base = declarative_base()


def get_db():
    db = SessionLocal()

    try:
        yield db
    finally:
        db.close()


def add_missing_application_assignment_column():
    inspector = inspect(engine)
    if "verification_applications" not in inspector.get_table_names():
        return

    columns = {
        column["name"] for column in inspector.get_columns("verification_applications")
    }
    if "assigned_officer_id" not in columns:
        with engine.begin() as connection:
            connection.execute(
                text(
                    "ALTER TABLE verification_applications "
                    "ADD COLUMN assigned_officer_id INTEGER REFERENCES users(id)"
                )
            )


def add_missing_hardening_columns():
    inspector = inspect(engine)
    table_columns = {
        table: {column["name"] for column in inspector.get_columns(table)}
        for table in inspector.get_table_names()
    }
    additions = {
        "users": {
            "email_verified": "BOOLEAN NOT NULL DEFAULT 0",
            "auth_provider": "VARCHAR NOT NULL DEFAULT 'local'",
            "google_subject_id": "VARCHAR",
        },
        "certificates": {
            "expires_at": "DATETIME",
            "integrity_hash": "VARCHAR",
            "revoked_at": "DATETIME",
            "revocation_reason": "VARCHAR",
        },
        "inspections": {
            "latitude": "VARCHAR",
            "longitude": "VARCHAR",
            "captured_at": "DATETIME",
            "ocr_data": "JSON",
            "photo_urls": "JSON",
        },
        "verification_applications": {
            "priority": "VARCHAR NOT NULL DEFAULT 'NORMAL'",
            "scheduled_at": "DATETIME",
        },
    }
    with engine.begin() as connection:
        for table, columns in additions.items():
            if table not in table_columns:
                continue
            for name, definition in columns.items():
                if name not in table_columns[table]:
                    connection.execute(text(f"ALTER TABLE {table} ADD COLUMN {name} {definition}"))
        