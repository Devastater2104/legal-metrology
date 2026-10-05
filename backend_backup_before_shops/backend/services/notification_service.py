from sqlalchemy.orm import Session

from models import Notification


def create(
    db: Session,
    user_id: int,
    title: str,
    message: str,
    notification_type: str = "INFO",
    related_entity_type: str | None = None,
    related_entity_id: int | str | None = None,
) -> Notification:
    notification = Notification(
        user_id=user_id,
        title=title,
        message=message,
        type=notification_type,
        related_entity_type=related_entity_type,
        related_entity_id=str(related_entity_id) if related_entity_id is not None else None,
    )
    db.add(notification)
    return notification