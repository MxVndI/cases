from typing import Annotated

from dishka.integrations.fastapi import FromDishka, inject
from fastapi import Cookie, HTTPException
from pydantic import BaseModel, ConfigDict
from services.auth import AdminAuth


class AdminCookies(BaseModel):
    sid: str | None = None
    model_config = ConfigDict(extra="ignore")


@inject
async def require_admin(
    cookie: Annotated[AdminCookies, Cookie()],
    auth: FromDishka[AdminAuth],
) -> str:
    """Dependency that ensures the request is from an authenticated admin.
    Returns the admin's user_id."""
    if not cookie.sid:
        raise HTTPException(status_code=401, detail="Authentication required")
    return await auth.get_admin_user_id(cookie.sid)


@inject
async def require_superadmin(
    cookie: Annotated[AdminCookies, Cookie()],
    auth: FromDishka[AdminAuth],
) -> str:
    """Dependency that ensures the request is from an authenticated superadmin.
    Returns the superadmin's user_id."""
    if not cookie.sid:
        raise HTTPException(status_code=401, detail="Authentication required")
    return await auth.get_admin_user_id(cookie.sid, require_superadmin=True)
