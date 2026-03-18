from uuid import UUID

from dishka.integrations.fastapi import DishkaRoute, FromDishka
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from models import EncryptedBlob, Mapping
from routes.internal import require_internal_token
from services.crypto import CryptoConfigError, envelope_decrypt, envelope_encrypt, from_b64_fields, to_b64_fields
from settings import Settings


router = APIRouter(prefix="/internal/secret", route_class=DishkaRoute, tags=["secret"])


class CreateCredentialRequest(BaseModel):
    username: str
    password: str


class CreateCredentialResponse(BaseModel):
    id: UUID


class DecryptForProxyRequest(BaseModel):
    admin_id: UUID
    target_id: UUID


class DecryptForProxyResponse(BaseModel):
    username: str
    password: str


@router.post("/credentials", dependencies=[Depends(require_internal_token)], response_model=CreateCredentialResponse)
async def create_credential(
    body: CreateCredentialRequest,
    settings: FromDishka[Settings],
):
    try:
        env = envelope_encrypt(settings=settings, username=body.username, password=body.password)
    except CryptoConfigError as e:
        raise HTTPException(status_code=500, detail=str(e))
    doc = EncryptedBlob(**to_b64_fields(env))
    await doc.insert()
    return CreateCredentialResponse(id=doc.id)


@router.post(
    "/decrypt",
    dependencies=[Depends(require_internal_token)],
    response_model=DecryptForProxyResponse,
)
async def decrypt_for_proxy(
    body: DecryptForProxyRequest,
    settings: FromDishka[Settings],
):
    # Enforce mapping exists for admin_id + target_id
    mapping = await Mapping.find_one(
        Mapping.admin_id == body.admin_id,
        Mapping.target_id == body.target_id,
        Mapping.disabled == False,  # noqa: E712
    )
    if not mapping:
        raise HTTPException(status_code=404, detail="Mapping not found")

    cred = await EncryptedBlob.get(mapping.credentials_id)
    if not cred or cred.disabled:
        raise HTTPException(status_code=404, detail="Credentials not found")

    fields = cred.model_dump()
    try:
        bin_fields = from_b64_fields(fields)
        username, password = envelope_decrypt(settings=settings, **bin_fields)
        return DecryptForProxyResponse(username=username, password=password)
    except CryptoConfigError as e:
        raise HTTPException(status_code=500, detail=str(e))
    except Exception:
        raise HTTPException(status_code=500, detail="Decrypt failed")

