# TASK-B1.3.04

**Название:** Реализовать подпись сессии (HMAC-SHA256)  
**Эпик:** [Epic B1: Аутентификация и авторизация](../epics/epic-b01-auth.md)  
**User Story:** [B-US-1.3: Управление сессиями](../user-stories/b-us-1.3.md)  
**Статус:** Не начата  
**Исполнитель:** Никита Миков

## Описание

Реализовать метод sign_session: кодирование UUID через shortuuid + HMAC-SHA256 подпись.

## Детали реализации

- Encode UUID → shortuuid
- HMAC(secret_key, str(uuid), SHA256) → hex signature
- Формат: {encoded_uuid}.{signature}
- Secret key из Settings

## Критерии приёмки

1. Подпись генерируется детерминированно
2. Один и тот же UUID даёт одну и ту же подпись
3. Secret key не захардкожен
