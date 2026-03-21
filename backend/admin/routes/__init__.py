from fastapi import APIRouter

from .case import router as case_router
from .item import router as item_router
from .login import router as auth_router
from .rarity import router as rarity_router
from .tag import router as tag_router
from .upload import router as upload_router
from .user import router as user_router
from .weapon import router as weapon_router
from .weapon_type import router as weapon_type_router

router = APIRouter()

router.include_router(auth_router)
router.include_router(case_router)
router.include_router(item_router)
router.include_router(rarity_router)
router.include_router(tag_router)
router.include_router(upload_router)
router.include_router(user_router)
router.include_router(weapon_type_router)
router.include_router(weapon_router)
