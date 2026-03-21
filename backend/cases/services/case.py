import json
import random
import re
import unicodedata
from datetime import datetime, timezone
from uuid import UUID

from models.case import Case
from models.tag import Tag
from models.win_history import WinHistory
from redis.asyncio import Redis
from schemas.requests import CreateCase, UpdateCase
from schemas.responses import CaseContentResponse, CaseResponse, ItemResponse
from services.inventory import InventoryService
from services.item import ItemService
from services.payment import PaymentService

SYSTEM_UUID = UUID(int=0)
CASE_STATUS_ACTIVE = "active"
CASE_STATUS_DISABLED = "disabled"
VALID_CASE_STATUSES = {CASE_STATUS_ACTIVE, CASE_STATUS_DISABLED}

CYRILLIC_TO_LATIN = {
    "а": "a",
    "б": "b",
    "в": "v",
    "г": "g",
    "д": "d",
    "е": "e",
    "ё": "e",
    "ж": "zh",
    "з": "z",
    "и": "i",
    "й": "y",
    "к": "k",
    "л": "l",
    "м": "m",
    "н": "n",
    "о": "o",
    "п": "p",
    "р": "r",
    "с": "s",
    "т": "t",
    "у": "u",
    "ф": "f",
    "х": "h",
    "ц": "ts",
    "ч": "ch",
    "ш": "sh",
    "щ": "sch",
    "ъ": "",
    "ы": "y",
    "ь": "",
    "э": "e",
    "ю": "yu",
    "я": "ya",
}


class CaseService:
    def __init__(
        self, item_service: ItemService, inventory_service: InventoryService = None,
        payment_service: PaymentService = None, redis: Redis = None,
    ):
        self.item_service = item_service
        self.inventory_service = inventory_service
        self.payment_service = payment_service
        self.redis = redis

    @staticmethod
    def _validate_drop_chances(case_content: list) -> None:
        total = sum(item.drop_chance for item in case_content)
        if abs(total - 1.0) > 0.001:
            raise ValueError(
                f"Sum of drop_chance must equal 1.0 (got {total:.4f})"
            )

    @staticmethod
    def _normalize_status(status: str | None) -> str:
        normalized = (status or CASE_STATUS_ACTIVE).strip().lower()
        if normalized not in VALID_CASE_STATUSES:
            raise ValueError("Invalid case status")
        return normalized

    @staticmethod
    async def _normalize_tag(tag: str | None) -> str | None:
        if tag is None:
            return None
        normalized = tag.strip()
        if not normalized:
            return None
        existing = await Tag.find_one(Tag.name == normalized)
        if not existing:
            raise ValueError("Tag does not exist")
        return normalized

    @staticmethod
    def _transliterate(value: str) -> str:
        translated = []
        for char in value.lower():
            translated.append(CYRILLIC_TO_LATIN.get(char, char))
        return "".join(translated)

    @classmethod
    def _normalize_system_name(cls, value: str | None) -> str:
        base = cls._transliterate(value or "")
        base = unicodedata.normalize("NFKD", base).encode("ascii", "ignore").decode("ascii")
        base = re.sub(r"[^a-z0-9]+", "_", base.lower())
        base = re.sub(r"_+", "_", base).strip("_")
        return base or "case"

    async def _ensure_unique_system_name(self, value: str | None, fallback_name: str | None, exclude_id: UUID | None = None) -> str:
        base = self._normalize_system_name(value or fallback_name)
        candidate = base
        suffix = 2

        while True:
            existing = await Case.find_one(Case.system_name == candidate)
            if not existing or (exclude_id is not None and existing.id == exclude_id):
                return candidate
            candidate = f"{base}_{suffix}"
            suffix += 1

    async def _prepare_case_fields(self, payload: dict, exclude_id: UUID | None = None) -> dict:
        prepared = dict(payload)
        prepared["status"] = self._normalize_status(prepared.get("status"))
        prepared["tag"] = await self._normalize_tag(prepared.get("tag"))
        prepared["system_name"] = await self._ensure_unique_system_name(
            prepared.get("system_name"),
            prepared.get("name"),
            exclude_id=exclude_id,
        )
        return prepared

    async def create(self, data: CreateCase) -> UUID:
        self._validate_drop_chances(data.case_content)

        items = list(map(lambda x: x.item_id, data.case_content))
        for id in items:
            item_data = await self.item_service.get_by_id(id)
            if not item_data:
                raise ValueError("Item does not exist")

        case_payload = await self._prepare_case_fields(data.model_dump(exclude_none=True))
        case = Case(**case_payload)
        await case.save()
        return case.id

    async def _build_case_content(self, case_content):
        result = []
        for y in case_content:
            item = await self.item_service.get_by_id(y.item_id)
            if item:
                result.append(CaseContentResponse(item=item, drop_chance=y.drop_chance))
        return result

    async def get(self, include_disabled: bool = False):
        data = await Case.find_all().to_list()
        ret_data = []

        for x in data:
            if not include_disabled and x.status == CASE_STATUS_DISABLED:
                continue
            dx = x.model_dump()
            dx["case_content"] = await self._build_case_content(x.case_content)
            ret_data.append(CaseResponse(**dx))
        return ret_data

    async def get_by_id(self, id: UUID, include_disabled: bool = False):
        case = await Case.get(id)
        if case and not include_disabled and case.status == CASE_STATUS_DISABLED:
            return None
        if not case:
            return None
        dx = case.model_dump()
        dx["case_content"] = await self._build_case_content(case.case_content)
        return CaseResponse(**dx)

    async def get_by_name(self, name: str, include_disabled: bool = False):
        case = await Case.find_one(Case.name == name)
        if case and not include_disabled and case.status == CASE_STATUS_DISABLED:
            return None
        if not case:
            return None
        dx = case.model_dump()
        dx["case_content"] = await self._build_case_content(case.case_content)
        return CaseResponse(**dx)

    async def get_by_system_name(self, system_name: str, include_disabled: bool = False):
        case = await Case.find_one(Case.system_name == system_name)
        if case and not include_disabled and case.status == CASE_STATUS_DISABLED:
            return None
        if not case:
            return None
        dx = case.model_dump()
        dx["case_content"] = await self._build_case_content(case.case_content)
        return CaseResponse(**dx)

    async def update(self, data: UpdateCase):
        case = await Case.get(data.id)
        if not case:
            raise ValueError("Case does not exist")

        if data.case_content:
            self._validate_drop_chances(data.case_content)

            items = list(map(lambda x: x.item_id, data.case_content))
            for id in items:
                item_data = await self.item_service.get_by_id(id)
                if not item_data:
                    raise ValueError("Item does not exist")
        case_data = case.model_dump()
        for k, v in data.model_dump(exclude_none=True).items():
            case_data[k] = v

        case_data = await self._prepare_case_fields(case_data, exclude_id=case.id)
        case = Case(**case_data)

        await case.save()
        return case.id

    async def delete(self, id: UUID):
        case = await Case.find_one(Case.id == id)
        if not case:
            raise ValueError("Case not found")
        await case.delete()
        return True

    async def open(
        self, case_id: UUID, user_id: UUID, user_nickname: str | None = None, allow_disabled: bool = False
    ) -> ItemResponse | None:
        case = await Case.get(case_id)
        if not case:
            return None

        if not allow_disabled and case.status == CASE_STATUS_DISABLED:
            return None

        if not case.case_content:
            return None

        # Проверка баланса перед открытием
        if self.payment_service:
            balance = await self.payment_service.get_balance(user_id)
            if balance < case.price:
                raise ValueError("Insufficient funds")

        # Взвешенный случайный выбор предмета на основе drop_chance
        items_with_chances = [
            (content.item_id, content.drop_chance) for content in case.case_content
        ]

        item_ids = [item_id for item_id, _ in items_with_chances]
        weights = [chance for _, chance in items_with_chances]

        chosen_item_id = random.choices(item_ids, weights=weights, k=1)[0]

        # Получаем данные о предмете
        won_item = await self.item_service.get_by_id(chosen_item_id)
        if not won_item:
            return None

        # Списание средств: user → system
        if self.payment_service:
            ok = await self.payment_service.create_transaction(
                from_id=user_id, to_id=SYSTEM_UUID, amount=case.price,
                description=f"Открытие кейса: {case.name}",
            )
            if not ok:
                raise ValueError("Payment failed")

        # Сохраняем предмет в инвентарь пользователя
        if self.inventory_service:
            await self.inventory_service.add_item(user_id, chosen_item_id)

        # Сохраняем в историю выигрышей (MongoDB)
        now = datetime.now(timezone.utc)
        await WinHistory(
            user_id=user_id,
            item_id=chosen_item_id,
            item_name=won_item.name,
            item_rarity=won_item.rarity.name,
            item_price=won_item.price,
            item_img_url=won_item.img_url,
            case_name=case.name,
            timestamp=now,
        ).insert()

        # Записываем в ленту последних выигрышей
        if self.redis:
            win_entry = json.dumps({
                "user_id": str(user_id),
                "user_nickname": user_nickname,
                "item_id": str(chosen_item_id),
                "item_name": won_item.name,
                "item_rarity": won_item.rarity.name,
                "item_price": won_item.price,
                "item_img_url": won_item.img_url,
                "case_name": case.name,
                "timestamp": now.isoformat(),
            })
            await self.redis.lpush("recent_wins", win_entry)
            await self.redis.ltrim("recent_wins", 0, 49)
            await self.redis.publish("wins_channel", win_entry)

        return won_item

    async def open_by_name(
        self, case_name: str, user_id: UUID, user_nickname: str | None = None, allow_disabled: bool = False
    ) -> ItemResponse | None:
        case = await Case.find_one(Case.name == case_name)
        if not case:
            return None
        return await self.open(case.id, user_id, user_nickname=user_nickname, allow_disabled=allow_disabled)

    async def open_by_system_name(
        self, system_name: str, user_id: UUID, user_nickname: str | None = None, allow_disabled: bool = False
    ) -> ItemResponse | None:
        case = await Case.find_one(Case.system_name == system_name)
        if not case:
            return None
        return await self.open(case.id, user_id, user_nickname=user_nickname, allow_disabled=allow_disabled)

    async def calculate_chances(self, item_ids: list[UUID]) -> list[dict]:
        """Calculate drop chances using inverse price weighting."""
        items = []
        for item_id in item_ids:
            item = await self.item_service.get_by_id(item_id)
            if not item:
                raise ValueError(f"Item {item_id} does not exist")
            items.append((item_id, item.price))

        inv_sum = sum(1.0 / price for _, price in items)
        return [
            {"item_id": str(item_id), "drop_chance": round((1.0 / price) / inv_sum, 6)}
            for item_id, price in items
        ]

    async def calculate_price(self, items: list[dict], margin: float = 1.1) -> dict:
        """Calculate a suggested case price based on items, their drop chances and a margin multiplier."""
        expected_value = 0.0
        for entry in items:
            item = await self.item_service.get_by_id(entry["item_id"])
            if not item:
                raise ValueError(f"Item {entry['item_id']} does not exist")
            expected_value += item.price * entry["drop_chance"]

        raw_price = expected_value * margin

        # Round to a "nice" number
        if raw_price <= 10:
            suggested = max(1, round(raw_price))
        elif raw_price <= 100:
            suggested = int((raw_price + 4) // 5) * 5
        elif raw_price <= 500:
            suggested = int((raw_price + 9) // 10) * 10
        else:
            suggested = int((raw_price + 24) // 25) * 25

        return {
            "expected_value": round(expected_value, 2),
            "margin": margin,
            "suggested_price": suggested,
        }
