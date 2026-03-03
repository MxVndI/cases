# TASK-B1.3.05

**Название:** Реализовать верификацию подписанной сессии  
**Эпик:** [Epic B1: Аутентификация и авторизация](../epics/epic-b01-auth.md)  
**User Story:** [B-US-1.3: Управление сессиями](../user-stories/b-us-1.3.md)  
**Статус:** Не начата  
**Исполнитель:** Никита Миков

## Описание

Реализовать метод verify_session: разбор signed_id, проверка подписи, возврат UUID.

## Детали реализации

- Разделить signed_id по последней точке: encoded_uuid, signature
- Decode shortuuid → UUID
- Пересчитать HMAC(secret_key, str(uuid), SHA256)
- Сравнить с hmac.compare_digest (timing-safe)
- При ошибке → None

## Критерии приёмки

1. Валидная подпись → UUID
2. Невалидная подпись → None
3. Некорректный формат → None
4. Сравнение timing-safe
