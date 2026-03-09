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


class UpdateItem(BaseModel):
    id: UUID
    img_url: str | None = None
    price: float | None = None
    name: str | None = None
    weapon: Weapon | None = None
    rarity: Rarity | None = None


class CaseContent(BaseModel):
    item_id: UUID
    drop_chance: float = Field(ge=0, le=1)


class CreateCase(BaseModel):
    img_url: str | None = None
    price: float | None = None
    name: str | None = None
    case_content: list[CaseContent]


class UpdateCase(BaseModel):
    id: UUID
    img_url: str | None = None
    price: float | None = None
    name: str | None = None
    case_content: list[CaseContent] | None = None
