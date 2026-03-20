# B-UC-2.2: Создание пользователя

**Эпик:** [Epic B2: Управление пользователями](../epics/epic-b02-user.md)

## Описание

Создание пользователя при первом входе. Пользователь создаётся через два механизма: межсервисный HTTP API (`POST /v1/users/` с токеном) или через Redis Streams subscriber (`user.rpc`).

## Акторы

- **Первичный:** Auth Service (клиент)
- **Система:** User Service (сервер)

## Предусловия

- Auth Service успешно авторизовал пользователя (OAuth или email)
- Пользователь с таким email ещё не существует

## Модель пользователя

| Поле | Тип | Описание |
|-------|------|----------|
| `id` | UUID | Генерируется при создании |
| `email` | string | Email пользователя |
| `nickname` | string | Отображаемое имя (по умолчанию из email) |
| `role` | string | `user` (по умолчанию) |
| `status` | string | `active` (по умолчанию) |

## Основной сценарий — Создание через Redis Streams (user.rpc)

1. Auth Service публикует RPC-сообщение в Redis Stream `user.rpc`: `{email: "...", action: "get"}`
2. User Service subscriber (`handle_rpc`) получает сообщение
3. User Service вызывает `get_user_by_email(email)`
4. Если пользователь не найден — создаётся новый User с email и default nickname
5. User Service возвращает JSON с данными пользователя
6. Auth Service сохраняет данные в сессии (`custom_data.user`)

## Дополнительный сценарий — Создание через HTTP API

1. Межсервисный клиент отправляет `POST /v1/users/` с заголовком `Authorization: Bearer <inter-service-token>`
2. User Service проверяет токен в `allowed_tokens`
3. User Service создаёт пользователя в БД
4. Возвращается JSON с данными нового пользователя

## Постусловия

- Пользователь создан в БД (если новый)
- Данные пользователя сохранены в сессии Auth Service

## Альтернативные сценарии

1. **Ошибка БД** → исключение, Auth Service создаёт сессию без данных пользователя
2. **Невалидный межсервисный токен** (для HTTP API) → 403
3. **Пользователь уже существует** → возвращается существующий пользователь (не дублируется)

## Связанные User Stories

- [B-US-2.1](../user-stories/b-us-2.1.md)

---

> 📊 **Диаграмма последовательности:** [sequences.md → B-UC-2.2](sequences.md)
