from datetime import UTC, datetime
from uuid import UUID, uuid4

from beanie import Document
from pydantic import BaseModel, ConfigDict, Field, field_serializer


def default_name():
    return f"case{int(time_now().timestamp())}"


def time_now():
    return datetime.now(tz=UTC)


class CaseContent(BaseModel):
    item_id: UUID
    drop_chance: float


class Case(Document):
    id: UUID = Field(default_factory=uuid4)
    img_url: str | None = None
    price: float = 100
    name: str = Field(default_factory=default_name)
    created_at: datetime = Field(default_factory=time_now)
    case_content: list[CaseContent] = Field(default_factory=list)

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
