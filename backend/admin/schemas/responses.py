from datetime import datetime
from uuid import UUID

from pydantic import BaseModel


class Rarity(BaseModel):
    name: str
    color: str


class Weapon(BaseModel):
    name: str
    type: str


class WeaponTypeResponse(BaseModel):
    id: UUID
    name: str
    created_at: datetime


class WeaponEntityResponse(BaseModel):
    id: UUID
    name: str
    type: str
    created_at: datetime


class TagResponse(BaseModel):
    id: UUID
    name: str
    created_at: datetime


class ItemResponse(BaseModel):
    id: UUID
    img_url: str | None = None
    price: float
    name: str
    weapon: Weapon
    rarity: Rarity
    created_at: datetime


class CaseContentItem(BaseModel):
    item: ItemResponse
    drop_chance: float


class CaseResponse(BaseModel):
    id: UUID
    img_url: str | None = None
    price: float
    name: str
    system_name: str | None = None
    tag: str | None = None
    status: str = "active"
    created_at: datetime
    case_content: list[CaseContentItem]
