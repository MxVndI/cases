# TASK-B1.1.05

**Название:** Установить подписанный cookie (sid)  
**Эпик:** [Epic B1: Аутентификация и авторизация](../epics/epic-b01-auth.md)  
**User Story:** [B-US-1.1: OAuth авторизация (Discord, Яндекс)](../user-stories/b-us-1.1.md)  
**Статус:** Не начата  
**Исполнитель:** Никита Миков

## Описание

Подписать session ID с использованием HMAC-SHA256 и установить cookie sid.

## Детали реализации

- Вызвать sign_session(session_id) — encode shortuuid + HMAC-SHA256
- Создать RedirectResponse на /welcome
- Установить cookie sid с параметрами: httponly, samesite=lax, max_age=30 дней
- Вернуть response

## Критерии приёмки

1. Cookie sid установлен
2. Подпись валидна и верифицируема
3. Cookie httponly (защита от XSS)
4. TTL cookie — 30 дней
