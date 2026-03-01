from pydantic import BaseModel, ConfigDict, EmailStr


class CreateUser(BaseModel):
    email: EmailStr
    key: str


class EmailRequest(BaseModel):
    email: str


class SimpleUpdateRequest(BaseModel):
    email: EmailStr | None = None
    nickname: str | None = None
    trade_link: str | None = None

    model_config = ConfigDict(extra="ignore")
