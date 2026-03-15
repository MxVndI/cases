from datetime import UTC, datetime
from uuid import UUID, uuid4

from beanie import Document
from pydantic import BaseModel, ConfigDict, Field, field_serializer


def time_now():
    return datetime.now(tz=UTC)


class InventoryItem(BaseModel):
    item_id: UUID
    obtained_at: datetime = Field(default_factory=time_now)


class Inventory(Document):
    id: UUID = Field(default_factory=uuid4)
    user_id: UUID
    items: list[InventoryItem] = Field(default_factory=list)
    created_at: datetime = Field(default_factory=time_now)
    last_updated: datetime = Field(default_factory=time_now)

    @field_serializer("id")
    def serialize_id(self, id: UUID):
        return str(id)

    @field_serializer("user_id")
    def serialize_user_id(self, user_id: UUID):
        return str(user_id)

    @field_serializer("created_at")
    def serialize_ca(self, dt: datetime):
        return dt.isoformat()

    @field_serializer("last_updated")
    def serialize_la(self, dt: datetime):
        return dt.isoformat()

    model_config = ConfigDict(extra="ignore")

    class Settings:
        bson_encoders = {UUID: str}
        keep_nulls = False
