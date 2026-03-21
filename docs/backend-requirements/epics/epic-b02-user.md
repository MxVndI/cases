# Epic B2: Управление пользователями

**Описание:** User Service отвечает за хранение и управление данными пользователей: автоматическое создание при первом входе, получение собственного профиля, обновление никнейма, публичные профили по никнейму, список пользователей с фильтрацией (для межсервисных вызовов), управление статусами (block/unblock). Межсервисная аутентификация — через HTTP-вызов к Auth Service (`/verify_user/{ssid}`) для cookie-сессий, Bearer-токены для сервисных вызовов. Взаимодействие с auth-сервисом также через Redis Streams RPC (user.rpc). Данные хранятся в MongoDB (Beanie ODM, user_db).

**Модель User:** id (UUID), email, nickname, role (user/admin), status (active/blocked), created_at, last_updated.

**Роли:** Пользователь, Сервис (межсервисные вызовы)  
**Связанные маршруты:** /api/user/v1/*  
**Зависимости:** Epic B1: Аутентификация — для валидации сессий

---

### User Stories

| Код | Название | Файл |
|-----|----------|------|
| B-US-2.1 | Создание и получение пользователя | [b-us-2.1.md](../user-stories/b-us-2.1.md) |
| B-US-2.2 | Обновление профиля пользователя | [b-us-2.2.md](../user-stories/b-us-2.2.md) |
| B-US-2.3 | Межсервисная коммуникация (User RPC) | [b-us-2.3.md](../user-stories/b-us-2.3.md) |
| B-US-2.4 | Публичные профили и управление статусами | [b-us-2.4.md](../user-stories/b-us-2.4.md) |

### Use Cases

| Код | Название | Файл |
|-----|----------|------|
| B-UC-2.1 | Создание пользователя при первом входе | [b-uc-2.1.md](../use-cases/b-uc-2.1.md) |
| B-UC-2.2 | Получение профиля через API | [b-uc-2.2.md](../use-cases/b-uc-2.2.md) |
| B-UC-2.3 | Публичный профиль и управление статусом | [b-uc-2.3.md](../use-cases/b-uc-2.3.md) |

### Все задачи эпика

| Код | Название | User Story |
|-----|----------|------------|
| TASK-B2.1.01 | Реализовать модель User (Beanie Document): id, email, nickname, role, status, created_at, last_updated | B-US-2.1 |
| TASK-B2.1.02 | Реализовать UserService.get_user_by_email с автосозданием | B-US-2.1 |
| TASK-B2.1.03 | Реализовать UserService.get_user_by_id | B-US-2.1 |
| TASK-B2.1.04 | Реализовать эндпоинт GET /v1/users/me (аутентификация через cookie sid → Auth Service) | B-US-2.1 |
| TASK-B2.1.05 | Реализовать эндпоинт POST /v1/users/ (создание пользователя, Bearer-токен) | B-US-2.1 |
| TASK-B2.2.01 | Реализовать эндпоинт PATCH /v1/users/me (обновление никнейма) | B-US-2.2 |
| TASK-B2.2.02 | Валидировать входные данные (UpdateMeRequest: nickname) | B-US-2.2 |
| TASK-B2.2.03 | Реализовать SessionService для валидации sid через HTTP к Auth Service | B-US-2.2 |
| TASK-B2.3.01 | Реализовать Redis Stream subscriber для user.rpc | B-US-2.3 |
| TASK-B2.3.02 | Обрабатывать RPC-запрос get (по email) | B-US-2.3 |
| TASK-B2.3.03 | Реализовать _verify_service_token для проверки Bearer-токенов | B-US-2.3 |
| TASK-B2.4.01 | Реализовать эндпоинт GET /v1/users/public/{nickname} (публичный профиль) | B-US-2.4 |
| TASK-B2.4.02 | Реализовать эндпоинт GET /v1/users/ (список с фильтрами: search, status, role, page, limit) | B-US-2.4 |
| TASK-B2.4.03 | Реализовать эндпоинт GET /v1/users/{user_id} (получить по ID, Bearer-токен) | B-US-2.4 |
| TASK-B2.4.04 | Реализовать эндпоинт PATCH /v1/users/{user_id}/status (block/unblock, Bearer-токен) | B-US-2.4 |
| TASK-B2.4.05 | Реализовать UserService.get_user_by_nickname | B-US-2.4 |
