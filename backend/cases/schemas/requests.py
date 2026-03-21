from typing import Annotated
from uuid import UUID

from pydantic import BaseModel, Field


class Rarity(BaseModel):
    name: str = Field(min_length=1)
    color: str = Field(min_length=1)


class Weapon(BaseModel):
    name: str = Field(min_length=1)
    type: str = Field(min_length=1)


class CreateItem(BaseModel):
    img_url: str | None = None
    price: float = Field(ge=0)
    name: str | None = Field(default=None, min_length=1)
    weapon: Weapon
    rarity: Rarity
    token: str = Field(exclude=True)


class UpdateItem(BaseModel):
    id: UUID
    img_url: str | None = None
    price: float | None = Field(default=None, ge=0)
    name: str | None = Field(default=None, min_length=1)
    weapon: Weapon | None = None
    rarity: Rarity | None = None
    token: str = Field(exclude=True)


class CaseContent(BaseModel):
    item_id: UUID
    drop_chance: float = Field(ge=0, le=1)


class CreateCase(BaseModel):
    img_url: str | None = None
    price: float | None = Field(default=None, ge=0)
    name: str | None = Field(default=None, min_length=1)
    system_name: str | None = None
    tag: str | None = None
    status: str | None = None
    case_content: list[CaseContent]
    token: str = Field(exclude=True)


class UpdateCase(BaseModel):
    id: UUID
    img_url: str | None = None
    price: float | None = Field(default=None, ge=0)
    name: str | None = Field(default=None, min_length=1)
    system_name: str | None = None
    tag: str | None = None
    status: str | None = None
    case_content: list[CaseContent] | None = None
    token: str = Field(exclude=True)


class CalculateChancesRequest(BaseModel):
    item_ids: list[UUID]
    token: str = Field(exclude=True)


class CalculatePriceItem(BaseModel):
    item_id: UUID
    drop_chance: float = Field(ge=0, le=1)


class CalculatePriceRequest(BaseModel):
    items: list[CalculatePriceItem]
    margin: float = Field(default=1.1, ge=1.0, le=5.0)
    token: str = Field(exclude=True)
