from beanie import Document
from pydantic import ConfigDict, Field, EmailStr, field_serializer
from uuid import UUID, uuid4
from typing import Literal
from datetime import datetime, UTC


def time_now():
    return datetime.now(tz=UTC)


def default_name():
    return f"user{int(time_now().timestamp())}"


class User(Document):
    id: UUID = Field(default_factory=uuid4)
    email: EmailStr
    nickname: str = Field(default_factory=default_name)
    trade_link: str = Field(None)
    status: Literal["active", "blocked"] = "active"
    created_at: datetime = Field(default_factory=time_now)
    last_updated: datetime = Field(default_factory=time_now)

    @field_serializer("id")
    def serialize_id(self, id: UUID):
        return str(id)

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
