# B-UC-2.2: Получение профиля через API

**Эпик:** [Epic B2: Управление пользователями](../epics/epic-b02-user.md)

## Описание

Получение профиля через API

## Акторы

- **Первичный:** Пользователь
- **Система:** User Service

## Предусловия

Пользователь авторизован (cookie sid)

## Основной сценарий

1. Фронтенд отправляет GET /api/user/v1/users/me с cookie sid
2. Traefik маршрутизирует на User Service (strip prefix /api/user)
3. DI inject SessionService через Dishka
4. get_current_user_id: извлекает sid из cookie, отправляет RPC на auth.rpc
5. Auth Service возвращает сессию с user_id
6. User Service получает user_id, вызывает UserService.get_user_by_id
7. Возвращает данные пользователя

## Постусловия

Фронтенд получает JSON с данными пользователя

## Альтернативные сценарии

1. Cookie sid отсутствует → 401
2. auth.rpc таймаут → 401
3. Пользователь не найден → 404

## Связанные User Stories

- [B-US-2.1](../user-stories/b-us-2.1.md)
- [B-US-2.2](../user-stories/b-us-2.2.md)
