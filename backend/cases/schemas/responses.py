from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict


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


class CaseContentResponse(BaseModel):
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
    case_content: list[CaseContentResponse]


class InventoryItemResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    item_id: UUID
    obtained_at: datetime


class InventoryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID
    items: list[InventoryItemResponse]
    created_at: datetime
    last_updated: datetime


class OpenCaseResponse(BaseModel):
    won_item: ItemResponse
    inventory: InventoryResponse | None
