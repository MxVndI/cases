from datetime import datetime
from typing import Tuple
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


class CaseResponse(BaseModel):
    id: UUID
    img_url: str | None = None
    price: float
    name: str
    created_at: datetime
    case_content: list[Tuple[ItemResponse, float]]


class InventoryItemResponse(BaseModel):
    item_id: UUID
    obtained_at: datetime


class InventoryResponse(BaseModel):
    id: UUID
    user_id: UUID
    items: list[InventoryItemResponse]
    created_at: datetime
    last_updated: datetime


class OpenCaseResponse(BaseModel):
    won_item: ItemResponse
    inventory: InventoryResponse | None
