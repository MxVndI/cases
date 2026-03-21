# B-US-5.2: Управление пользователями (админ)

**Эпик:** [Epic B5: Администрирование (API)](../epics/epic-b05-admin.md)  
**Роль:** Администратор

## User Story

Как администратор, я хочу просматривать, создавать и блокировать/разблокировать пользователей через Admin Service.

## Описание

Admin Service BFF проксирует запросы к User Service с inter-service токеном. Авторизация через `require_admin` (cookie sid → Auth verify → User role=admin).

Эндпоинты: `GET /users/` (список с фильтрами role, status, search), `POST /users/` (создание пользователя), `PATCH /users/{user_id}/status` (блокировка/разблокировка — изменение status на active/blocked).

## Критерии приёмки

- GET /users/ проксирует список пользователей с фильтрами из User Service
- POST /users/ создаёт пользователя через User Service
- PATCH /users/{user_id}/status изменяет статус (active/blocked)
- Все эндпоинты защищены require_admin auth
- Admin BFF проксирует запросы к User Service с Bearer inter-service токеном

## Задачи

| Код | Название |
|-----|----------|
| [TASK-B5.2.01](../tasks/task-b5.2.01.md) | Реализовать проксирование GET /users/ к User Service (список с фильтрами) |
| [TASK-B5.2.02](../tasks/task-b5.2.02.md) | Реализовать проксирование POST /users/ к User Service (создание) |
| [TASK-B5.2.03](../tasks/task-b5.2.03.md) | Реализовать PATCH /users/{user_id}/status (блокировка/разблокировка) |
| [TASK-B5.2.04](../tasks/task-b5.2.04.md) | Защитить все эндпоинты require_admin auth |
