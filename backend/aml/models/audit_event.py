from datetime import datetime
from typing import Any, Literal
from uuid import UUID, uuid4

from beanie import Document
from pydantic import ConfigDict, Field, field_serializer

from models.common import time_now


AuditEventType = Literal[
    "login_seen",
    "target_selected",
    "proxy_session_created",
    "proxy_access",
    "access_denied",
    "error",
]


class AuditEvent(Document):
    id: UUID = Field(default_factory=uuid4)
    admin_id: UUID | None = None
    target_id: UUID | None = None
    event_type: AuditEventType
    ts: datetime = Field(default_factory=time_now)
    metadata: dict[str, Any] = Field(default_factory=dict)

    @field_serializer("id")
    def serialize_id(self, id: UUID):
        return str(id)

    @field_serializer("admin_id")
    def serialize_admin_id(self, admin_id: UUID | None):
        return str(admin_id) if admin_id else None

    @field_serializer("target_id")
    def serialize_target_id(self, target_id: UUID | None):
        return str(target_id) if target_id else None

    @field_serializer("ts")
    def serialize_ts(self, dt: datetime):
        return dt.isoformat()

    model_config = ConfigDict(extra="ignore")

    class Settings:
        bson_encoders = {UUID: str}
        keep_nulls = False
