from datetime import datetime
from uuid import UUID

from pydantic import BaseModel


class Rarity(BaseModel):
    name: str
    color: str


class Weapon(BaseModel):
    name: str
    type: str


class ItemResponse(BaseModel):
    id: UUID
    img_url: str | None = None
    price: float
    name: str
    weapon: Weapon
    rarity: Rarity
    created_at: datetime


class CaseContentItem(BaseModel):
    item_id: UUID
    drop_chance: float
    item: ItemResponse | None = None


class CaseResponse(BaseModel):
    id: UUID
    img_url: str | None = None
    price: float
    name: str
    created_at: datetime
    case_content: list[CaseContentItem]


class AdminAuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
