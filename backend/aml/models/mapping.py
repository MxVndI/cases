from datetime import datetime
from uuid import UUID, uuid4

from beanie import Document
from pydantic import ConfigDict, Field, field_serializer

from models.common import time_now


class Mapping(Document):
    id: UUID = Field(default_factory=uuid4)
    admin_id: UUID
    target_id: UUID
    credentials_id: UUID
    created_at: datetime = Field(default_factory=time_now)
    disabled: bool = False

    @field_serializer("id")
    def serialize_id(self, id: UUID):
        return str(id)

    @field_serializer("admin_id")
    def serialize_admin_id(self, admin_id: UUID):
        return str(admin_id)

    @field_serializer("target_id")
    def serialize_target_id(self, target_id: UUID):
        return str(target_id)

    @field_serializer("credentials_id")
    def serialize_credentials_id(self, credentials_id: UUID):
        return str(credentials_id)

    @field_serializer("created_at")
    def serialize_created_at(self, dt: datetime):
        return dt.isoformat()

    model_config = ConfigDict(extra="ignore")

    class Settings:
        bson_encoders = {UUID: str}
        keep_nulls = False

