import hashlib
import hmac
import json
import logging

from settings import Settings
from fastapi import Request
from fastapi.responses import RedirectResponse
from fastapi_sso import SSOBase
from pydantic import EmailStr
from shortuuid import encode as short_encode, decode as short_decode
from uuid import UUID, uuid4
import shortuuid
from typing import Literal
from faststream.redis import RedisBroker
from services.redis import RedisService
from services.session import SessionService
from services.mail import MailSender

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
        self.sso_dict = sso_dict
        self.redis = redis_service
        self.mail_serive = mail_service

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
        self.mail_serive.send_email(email, "Code verification", str(code))
        response = RedirectResponse(url="/auth/email/login/finish", status_code=303)

        response.set_cookie(
            key="email",
            value=email,
            httponly=True,
            # secure=True,
            samesite="lax",
            max_age=30 * 24 * 60 * 60,
        )

        response.set_cookie(
            key="cvid",
            value=str(ver_ses_id),
            httponly=True,
            # secure=True,
            samesite="lax",
            max_age=30 * 24 * 60 * 60,
        )
        return response

    async def finish_verify_user_email(self, email: EmailStr, cvid: str, code: str):

        req_code = await self.redis.get(f"cvid:{cvid}")
        print(req_code, code)
        if req_code == code:
            return await self.register_user(email, "email")
        response = RedirectResponse(url="/auth-error")

        return response

    async def verify_user_oauth(
        self, provider: Literal["yandex", "discord"], request: Request
    ):

        async with self.get_sso(provider) as sso:
            logger.info("init sso")

            user = await sso.verify_and_process(request)

            if user:
                return await self.register_user(user.email, user.provider)
        return RedirectResponse(url="/auth-error")

    async def register_user(self, email, provider):

        if not self.broker:
            raise
        user_data = None
        try:
            user_data = await self.broker.request(
                stream="user.rpc", message={"email": email, "action": "get"}, timeout=5
            )
        except TimeoutError as e:
            # TODO amqp logic and maybe retries
            ...
        data = json.loads(user_data.body) if user_data else None
        ses_id = await self.session_service.create_session(email, provider, data)

        response = RedirectResponse(url="http://localhost:5173/welcome")
        signed_ses = self.sign_session(ses_id)

        response.set_cookie(
            key="sid",
            value=signed_ses,
            httponly=True,
            # secure=True,
            samesite="lax",
            max_age=30 * 24 * 60 * 60,
            path="/",
            domain="localhost",
        )

        return response

    async def verify_session_handler(self, msg: dict):
        signed_sid = msg.get("sid")
        id = self.verify_session(signed_sid)

        if id:
            ses = await self.session_service.get_session(id)
            return ses.model_dump()

        return None
