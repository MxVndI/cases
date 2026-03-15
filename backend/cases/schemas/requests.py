from typing import Annotated
from uuid import UUID

from pydantic import BaseModel, Field


class Rarity(BaseModel):
    name: str
    color: str


class Weapon(BaseModel):
    name: str
    type: str


class CreateItem(BaseModel):
    img_url: str | None = None
    price: float = Field(ge=100)
    name: str | None = None
    weapon: Weapon
    rarity: Rarity
    token: str = Field(exclude=True)


class UpdateItem(BaseModel):
    id: UUID
    img_url: str | None = None
    price: float | None = None
    name: str | None = None
    weapon: Weapon | None = None
    rarity: Rarity | None = None
    token: str = Field(exclude=True)


class CaseContent(BaseModel):
    item_id: UUID
    drop_chance: float = Field(ge=0, le=1)


class CreateCase(BaseModel):
    img_url: str | None = None
    price: float | None = None
    name: str | None = None
    case_content: list[CaseContent]
    token: str = Field(exclude=True)


class UpdateCase(BaseModel):
    id: UUID
    img_url: str | None = None
    price: float | None = None
    name: str | None = None
    case_content: list[CaseContent] | None = None
    token: str = Field(exclude=True)
