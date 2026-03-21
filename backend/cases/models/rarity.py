from datetime import UTC, datetime
from uuid import UUID, uuid4

from beanie import Document
from pydantic import ConfigDict, Field, field_serializer


def time_now():
    return datetime.now(tz=UTC)


class Rarity(Document):
    id: UUID = Field(default_factory=uuid4)
    name: str
    color: str
    created_at: datetime = Field(default_factory=time_now)

    @field_serializer("id")
    def serialize_id(self, id: UUID):
        return str(id)

    @field_serializer("created_at")
    def serialize_ca(self, dt: datetime):
        return dt.isoformat()

    model_config = ConfigDict(extra="ignore")

    class Settings:
        bson_encoders = {UUID: str}
        keep_nulls = False
