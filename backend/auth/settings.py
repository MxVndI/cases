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

    smtp_port: str = ""
    smtp_server: str = ""
    email_address: str = ""
    email_password: str = ""
    secret_key: str = ""
    # user_service_url: str = ""
