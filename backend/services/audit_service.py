from typing import Any

from sqlalchemy.orm import Session

from models import AuditLog, User


def log(
    db: Session,
    action: str,
    entity_type: str | None = None,
    entity_id: int | str | None = None,
    user: User | None = None,
    description: str | None = None,
    ip_address: str | None = None,
    metadata: dict[str, Any] | None = None,
) -> AuditLog:
    entry = AuditLog(
        user_id=user.id if user else None,
        actor_role=user.role if user else None,
        action=action,
        entity_type=entity_type,
        entity_id=str(entity_id) if entity_id is not None else None,
        description=description,
        ip_address=ip_address,
        metadata_json=metadata,
    )
    db.add(entry)
    return entry