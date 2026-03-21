from fastapi import APIRouter

from .case import router as caser
from .farm import router as farmr
from .inventory import router as invr
from .item import router as itemr
from .rarity import router as rarityr
from .tag import router as tagr
from .weapon import router as weaponr
from .weapon_type import router as weapon_type_r

router = APIRouter()

router.include_router(caser, prefix="/cases")
router.include_router(caser)
router.include_router(farmr)
router.include_router(invr)
router.include_router(itemr)
router.include_router(rarityr)
router.include_router(tagr)
router.include_router(weapon_type_r)
router.include_router(weaponr)
