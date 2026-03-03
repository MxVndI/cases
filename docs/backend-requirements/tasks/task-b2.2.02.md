# TASK-B2.2.02

**Название:** Валидировать входные данные (SimpleUpdateRequest)  
**Эпик:** [Epic B2: Управление пользователями](../epics/epic-b02-user.md)  
**User Story:** [B-US-2.2: Обновление профиля пользователя](../user-stories/b-us-2.2.md)  
**Статус:** Не начата  
**Исполнитель:** Никита Григоренко

## Описание

Обеспечить валидацию входных данных: email формат, nickname не пустой, trade_link формат.

## Детали реализации

- Pydantic-схема SimpleUpdateRequest
- email: EmailStr | None
- nickname: str | None (min_length=1)
- trade_link: str | None
- ConfigDict(extra="ignore")

## Критерии приёмки

1. Невалидный email → 422
2. Пустой nickname → 422
3. Лишние поля игнорируются
