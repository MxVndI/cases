from typing import Annotated
from uuid import UUID

from dishka.integrations.fastapi import DishkaRoute, FromDishka
from fastapi import APIRouter, Cookie, HTTPException
from pydantic import BaseModel

from models import Mapping, TargetSystem
from services.auth_adapter import AuthAdapter
from services.audit import AuditService


router = APIRouter(prefix="/aml", route_class=DishkaRoute, tags=["access"])


class TargetOut(BaseModel):
    id: UUID
    type: str
    name: str
    disabled: bool


@router.get("/targets", response_model=list[TargetOut])
async def list_targets(
    auth: FromDishka[AuthAdapter],
    audit: FromDishka[AuditService],
    sid: Annotated[str | None, Cookie()] = None,
):
    if not sid:
        raise HTTPException(status_code=401)
    admin_id = await auth.get_admin_id_by_sid(sid)
    await audit.emit(event_type="login_seen", admin_id=UUID(admin_id))

    mappings = await Mapping.find(
        Mapping.admin_id == UUID(admin_id),
        Mapping.disabled == False,  # noqa: E712
    ).to_list()
    if not mappings:
        return []

    target_ids = [m.target_id for m in mappings]
    targets = await TargetSystem.find(
        TargetSystem.id.in_(target_ids),
        TargetSystem.disabled == False,  # noqa: E712
    ).to_list()
    return [TargetOut(id=t.id, type=t.type, name=t.name, disabled=t.disabled) for t in targets]

