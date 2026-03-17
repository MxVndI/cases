from datetime import UTC, datetime
from uuid import UUID, uuid4

from beanie import Document
from pydantic import ConfigDict, Field, field_serializer


def time_now():
    return datetime.now(tz=UTC)


class WinHistory(Document):
    id: UUID = Field(default_factory=uuid4)
    user_id: UUID
    item_id: UUID
    item_name: str
    item_rarity: str
    item_price: float
    item_img_url: str | None = None
    case_name: str
    timestamp: datetime = Field(default_factory=time_now)

    @field_serializer("id")
    def serialize_id(self, id: UUID):
        return str(id)

    @field_serializer("user_id")
    def serialize_user_id(self, user_id: UUID):
        return str(user_id)

    @field_serializer("item_id")
    def serialize_item_id(self, item_id: UUID):
        return str(item_id)

    @field_serializer("timestamp")
    def serialize_ts(self, dt: datetime):
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=UTC)
        return dt.isoformat()

    model_config = ConfigDict(extra="ignore")

    class Settings:
        bson_encoders = {UUID: str}
        keep_nulls = False
