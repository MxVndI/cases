from datetime import UTC, datetime


def time_now() -> datetime:
    return datetime.now(tz=UTC)

