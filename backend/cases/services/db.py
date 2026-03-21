from beanie import init_beanie
from ioc import container
from models.case import Case
from models.inventory import Inventory
from models.item import Item
from models.rarity import Rarity
from models.tag import Tag
from models.weapon import Weapon
from models.weapon_type import WeaponType
from models.win_history import WinHistory
from pymongo.asynchronous.database import AsyncDatabase


async def connect_db():
    db = await container.get(AsyncDatabase)
    await init_beanie(database=db, document_models=[Item, Case, Rarity, Tag, WeaponType, Weapon, Inventory, WinHistory])
