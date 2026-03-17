from datetime import datetime
from uuid import UUID, uuid4

from beanie import Document
from pydantic import ConfigDict, Field, field_serializer

from models.common import time_now


class EncryptedBlob(Document):
    """
    Encrypted credential material.

    Notes:
    - Plaintext is never stored.
    - This model is intentionally crypto-agnostic for now; Secret Service will define
      the exact envelope format and validations in the next steps.
    """

    id: UUID = Field(default_factory=uuid4)

    # Encryption metadata / versioning
    alg: str = "AES-256-GCM"
    key_version: int = 1

    # Envelope fields (Base64-encoded bytes)
    encrypted_dek_b64: str
    dek_iv_b64: str
    dek_tag_b64: str

    username_ct_b64: str
    username_iv_b64: str
    username_tag_b64: str

    password_ct_b64: str
    password_iv_b64: str
    password_tag_b64: str

    created_at: datetime = Field(default_factory=time_now)
    disabled: bool = False

    @field_serializer("id")
    def serialize_id(self, id: UUID):
        return str(id)

    @field_serializer("created_at")
    def serialize_created_at(self, dt: datetime):
        return dt.isoformat()

    model_config = ConfigDict(extra="ignore")

    class Settings:
        bson_encoders = {UUID: str}
        keep_nulls = False

