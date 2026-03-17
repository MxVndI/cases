from __future__ import annotations

from typing import Annotated
from uuid import UUID

from aiohttp import ClientSession
from dishka.integrations.fastapi import DishkaRoute, FromDishka
from fastapi import APIRouter, Cookie, HTTPException, Request, Response
from redis.asyncio import Redis

from models import Mapping, TargetSystem
from services.auth_adapter import AuthAdapter
from services.audit import AuditService
from services.secret_service import SecretService
from services.upstream_sessions import UpstreamSessionStore


router = APIRouter(prefix="/aml/proxy", route_class=DishkaRoute, tags=["proxy"])


_HOP_BY_HOP = {
    "connection",
    "keep-alive",
    "proxy-authenticate",
    "proxy-authorization",
    "te",
    "trailers",
    "transfer-encoding",
    "upgrade",
}


def _filter_headers(headers: dict[str, str]) -> dict[str, str]:
    out: dict[str, str] = {}
    for k, v in headers.items():
        lk = k.lower()
        if lk in _HOP_BY_HOP:
            continue
        if lk == "host":
            continue
        out[k] = v
    return out


def _cookie_header(cookies: dict[str, str]) -> str | None:
    if not cookies:
        return None
    return "; ".join(f"{k}={v}" for k, v in cookies.items())


@router.api_route("/{target_id}/{path:path}", methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"])
async def proxy_any(
    target_id: UUID,
    path: str,
    request: Request,
    http: FromDishka[ClientSession],
    auth: FromDishka[AuthAdapter],
    secret: FromDishka[SecretService],
    audit: FromDishka[AuditService],
    redis: FromDishka[Redis],
    sid: Annotated[str | None, Cookie()] = None,
):
    if not sid:
        raise HTTPException(status_code=401)

    admin_id = await auth.get_admin_id_by_sid(sid)
    await audit.emit(event_type="proxy_access", admin_id=UUID(admin_id), target_id=target_id, metadata={"path": path})

    mapping = await Mapping.find_one(
        Mapping.admin_id == UUID(admin_id),
        Mapping.target_id == target_id,
        Mapping.disabled == False,  # noqa: E712
    )
    if not mapping:
        raise HTTPException(status_code=403, detail="No access to target")

    target = await TargetSystem.get(target_id)
    if not target or target.disabled:
        raise HTTPException(status_code=404, detail="Target not found")

    store = UpstreamSessionStore(redis)
    target_key = str(target_id)
    cookies = await store.get_cookies(admin_id, target_key)

    headers = _filter_headers(dict(request.headers))

    ch = _cookie_header(cookies)
    if ch:
        headers["Cookie"] = ch

    upstream_base = str(target.endpoint).rstrip("/")
    upstream_url = f"{upstream_base}/{path}"
    if request.url.query:
        upstream_url = f"{upstream_url}?{request.url.query}"

    body = await request.body()

    async with http.request(
        method=request.method,
        url=upstream_url,
        data=body if body else None,
        headers=headers,
        allow_redirects=False,
    ) as resp:
        # Update cookie jar from Set-Cookie
        set_cookie = resp.headers.getall("Set-Cookie", [])
        if set_cookie:
            new_cookies = store.apply_set_cookie_headers(cookies, set_cookie)
            await store.set_cookies(admin_id, target_key, new_cookies)

        # Rewrite redirects to stay under proxy path
        resp_headers = _filter_headers(dict(resp.headers))
        loc = resp_headers.get("Location")
        if loc and loc.startswith(upstream_base):
            resp_headers["Location"] = loc.replace(upstream_base, f"/aml/proxy/{target_id}", 1)
        # Prevent browser auth prompt if upstream sends challenge
        if "WWW-Authenticate" in resp_headers:
            resp_headers.pop("WWW-Authenticate", None)

        content = await resp.read()

        # For mongo-express, rewrite root-relative links + lightly restyle UI to feel modern
        if (
            target.type == "mongo"
            and isinstance(content, (bytes, bytearray))
        ):
            ct = resp_headers.get("Content-Type", "")
            if ct.startswith("text/html"):
                try:
                    text = content.decode("utf-8", errors="replace")
                    prefix = f"/aml/proxy/{target_id}"
                    text = text.replace('href="/', f'href="{prefix}/')
                    text = text.replace("href='/" , f"href='{prefix}/")
                    text = text.replace('action="/', f'action="{prefix}/')
                    text = text.replace("action='/" , f"action='{prefix}/")

                    # Inject a minimal dark theme on top of mongo-express markup.
                    # Не трогаем структуру, только стили — всё редактирование остаётся нативным.
                    inset = """
                    <style>
                      :root {
                        color-scheme: dark;
                      }
                      html,
                      body {
                        background: radial-gradient(circle at top, #020617 0, #020617 40%, #020617 100%) !important;
                        font-family: system-ui, -apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif !important;
                        color: #e5e7eb !important;
                        margin: 0 !important;
                      }
                      .container,
                      .container-fluid,
                      #wrapper,
                      #page-wrapper,
                      .row,
                      .col-md-12,
                      .col-xs-12 {
                        background-color: transparent !important;
                      }
                      .container,
                      .container-fluid {
                        margin-top: 12px !important;
                      }
                      a, a:hover {
                        color: #22c55e;
                      }
                      .navbar-inverse {
                        background: linear-gradient(90deg, #0f172a, #16a34a33) !important;
                        border-bottom: 1px solid rgba(34,197,94,0.45) !important;
                      }
                      .navbar-inverse .navbar-brand {
                        color: #e5e7eb !important;
                        text-shadow: 0 0 6px rgba(34,197,94,0.8);
                      }
                      .panel {
                        border-radius: 16px !important;
                        border-color: rgba(148,163,184,0.35) !important;
                        background: radial-gradient(circle at top left, rgba(34,197,94,0.08), rgba(15,23,42,0.98)) !important;
                        box-shadow: 0 18px 40px rgba(15,23,42,0.9) !important;
                        margin-bottom: 18px !important;
                      }
                      .panel-heading {
                        border-radius: 16px 16px 0 0 !important;
                        background: rgba(15,23,42,0.9) !important;
                        border-bottom-color: rgba(51,65,85,0.8) !important;
                      }
                      .table {
                        background: transparent !important;
                        color: #e5e7eb !important;
                      }
                      .table > thead > tr > th {
                        border-bottom-color: rgba(55,65,81,0.9) !important;
                        color: #9ca3af !important;
                      }
                      .table-striped > tbody > tr:nth-of-type(odd) {
                        background-color: rgba(15,23,42,0.85) !important;
                      }
                      .table-striped > tbody > tr:nth-of-type(even) {
                        background-color: rgba(15,23,42,0.65) !important;
                      }
                      /* Primary actions — читаемые, но без бешеного свечения */
                      .btn-primary {
                        border-radius: 999px !important;
                        border: 1px solid rgba(59,130,246,0.5) !important;
                        padding-inline: 16px !important;
                        background-image: none !important;
                        background-color: rgba(37,99,235,0.95) !important;
                        box-shadow: 0 10px 25px rgba(15,23,42,0.9) !important;
                        text-shadow: none !important;
                        color: #e5e7eb !important;
                      }
                      .btn-primary:hover {
                        background-color: rgba(59,130,246,1) !important;
                        border-color: rgba(96,165,250,0.9) !important;
                        box-shadow: 0 16px 40px rgba(15,23,42,0.95) !important;
                      }

                      /* Создание/удаление/опасные действия — прячем из UI, но не ломаем backend */
                      .btn-danger,
                      .btn-warning,
                      a[href*="dropDatabase"],
                      a[href*="dropCollection"],
                      a[href*="newDoc"],
                      a[href*="newDocument"],
                      a[href*="updateDocument"],
                      form[action*="dropCollection"],
                      form[action*="dropDatabase"] {
                        display: none !important;
                        padding: 0 !important;
                        margin: 0 !important;
                      }

                      .btn-danger {
                        border-radius: 999px !important;
                      }
                      input.form-control, select.form-control, textarea.form-control {
                        background-color: rgba(15,23,42,0.9) !important;
                        border-radius: 10px !important;
                        border-color: rgba(75,85,99,0.8) !important;
                        color: #e5e7eb !important;
                      }
                    </style>
                    """
                    if "</head>" in text:
                        text = text.replace("</head>", inset + "</head>", 1)
                    else:
                        text = inset + text

                    content = text.encode("utf-8")
                except Exception:
                    # If rewriting fails, just return original bytes
                    pass

        # Remove Content-Length to avoid mismatch after potential body rewriting
        # Starlette will recalculate it based on 'content'.
        resp_headers.pop("Content-Length", None)
        resp_headers.pop("content-length", None)

        return Response(
            content=content,
            status_code=resp.status,
            headers=resp_headers,
            media_type=resp_headers.get("Content-Type"),
        )

