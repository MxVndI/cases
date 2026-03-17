# B-US-5.3: Cookie-аутентификация администратора

**Эпик:** [Epic B5: Администрирование (API)](../epics/epic-b05-admin.md)  
**Роль:** Система

## User Story

Как система, я должна аутентифицировать администратора через cookie-сессию и проверять его роль перед выполнением защищённых операций.

## Описание

Admin Service (Python/FastAPI) использует **cookie-based аутентификацию** через FastAPI-dependency `require_admin`. Паролей нет — авторизация через OAuth + email-код, сессия хранится в cookie `sid`.

**Цепочка проверки (`require_admin`):**

1. Извлечение `sid` из cookie (`AdminCookies` — Pydantic-модель с `sid: str | None`)
2. Если `sid` отсутствует → `401 Authentication required`
3. Запрос к **Auth Service**: `GET /verify_user/{sid}?token={service_token}` → получение `uid`
4. Если Auth Service вернул не `200` или `uid` пуст → `401 Invalid session`
5. Запрос к **User Service**: `GET /v1/users/{uid}` с заголовком `Authorization: Bearer {service_token}` → получение данных пользователя
6. Проверка `role == "admin"` → если нет → `403 Admin access required`
7. Возвращает `uid` (строка) для использования в обработчике

**Компоненты:**

- `routes/deps.py` — dependency `require_admin` с DI через Dishka (`FromDishka[AdminAuth]`)
- `services/auth.py` — класс `AdminAuth` с методом `get_admin_user_id(sid)`
- `AdminCookies` — Pydantic-модель для извлечения cookie

**Использование:** все admin-роуты подключают `_: str = Depends(require_admin)` как dependency.

## Критерии приёмки

- Запрос без cookie `sid` → `401`
- Невалидный `sid` (Auth Service вернул ошибку) → `401`
- Пользователь с `role != "admin"` → `403`
- Auth Service недоступен → `503`
- Валидный admin-пользователь → dependency возвращает `uid`, запрос проходит
- Ошибки Auth/User Service логируются через `loguru`

## Задачи

| Код | Название |
|-----|----------|
| [TASK-B5.3.01](../tasks/task-b5.3.01.md) | Dependency require_admin: извлечение sid из cookie, вызов AdminAuth |
| [TASK-B5.3.02](../tasks/task-b5.3.02.md) | Сервис AdminAuth: верификация сессии через Auth Service /verify_user/{sid} |
| [TASK-B5.3.03](../tasks/task-b5.3.03.md) | Сервис AdminAuth: проверка роли admin через User Service /v1/users/{uid} |
