from pydantic import BaseModel, Field, EmailStr, ConfigDict
from uuid import UUID
from typing import Literal


class Cookie(BaseModel):
    sid: str | None = None
    cvid: str | None = None
    email: EmailStr | None = None
    model_config = ConfigDict(extra="ignore")


class LoginInitRequest(BaseModel):
    email: EmailStr


class LoginFInishRequest(BaseModel):
    code: str = Field(..., max_length=6, min_length=6)
    nickname: str | None = None


SocialKey = Literal["vk", "tg", "ds", "yt", "tw", "sc"]


class Social(BaseModel):
    type: Literal["personal", "public"]
    link: str
    hidden: bool = Field(default=False)


class User(BaseModel):
    id: UUID
    email: EmailStr
    nickname: str
    role: str = "user"
    status: Literal["active", "blocked"]
    model_config = ConfigDict(extra="ignore")


class AuthResponse(BaseModel):
    user: User
    authenticated: bool
