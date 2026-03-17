from dishka.integrations.fastapi import DishkaRoute
from fastapi import APIRouter, Depends
from routes.deps import require_admin

router = APIRouter(prefix="/auth", route_class=DishkaRoute, tags=["Auth"])


@router.get("/me", summary="Check admin session")
async def check_admin(admin_uid: str = Depends(require_admin)):
    """Verify the current session belongs to an admin user."""
    return {"authenticated": True, "uid": admin_uid}
