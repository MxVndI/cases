# TASK-B2.1.01

**Название:** Реализовать модель User (Beanie Document)  
**Эпик:** [Epic B2: Управление пользователями](../epics/epic-b02-user.md)  
**User Story:** [B-US-2.1: Создание и получение пользователя](../user-stories/b-us-2.1.md)  
**Статус:** Не начата  
**Исполнитель:** Никита Григоренко

## Описание

Создать Beanie Document для хранения пользователей в MongoDB: id, email, nickname, trade_link, status, timestamps.

## Детали реализации

- Поля: id (UUID), email (EmailStr), nickname (default_factory), trade_link (None), status (Literal active/blocked, default active), created_at, last_updated
- Default nickname: f"user{timestamp}"
- Field serializers для UUID и datetime
- Settings: bson_encoders, keep_nulls=False

## Критерии приёмки

1. Модель сохраняется и читается из MongoDB
2. Default nickname генерируется
3. Все поля сериализуются корректно
