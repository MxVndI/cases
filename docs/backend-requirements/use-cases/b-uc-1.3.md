# B-UC-1.3: Валидация сессии через RPC

**Эпик:** [Epic B1: Аутентификация и авторизация](../epics/epic-b01-auth.md)

## Описание

Валидация сессии через RPC

## Акторы

- **Первичный:** User Service (клиент)
- **Система:** Auth Service (сервер)

## Предусловия

User Service получает HTTP-запрос с cookie sid

## Основной сценарий

1. User Service извлекает sid из cookie
2. User Service отправляет RPC-запрос через Redis Stream auth.rpc: {sid: "..."}
3. Auth Service получает сообщение в subscriber
4. Auth Service верифицирует подпись HMAC-SHA256
5. Auth Service получает сессию из Redis (или MongoDB fallback)
6. Auth Service возвращает данные сессии (custom_data с user)
7. User Service получает user_id из ответа

## Постусловия

Запрос пользователя аутентифицирован, user_id известен

## Альтернативные сценарии

1. Невалидная подпись → Auth Service возвращает null
2. Сессия не найдена → Auth Service возвращает null
3. Таймаут RPC (5 сек) → User Service возвращает 401

## Связанные User Stories

- [B-US-1.3](../user-stories/b-us-1.3.md)
- [B-US-1.4](../user-stories/b-us-1.4.md)
