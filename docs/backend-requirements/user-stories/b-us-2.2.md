# B-US-2.2: Регистрация пользователя

**Эпик:** [Epic B2: Управление пользователями](../epics/epic-b02-user.md)  
**Роль:** Auth Service (системный вызов)

## User Story

Как Auth Service, я хочу создавать пользователя в User Service при первом входе через OAuth или email, чтобы у каждого авторизованного пользователя был профиль.

## Описание

User Service предоставляет два механизма создания пользователей:

1. **HTTP API:** `POST /v1/users/` — защищён Bearer inter-service токеном. Вызывается Auth Service для создания пользователя.
2. **Redis Streams subscriber (user.rpc):** User Service подписан на поток `user.rpc`, обрабатывает сообщения от Auth Service для асинхронного создания/получения пользователей.

При создании пользователя генерируется nickname, если не указан. Если пользователь с таким email уже существует — возвращаются существующие данные.

## Критерии приёмки

- POST /v1/users/ создаёт пользователя (защищён Bearer inter-service токеном)
- Redis Streams subscriber (user.rpc) обрабатывает запросы от Auth Service
- При первом входе создаётся пользователь с автосгенерированным nickname
- При повторном запросе по email возвращается существующий пользователь
- Данные сохраняются в MongoDB (user_db)

## Задачи

| Код | Название |
|-----|----------|
| [TASK-B2.2.01](../tasks/task-b2.2.01.md) | Реализовать эндпоинт POST /v1/users/ (inter-service token auth) |
| [TASK-B2.2.02](../tasks/task-b2.2.02.md) | Реализовать Redis Streams subscriber (user.rpc) |
| [TASK-B2.2.03](../tasks/task-b2.2.03.md) | Реализовать логику создания пользователя с генерацией nickname |
