from typing import Any
from uuid import UUID

from models import AuditEvent


class AuditService:
    async def emit(
        self,
        *,
        event_type: str,
        admin_id: UUID | None = None,
        target_id: UUID | None = None,
        metadata: dict[str, Any] | None = None,
    ) -> None:
        doc = AuditEvent(
            event_type=event_type,
            admin_id=admin_id,
            target_id=target_id,
            metadata=metadata or {},
        )
        await doc.insert()

