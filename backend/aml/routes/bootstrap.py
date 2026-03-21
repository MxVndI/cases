from typing import Annotated
from uuid import UUID

from dishka.integrations.fastapi import DishkaRoute, FromDishka
from fastapi import APIRouter, Cookie, HTTPException

from models import EncryptedBlob, Mapping, TargetSystem
from services.auth_adapter import AuthAdapter
from services.crypto import CryptoConfigError, envelope_encrypt, to_b64_fields
from settings import Settings


router = APIRouter(prefix="/aml", route_class=DishkaRoute, tags=["bootstrap"])


async def bootstrap_for_admin(admin_id: UUID, settings: Settings) -> None:
    # Ensure targets exist (docker-internal endpoints)
    mongo_target = await TargetSystem.find_one(TargetSystem.type == "mongo", TargetSystem.name == "mongo-express")
    if not mongo_target:
        mongo_target = TargetSystem(
            type="mongo",
            name="mongo-express",
            endpoint="http://mongo-express:8081",
            auth_mode="basic",
        )
        await mongo_target.insert()

    redis_target = await TargetSystem.find_one(TargetSystem.type == "redis", TargetSystem.name == "redis-commander")
    if not redis_target:
        redis_target = TargetSystem(
            type="redis",
            name="redis-commander",
            endpoint="http://redis-commander:8081",
            auth_mode="basic",
        )
        await redis_target.insert()

    grafana_target = await TargetSystem.find_one(TargetSystem.type == "grafana", TargetSystem.name == "grafana")
    if not grafana_target:
        grafana_target = TargetSystem(
            id=UUID(settings.grafana_target_id),
            type="grafana",
            name="grafana",
            endpoint="http://grafana-ch:3000",
            auth_mode="basic",
        )
        await grafana_target.insert()

    def require(v: str, name: str) -> str:
        if not v:
            raise HTTPException(status_code=500, detail=f"Missing {name} env")
        return v

    # Create encrypted credentials and mappings if not present
    mongo_user = require(settings.mongo_express_user, "MONGO_EXPRESS_USER")
    mongo_pass = require(settings.mongo_express_password, "MONGO_EXPRESS_PASSWORD")
    redis_user = require(settings.redis_commander_http_user, "REDIS_COMMANDER_HTTP_USER")
    redis_pass = require(settings.redis_commander_http_password, "REDIS_COMMANDER_HTTP_PASSWORD")
    grafana_user = require(settings.grafana_user, "GRAFANA_USER")
    grafana_pass = require(settings.grafana_password, "GRAFANA_PASSWORD")

    # Mongo mapping
    mm = await Mapping.find_one(Mapping.admin_id == admin_id, Mapping.target_id == mongo_target.id)
    if not mm:
        env = envelope_encrypt(settings=settings, username=mongo_user, password=mongo_pass)
        cred = EncryptedBlob(**to_b64_fields(env))
        await cred.insert()
        await Mapping(admin_id=admin_id, target_id=mongo_target.id, credentials_id=cred.id).insert()

    # Redis mapping
    rm = await Mapping.find_one(Mapping.admin_id == admin_id, Mapping.target_id == redis_target.id)
    if not rm:
        env = envelope_encrypt(settings=settings, username=redis_user, password=redis_pass)
        cred = EncryptedBlob(**to_b64_fields(env))
        await cred.insert()
        await Mapping(admin_id=admin_id, target_id=redis_target.id, credentials_id=cred.id).insert()

    # Grafana mapping
    gm = await Mapping.find_one(Mapping.admin_id == admin_id, Mapping.target_id == grafana_target.id)
    if not gm:
        env = envelope_encrypt(settings=settings, username=grafana_user, password=grafana_pass)
        cred = EncryptedBlob(**to_b64_fields(env))
        await cred.insert()
        await Mapping(admin_id=admin_id, target_id=grafana_target.id, credentials_id=cred.id).insert()


@router.post("/bootstrap")
async def bootstrap(
    auth: FromDishka[AuthAdapter],
    settings: FromDishka[Settings],
    sid: Annotated[str | None, Cookie()] = None,
):
    if not sid:
        raise HTTPException(status_code=401)
    try:
        admin_id = UUID(await auth.get_admin_id_by_sid(sid))
        await bootstrap_for_admin(admin_id=admin_id, settings=settings)
    except CryptoConfigError as e:
        raise HTTPException(status_code=500, detail=str(e))

    return {"ok": True}

