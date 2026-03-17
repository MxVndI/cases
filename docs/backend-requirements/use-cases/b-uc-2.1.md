# B-UC-2.1: Получение и обновление профиля пользователя

**Эпик:** [Epic B2: Управление пользователями](../epics/epic-b02-user.md)

## Описание

Получение и обновление профиля текущего пользователя через User Service API. Аутентификация — через cookie `sid`, валидация сессии через Auth Service (`GET /verify_user/{ssid}`).

## Акторы

- **Первичный:** Пользователь
- **Система:** User Service, Auth Service

## Предусловия

- Пользователь авторизован (cookie `sid` установлен)
- Пользователь существует в User Service

## Модель пользователя

| Поле | Тип | Описание |
|-------|------|----------|
| `id` | UUID | Уникальный идентификатор |
| `email` | string | Email пользователя |
| `nickname` | string | Отображаемое имя |
| `role` | string | `user` / `admin` |
| `status` | string | `active` / `blocked` |
| `created_at` | datetime | Дата создания |
| `last_updated` | datetime | Дата последнего обновления |

## Основной сценарий — Получение профиля

1. Фронтенд отправляет `GET /v1/users/me` с cookie `sid`
2. Traefik маршрутизирует на User Service (strip prefix `/api/user`)
3. User Service извлекает `sid` из cookie и отправляет `GET /verify_user/{sid}?token=...` в Auth Service
4. Auth Service возвращает `{uid: "..."}` — идентификатор пользователя
5. User Service вызывает `get_user_by_id(user_id)`
6. Возвращается JSON с данными пользователя

## Дополнительный сценарий — Обновление профиля

1. Фронтенд отправляет `PATCH /v1/users/me` с cookie `sid` и телом `{nickname: "..."}`
2. User Service аутентифицирует пользователя (через Auth Service `/verify_user`)
3. User Service обновляет данные пользователя в БД, устанавливает `last_updated`
4. Возвращается обновлённый объект пользователя

## Постусловия

- Фронтенд получает JSON с данными пользователя
- При обновлении — данные сохранены в БД

## Альтернативные сценарии

1. **Cookie `sid` отсутствует** → 401
2. **Auth Service недоступен** (таймаут `/verify_user`) → 401
3. **Пользователь не найден** в БД → 404
4. **Пользователь заблокирован** (`status == blocked`) → 403

## Связанные User Stories

- [B-US-2.1](../user-stories/b-us-2.1.md)
- [B-US-2.2](../user-stories/b-us-2.2.md)
