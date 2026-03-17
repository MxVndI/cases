from beanie import init_beanie
from pymongo.asynchronous.database import AsyncDatabase

from ioc import container
from models import AdminRef, AuditEvent, EncryptedBlob, Mapping, TargetSystem


async def connect_db() -> None:
    db = await container.get(AsyncDatabase)
    await init_beanie(
        database=db,
        document_models=[AdminRef, TargetSystem, EncryptedBlob, Mapping, AuditEvent],
    )

