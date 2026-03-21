from uuid import UUID

from fastapi import HTTPException

from models import EncryptedBlob
from services.crypto import envelope_decrypt, from_b64_fields
from settings import Settings


class SecretService:
    def __init__(self, settings: Settings):
        self.settings = settings

    async def decrypt_credentials(self, credentials_id: UUID) -> tuple[str, str]:
        cred = await EncryptedBlob.get(credentials_id)
        if not cred or cred.disabled:
            raise HTTPException(status_code=404, detail="Credentials not found")
        fields = cred.model_dump()
        bin_fields = from_b64_fields(fields)
        username, password = envelope_decrypt(settings=self.settings, **bin_fields)
        return username, password

