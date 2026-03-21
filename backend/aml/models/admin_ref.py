from uuid import UUID, uuid4

from beanie import Document
from datetime import datetime

from pydantic import ConfigDict, EmailStr, Field, field_serializer

from models.common import time_now


class AdminRef(Document):
    """
    Reference record for an authenticated admin.
    Source of truth for admin profile remains user-service; this is a local AML view.
    """

    id: UUID = Field(default_factory=uuid4)
    admin_id: UUID
    email: EmailStr
    created_at: datetime = Field(default_factory=time_now)

    @field_serializer("id")
    def serialize_id(self, id: UUID):
        return str(id)

    @field_serializer("admin_id")
    def serialize_admin_id(self, admin_id: UUID):
        return str(admin_id)

    @field_serializer("created_at")
    def serialize_created_at(self, dt: datetime):
        return dt.isoformat()

    model_config = ConfigDict(extra="ignore")

    class Settings:
        bson_encoders = {UUID: str}
        keep_nulls = False

