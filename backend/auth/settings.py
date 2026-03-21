from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_nested_delimiter="__",
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    mongodb_url: str = "mongodb://localhost:27017"
    mongodb_db_name: str = "auth_db"
    redis_url: str = "redis://localhost:6379/0"
    app_name: str = "AuthService"
    app_version: str = "0.1"
    log_level: str = "INFO"

    yandex_cid: str = ""
    yandex_cs: str = ""

    # google_cid: str = ""
    # google_cs: str = ""

    discord_cid: str = ""
    discord_cs: str = ""

    # soundcloud_cid: str = ""
    # soundcloud_cs: str = ""

    smtp_server: str = ""
    smtp_port: int = 587
    smtp_use_ssl: bool = False
    smtp_starttls: bool = True
    smtp_timeout_s: int = 10
    email_address: str = ""
    email_password: str = ""
    secret_key: str = ""
    # Token used by auth-service to call other internal services (e.g. user-service)
    token: str = Field(default="", validation_alias="TOKEN")
    # Keep backward compatibility with existing env naming in repo (.env.example uses ALLOWED_TOKENS)
    api_tokens: list[str] = Field(default_factory=list, validation_alias="ALLOWED_TOKENS")
    frontend_url: str = "http://localhost:5173"
    cookie_domain: str = "localhost"
    cookie_secure: bool = False
    user_service_url: str = "http://localhost:8000"
