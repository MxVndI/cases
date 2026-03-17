from uuid import UUID

from dishka.integrations.fastapi import DishkaRoute
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, HttpUrl

from models import Mapping, TargetSystem
from routes.internal import require_internal_token


router = APIRouter(
    prefix="/internal/access",
    route_class=DishkaRoute,
    tags=["ops"],
    dependencies=[Depends(require_internal_token)],
)


class CreateTargetRequest(BaseModel):
    type: str  # "redis" | "mongo"
    name: str
    endpoint: HttpUrl
    auth_mode: str = "basic"  # "basic" | "form" | "none"
    login_path: str | None = None


class CreateTargetResponse(BaseModel):
    id: UUID


@router.post("/targets", response_model=CreateTargetResponse)
async def create_target(body: CreateTargetRequest):
    doc = TargetSystem(
        type=body.type, name=body.name, endpoint=body.endpoint, auth_mode=body.auth_mode, login_path=body.login_path
    )
    await doc.insert()
    return CreateTargetResponse(id=doc.id)


class CreateMappingRequest(BaseModel):
    admin_id: UUID
    target_id: UUID
    credentials_id: UUID


class CreateMappingResponse(BaseModel):
    id: UUID


@router.post("/mappings", response_model=CreateMappingResponse)
async def create_mapping(body: CreateMappingRequest):
    target = await TargetSystem.get(body.target_id)
    if not target or target.disabled:
        raise HTTPException(status_code=404, detail="Target not found")
    doc = Mapping(
        admin_id=body.admin_id,
        target_id=body.target_id,
        credentials_id=body.credentials_id,
    )
    await doc.insert()
    return CreateMappingResponse(id=doc.id)

