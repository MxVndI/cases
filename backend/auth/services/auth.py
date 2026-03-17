import hashlib
import hmac
import json
import logging
from typing import Literal
from uuid import UUID, uuid4

import aiohttp
import shortuuid
from fastapi import Request
from fastapi.responses import RedirectResponse
from fastapi_sso import SSOBase
from faststream.redis import RedisBroker
from pydantic import EmailStr
from settings import Settings
from shortuuid import decode as short_decode
from shortuuid import encode as short_encode

from services.mail import MailSender
from services.redis import RedisService
from services.session import SessionService

logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)


class AuthService:
    def __init__(
        self,
        ss: SessionService,
        broker: RedisBroker,
        mail_service: MailSender,
        redis_service: RedisService,
        settings: Settings,
        sso_dict: dict[str, SSOBase],
    ):
        self.broker = broker
        self.session_service = ss
        self.SECRET_KEY = settings.secret_key
        self.allowed_tokens = settings.api_tokens
        self.sso_dict = sso_dict
        self.redis = redis_service
        self.mail_service = mail_service
        self.settings = settings

    def sign_session(self, session_id: UUID) -> str:

        enc = short_encode(session_id)

        signature = hmac.new(
            self.SECRET_KEY.encode(), str(session_id).encode(), hashlib.sha256
        ).hexdigest()

        return f"{enc}.{signature}"

    def verify_session(self, signed_id: str) -> UUID | None:
        try:
            session_id_enc, signature = signed_id.rsplit(".", 1)

            session_id = short_decode(session_id_enc)

            expected_signature = hmac.new(
                self.SECRET_KEY.encode(),
                str(session_id).encode(),
                hashlib.sha256,
            ).hexdigest()

            if hmac.compare_digest(signature, expected_signature):
                return session_id

        except (ValueError, AttributeError, KeyError) as e:
            print(f"Verification error: {e}")
            return None

    def verify_token(self, token: str) -> bool:
        return token in self.allowed_tokens

    def get_sso(self, sso: Literal["yandex", "discord"]):
        if sso != "email":
            return self.sso_dict.get(sso)

    async def test(self):
        for i in range(500):
            await self.broker.publish(
                stream="auth-rpc", message="12345", maxlen=1000000
            )
            await self.broker.publish(
                stream="auth-rpc", message={"email": 123, "dog": "boom"}, maxlen=1000000
            )
        return "done"

    async def init_verify_user_email(self, email: EmailStr):
        ver_ses_id = uuid4()
        code = shortuuid.ShortUUID().random(length=6)
        await self.redis.create(
            prefix="cvid:", key=str(ver_ses_id), value=code, ttl=10 * 60
        )
        try:
            self.mail_service.send_email(email, "Code verification", str(code))
        except Exception as e:
            logger.error(f"Failed to send email: {e}")
            from fastapi import HTTPException
            raise HTTPException(
                status_code=503,
                detail="Email delivery is not configured or unavailable",
            )

        from fastapi.responses import JSONResponse
        response = JSONResponse(content={"ok": True, "message": "Code sent"})

        response.set_cookie(
            key="email",
            value=email,
            httponly=True,
            secure=self.settings.cookie_secure,
            samesite="lax",
            max_age=10 * 60,
        )

        response.set_cookie(
            key="cvid",
            value=str(ver_ses_id),
            httponly=True,
            secure=self.settings.cookie_secure,
            samesite="lax",
            max_age=10 * 60,
        )
        return response

    async def finish_verify_user_email(self, email: EmailStr, cvid: str, code: str, nickname: str | None = None):

        req_code = await self.redis.get(f"cvid:{cvid}")
        if req_code == code:
            return await self.register_user(email, "email", redirect=False, nickname=nickname)

        from fastapi import HTTPException
        raise HTTPException(status_code=400, detail="Invalid code")

    async def verify_user_oauth(
        self, provider: Literal["yandex", "discord"], request: Request
    ):

        async with self.get_sso(provider) as sso:
            logger.info("init sso")

            user = await sso.verify_and_process(request)

            if user:
                return await self.register_user(user.email, user.provider)
        return RedirectResponse(url="/auth-error")

    async def register_user(self, email, provider, redirect=True, nickname=None):

        user_data = None
        body = {"email": email}
        if nickname:
            body["nickname"] = nickname
        try:
            async with aiohttp.ClientSession() as session:
                service_token = self.settings.token or (self.allowed_tokens[0] if self.allowed_tokens else "")
                if not service_token:
                    raise RuntimeError("Service TOKEN/ALLOWED_TOKENS not configured")
                headers = {"Authorization": f"Bearer {service_token}"}
                async with session.post(
                    f"{self.settings.user_service_url}/v1/users/",
                    json=body,
                    headers=headers,
                    timeout=aiohttp.ClientTimeout(total=5),
                ) as resp:
                    if resp.status == 200:
                        user_data = await resp.json()
        except Exception as e:
            logger.error(f"Failed to get/create user: {e}")
        ses_id = await self.session_service.create_session(email, provider, user_data)

        signed_ses = self.sign_session(ses_id)

        if redirect:
            response = RedirectResponse(url=f"{self.settings.frontend_url}/welcome")
        else:
            from fastapi.responses import JSONResponse
            response = JSONResponse(content={"ok": True, "user": user_data})

        # Clear any old sid cookies (both host-only and domain variants)
        response.delete_cookie("sid", path="/")
        response.delete_cookie("sid", path="/", domain=self.settings.cookie_domain)
        response.set_cookie(
            key="sid",
            value=signed_ses,
            httponly=True,
            secure=self.settings.cookie_secure,
            samesite="lax",
            max_age=30 * 24 * 60 * 60,
            path="/",
        )

        return response

    async def init_profile_update_code(self, email: EmailStr):
        ver_ses_id = uuid4()
        code = shortuuid.ShortUUID().random(length=6)
        await self.redis.create(
            prefix="cvid:", key=str(ver_ses_id), value=code, ttl=10 * 60
        )
        try:
            self.mail_service.send_email(email, "Profile update code", str(code))
        except Exception as e:
            logger.error(f"Failed to send email: {e}")
            from fastapi import HTTPException
            raise HTTPException(
                status_code=503,
                detail="Email delivery is not configured or unavailable",
            )

        from fastapi.responses import JSONResponse
        response = JSONResponse(content={"ok": True, "message": "Code sent"})
        response.set_cookie(
            key="cvid",
            value=str(ver_ses_id),
            httponly=True,
            secure=self.settings.cookie_secure,
            samesite="lax",
            max_age=10 * 60,
        )
        return response

    async def finish_profile_update(self, cvid: str, code: str):
        req_code = await self.redis.get(f"cvid:{cvid}")
        if req_code != code:
            from fastapi import HTTPException
            raise HTTPException(status_code=400, detail="Invalid code")
        await self.redis.delete(f"cvid:{cvid}")
        from fastapi.responses import JSONResponse
        return JSONResponse(content={"ok": True, "verified": True})

    async def verify_session_handler(self, msg: dict):
        signed_sid = msg.get("sid")
        id = self.verify_session(signed_sid)

        if id:
            ses = await self.session_service.get_session(id)
            return ses.model_dump()

        return None
