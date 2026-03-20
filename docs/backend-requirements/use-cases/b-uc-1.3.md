# B-UC-1.3: Получение текущего пользователя (GET /me)

**Эпик:** [Epic B1: Аутентификация и авторизация](../epics/epic-b01-auth.md)

## Описание

Получение данных текущего авторизованного пользователя по cookie `sid`. Auth Service предоставляет эндпоинт `GET /me`, а также HTTP-эндпоинт `GET /verify_user/{ssid}` для межсервисной валидации сессий.

## Акторы

- **Первичный:** Пользователь (через фронтенд) / Другой сервис (межсервисный вызов)
- **Система:** Auth Service

## Предусловия

- Пользователь авторизован (cookie `sid` установлен)
- Сессия существует в MongoDB

## Основной сценарий — GET /me

1. Фронтенд отправляет `GET /me` с cookie `sid`
2. Auth Service извлекает `sid` из cookie
3. Auth Service верифицирует подпись HMAC-SHA256
4. Auth Service ищет сессию в MongoDB (Session collection)
5. Из сессии извлекаются данные пользователя
6. Возвращается объект User:
   - `id` (UUID)
   - `email`
   - `nickname`
   - `role` (`user` / `admin`)
   - `status` (`active` / `blocked`)
   - `created_at`

## Межсервисная валидация — GET /verify_user/{ssid}

1. Сервис-клиент (User Service, Cases Service, Admin Service) отправляет `GET /verify_user/{ssid}?token=...`
2. Auth Service верифицирует подпись `ssid` и межсервисный токен
3. Auth Service ищет сессию в MongoDB
4. Возвращает `{uid: "..."}` — идентификатор пользователя

## Постусловия

- Клиент получает данные пользователя или uid
- Запрос аутентифицирован

## Альтернативные сценарии

1. **Cookie `sid` отсутствует** → 401
2. **Невалидная подпись HMAC** → 401
3. **Сессия не найдена в MongoDB** → 401
4. **Межсервисный токен невалиден** (для `/verify_user`) → 403

## Связанные User Stories

- [B-US-1.3](../user-stories/b-us-1.3.md)
- [B-US-1.4](../user-stories/b-us-1.4.md)

---

> 📊 **Диаграмма последовательности:** [sequences.md → B-UC-1.3](sequences.md)
