# B-US-2.3: Список пользователей

**Эпик:** [Epic B2: Управление пользователями](../epics/epic-b02-user.md)  
**Роль:** Admin Service (системный вызов)

## User Story

Как Admin Service, я хочу получать список пользователей с фильтрацией и поиском, чтобы администратор мог управлять пользователями.

## Описание

User Service предоставляет эндпоинт `GET /v1/users/` с query-параметрами для фильтрации по role, status и поиска по nickname. Доступ защищён **Bearer inter-service токеном**. Используется Admin Service BFF для проксирования запросов от администратора.

## Критерии приёмки

- GET /v1/users/ возвращает список пользователей
- Поддержка фильтрации по role (user/admin) и status (active/blocked)
- Поддержка поиска по nickname
- Доступ защищён Bearer inter-service токеном
- Используется Admin Service для проксирования запросов

## Задачи

| Код | Название |
|-----|----------|
| [TASK-B2.3.01](../tasks/task-b2.3.01.md) | Реализовать эндпоинт GET /v1/users/ с query-параметрами (role, status, search) |
| [TASK-B2.3.02](../tasks/task-b2.3.02.md) | Реализовать фильтрацию по role и status |
| [TASK-B2.3.03](../tasks/task-b2.3.03.md) | Реализовать поиск по nickname |
| [TASK-B2.3.04](../tasks/task-b2.3.04.md) | Защитить эндпоинт Bearer inter-service токеном |
