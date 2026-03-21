# B-US-2.1: Профиль пользователя

**Эпик:** [Epic B2: Управление пользователями](../epics/epic-b02-user.md)  
**Роль:** Пользователь

## User Story

Как пользователь, я хочу просматривать и редактировать свой профиль, чтобы управлять своими данными на платформе.

## Описание

User Service (Python/FastAPI, Beanie/MongoDB user_db) предоставляет эндпоинты для работы с профилем. `GET /v1/users/me` возвращает данные текущего пользователя — авторизация через cookie `sid`, которая верифицируется HTTP-запросом к Auth Service (`GET /verify_user/{ssid}`). `PATCH /v1/users/me` позволяет обновить nickname.

Модель **User** (Beanie Document): `id` (UUID), `email`, `nickname`, `role` (user/admin), `status` (active/blocked), `created_at`, `last_updated`.

## Критерии приёмки

- GET /v1/users/me возвращает профиль текущего пользователя
- Авторизация через cookie sid → HTTP-запрос к Auth Service /verify_user/{ssid}
- PATCH /v1/users/me позволяет обновить nickname
- User модель: id (UUID), email, nickname, role (user/admin), status (active/blocked), created_at, last_updated
- Данные хранятся в MongoDB (user_db) через Beanie ODM

## Задачи

| Код | Название |
|-----|----------|
| [TASK-B2.1.01](../tasks/task-b2.1.01.md) | Реализовать модель User (Beanie Document): id UUID, email, nickname, role, status, created_at, last_updated |
| [TASK-B2.1.02](../tasks/task-b2.1.02.md) | Реализовать авторизацию через cookie sid → Auth Service /verify_user/{ssid} |
| [TASK-B2.1.03](../tasks/task-b2.1.03.md) | Реализовать эндпоинт GET /v1/users/me |
| [TASK-B2.1.04](../tasks/task-b2.1.04.md) | Реализовать эндпоинт PATCH /v1/users/me (обновление nickname) |
