from beanie import init_beanie
from ioc import container
from models.case import Case
from models.item import Item
from pymongo.asynchronous.database import AsyncDatabase


async def connect_db():
    db = await container.get(AsyncDatabase)
    await init_beanie(database=db, document_models=[Item, Case])
