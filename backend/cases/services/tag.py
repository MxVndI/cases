from uuid import UUID

from models.case import Case
from models.tag import Tag


class TagService:
    @staticmethod
    def _normalize_name(name: str) -> str:
        normalized = name.strip()
        if not normalized:
            raise ValueError("Tag name is required")
        return normalized

    async def create(self, name: str) -> Tag:
        normalized = self._normalize_name(name)
        existing = await Tag.find_one(Tag.name == normalized)
        if existing:
            return existing

        tag = Tag(name=normalized)
        await tag.save()
        return tag

    async def get_all(self) -> list[Tag]:
        tags = await Tag.find_all().to_list()
        return sorted(tags, key=lambda tag: tag.name.lower())

    async def get_by_id(self, id: UUID) -> Tag | None:
        return await Tag.get(id)

    async def update(self, id: UUID, name: str | None = None) -> Tag | None:
        tag = await Tag.get(id)
        if not tag:
            return None

        if name is None:
            return tag

        normalized = self._normalize_name(name)
        existing = await Tag.find_one(Tag.name == normalized)
        if existing and existing.id != tag.id:
            raise ValueError("Tag already exists")

        old_name = tag.name
        if normalized != old_name:
            cases = await Case.find(Case.tag == old_name).to_list()
            for case in cases:
                case.tag = normalized
                await case.save()

        tag.name = normalized
        await tag.save()
        return tag

    async def delete(self, id: UUID) -> bool:
        tag = await Tag.get(id)
        if not tag:
            return False

        cases = await Case.find(Case.tag == tag.name).to_list()
        for case in cases:
            case.tag = None
            await case.save()

        await tag.delete()
        return True