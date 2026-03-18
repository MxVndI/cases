from datetime import datetime
from typing import Literal
from uuid import UUID, uuid4

from beanie import Document
from pydantic import ConfigDict, Field, HttpUrl, field_serializer

from models.common import time_now


TargetType = Literal["redis", "mongo"]
AuthMode = Literal["basic", "form", "none"]


class TargetSystem(Document):
    id: UUID = Field(default_factory=uuid4)
    type: TargetType

    # Human-friendly name, e.g. "Redis Commander (prod-1)"
    name: str

    # Base URL for the admin UI as seen from Proxy Gateway (e.g. http://redis-commander:8081)
    endpoint: HttpUrl

    # How Proxy should authenticate to this admin UI.
    auth_mode: AuthMode = "basic"

    # Optional login URL for form-based auth.
    login_path: str | None = None

    created_at: datetime = Field(default_factory=time_now)
    disabled: bool = False

    @field_serializer("id")
    def serialize_id(self, id: UUID):
        return str(id)

    @field_serializer("created_at")
    def serialize_created_at(self, dt: datetime):
        return dt.isoformat()

    model_config = ConfigDict(extra="ignore")

    class Settings:
        bson_encoders = {UUID: str}
        keep_nulls = False

