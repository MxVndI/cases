from typing import Annotated
from uuid import UUID

from dishka.integrations.fastapi import DishkaRoute, FromDishka
from fastapi import APIRouter, Cookie, HTTPException
from fastapi.responses import HTMLResponse, RedirectResponse

from beanie.operators import In

from models import Mapping, TargetSystem
from services.auth_adapter import AuthAdapter
from settings import Settings
from .bootstrap import bootstrap_for_admin


router = APIRouter(route_class=DishkaRoute, tags=["ui"])


@router.get("/aml", response_class=HTMLResponse)
async def aml_home(
    auth: FromDishka[AuthAdapter],
    settings: FromDishka[Settings],
    sid: Annotated[str | None, Cookie()] = None,
):
    if not sid:
        raise HTTPException(status_code=401)
    admin_id = await auth.get_admin_id_by_sid(sid)
    mappings = await Mapping.find(
        Mapping.admin_id == UUID(admin_id),
        Mapping.disabled == False,  # noqa: E712
    ).to_list()

    # Auto-bootstrap for this admin if nothing mapped yet
    if not mappings:
        try:
            await bootstrap_for_admin(UUID(admin_id), settings)
            mappings = await Mapping.find(
                Mapping.admin_id == UUID(admin_id),
                Mapping.disabled == False,  # noqa: E712
            ).to_list()
        except Exception:
            # Fall back to simple message; detailed errors stay server-side
            return HTMLResponse("<h3>AML</h3><p>Bootstrap failed. Contact administrator.</p>", status_code=500)

    if not mappings:
        return HTMLResponse("<h3>AML</h3><p>No targets mapped.</p>", status_code=200)

    target_ids = [m.target_id for m in mappings]
    targets = await TargetSystem.find(
        In(TargetSystem.id, target_ids),
        TargetSystem.disabled == False,  # noqa: E712
    ).to_list()

    if not targets:
        return HTMLResponse("<h3>AML</h3><p>No active targets available.</p>", status_code=200)

    def card_for(t: TargetSystem) -> str:
        accent = "#22c55e" if t.type == "mongo" else "#f97316"
        icon = "🟢" if t.type == "mongo" else "🧰"
        label = "MongoDB Admin" if t.type == "mongo" else "Redis Commander"
        return f"""
        <a class="aml-card" href="/aml/proxy/{t.id}/" target="_blank" rel="noopener noreferrer" data-type="{t.type}">
          <div class="aml-card-header">
            <span class="aml-card-icon">{icon}</span>
            <span class="aml-card-name">{t.name}</span>
          </div>
          <div class="aml-card-subtitle">{label}</div>
          <div class="aml-card-chip" style="--accent:{accent}">{t.type.upper()}</div>
        </a>
        """

    items = "".join(card_for(t) for t in targets)
    html = f"""
    <html>
      <head>
        <title>AML — Admin UIs</title>
        <meta charset="utf-8" />
        <style>
          :root {{
            color-scheme: dark;
          }}
          body {{
            margin: 0;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            background: radial-gradient(circle at top, #1f2933 0, #020617 55%);
            font-family: system-ui, -apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif;
            color: #e5e7eb;
          }}
          .aml-shell {{
            width: 100%;
            max-width: 960px;
            padding: 32px 20px;
          }}
          .aml-card-grid {{
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
            gap: 16px;
            margin-top: 20px;
          }}
          .aml-header {{
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 12px;
          }}
          @media (max-width: 640px) {{
            .aml-header {{
              flex-direction: column;
              align-items: flex-start;
            }}
          }}
          .aml-title {{
            font-size: 24px;
            font-weight: 600;
          }}
          .aml-subtitle {{
            font-size: 14px;
            opacity: 0.8;
            max-width: 520px;
          }}
          .aml-pill {{
            padding: 6px 10px;
            border-radius: 999px;
            border: 1px solid rgba(96, 165, 250, 0.5);
            font-size: 12px;
            color: #bfdbfe;
            background: linear-gradient(135deg, rgba(59,130,246,0.25), rgba(59,130,246,0.05));
          }}
          .aml-card {{
            position: relative;
            display: block;
            padding: 16px 18px;
            border-radius: 16px;
            border: 1px solid rgba(148, 163, 184, 0.25);
            background: radial-gradient(circle at top left, rgba(34,197,94,0.10), rgba(15,23,42,0.96));
            text-decoration: none;
            color: inherit;
            box-shadow: 0 16px 40px rgba(15,23,42,0.7);
            overflow: hidden;
            transition: transform 0.16s ease-out, box-shadow 0.16s ease-out, border-color 0.16s ease-out, background 0.16s ease-out;
          }}
          .aml-card[data-type="redis"] {{
            background: radial-gradient(circle at top left, rgba(249,115,22,0.12), rgba(15,23,42,0.96));
          }}
          .aml-card::before {{
            content: "";
            position: absolute;
            inset: -1px;
            border-radius: inherit;
            border: 1px solid rgba(59,130,246,0.55);
            opacity: 0;
            transition: opacity 0.16s ease-out;
          }}
          .aml-card:hover {{
            transform: translateY(-3px);
            box-shadow: 0 22px 60px rgba(8,47,73,0.9);
            border-color: rgba(59,130,246,0.75);
            background: radial-gradient(circle at top left, rgba(96,165,250,0.55), rgba(15,23,42,0.98));
          }}
          .aml-card:hover::before {{
            opacity: 1;
          }}
          .aml-card-header {{
            display: flex;
            align-items: center;
            gap: 10px;
          }}
          .aml-card-icon {{
            font-size: 20px;
            filter: drop-shadow(0 0 4px rgba(34,197,94,0.7));
          }}
          .aml-card-name {{
            font-size: 16px;
            font-weight: 600;
          }}
          .aml-card-subtitle {{
            font-size: 13px;
            margin-top: 4px;
            opacity: 0.85;
          }}
          .aml-card-chip {{
            position: absolute;
            right: 14px;
            bottom: 14px;
            padding: 4px 10px;
            border-radius: 999px;
            border: 1px solid color-mix(in srgb, var(--accent) 75%, #0f172a);
            font-size: 11px;
            letter-spacing: 0.05em;
            text-transform: uppercase;
            color: var(--accent);
            background: radial-gradient(circle at top, color-mix(in srgb, var(--accent) 40%, transparent), transparent);
          }}
        </style>
      </head>
      <body>
        <div class="aml-shell">
          <div class="aml-header">
            <div>
              <div class="aml-title">Access Management Layer</div>
              <div class="aml-subtitle">Авторизуйтесь в административных панелях без ввода логинов и паролей.</div>
            </div>
            <div class="aml-pill">Администратор: защищённый доступ</div>
          </div>
          <div class="aml-card-grid">
            {items}
          </div>
        </div>
      </body>
    </html>
    """
    return HTMLResponse(html, status_code=200)


@router.get("/mongo-admin")
async def mongo_admin_redirect():
    return RedirectResponse(url="/aml", status_code=302)


@router.get("/redis-admin")
async def redis_admin_redirect():
    return RedirectResponse(url="/aml", status_code=302)

