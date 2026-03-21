# TASK-B1.3.01

**Название:** Реализовать модель Session (Beanie Document)  
**Эпик:** [Epic B1: Аутентификация и авторизация](../epics/epic-b01-auth.md)  
**User Story:** [B-US-1.3: Управление сессиями](../user-stories/b-us-1.3.md)  
**Статус:** Не начата  
**Исполнитель:** Никита Миков

## Описание

Создать Beanie Document для хранения сессий в MongoDB: id (UUID), email, timestamps, auth_source, custom_data.

## Детали реализации

- Поля: id (UUID, default_factory), email (EmailStr), created_at, last_activity, expires_at (+30 дней), auth_source, custom_data (dict)
- Field serializers для UUID и datetime (JSON-safe)
- Настройка Settings: bson_encoders, keep_nulls=False

## Критерии приёмки

1. Модель сохраняется и читается из MongoDB
2. Все поля сериализуются корректно
3. TTL сессии — 30 дней по умолчанию
