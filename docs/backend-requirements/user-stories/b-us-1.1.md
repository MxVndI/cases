# B-US-1.1: OAuth-авторизация (Discord, Яндекс)

**Эпик:** [Epic B1: Аутентификация и авторизация](../epics/epic-b01-auth.md)  
**Роль:** Гость

## User Story

Как гость, я хочу авторизоваться через OAuth-провайдер (Discord или Яндекс), чтобы быстро получить доступ к платформе без создания пароля.

## Описание

Auth Service (Python/FastAPI) обеспечивает вход через OAuth с помощью библиотеки **fastapi-sso** (провайдеры Discord и Яндекс). Эндпоинт `GET /{provider}/login` инициирует OAuth-флоу, `GET /auth/{provider}/callback` обрабатывает ответ провайдера. При успешной авторизации Auth Service публикует сообщение в **Redis Streams (user.rpc)** для создания/получения пользователя в User Service. После этого создаётся сессия (Beanie Document в MongoDB auth_db), session ID подписывается **HMAC-SHA256** с SECRET_KEY и устанавливается cookie `sid` (httponly, secure, samesite=none, max_age=30 дней). Пользователь перенаправляется на фронтенд.

## Критерии приёмки

- OAuth-флоу работает для Discord и Яндекс через fastapi-sso
- При первом входе пользователь создаётся через Redis Streams (user.rpc)
- При повторном входе данные пользователя обновляются
- Устанавливается HMAC-SHA256 подписанный cookie `sid` со сроком 30 дней
- После авторизации происходит redirect на фронтенд
- Паролей нет — только OAuth

## Задачи

| Код | Название |
|-----|----------|
| [TASK-B1.1.01](../tasks/task-b1.1.01.md) | Настроить OAuth-провайдеры (Discord, Яндекс) через fastapi-sso |
| [TASK-B1.1.02](../tasks/task-b1.1.02.md) | Реализовать эндпоинт GET /{provider}/login |
| [TASK-B1.1.03](../tasks/task-b1.1.03.md) | Реализовать callback GET /auth/{provider}/callback |
| [TASK-B1.1.04](../tasks/task-b1.1.04.md) | Публиковать в Redis Streams (user.rpc) для создания/получения пользователя |
| [TASK-B1.1.05](../tasks/task-b1.1.05.md) | Создать сессию в MongoDB (auth_db) и подписать sid (HMAC-SHA256) |
| [TASK-B1.1.06](../tasks/task-b1.1.06.md) | Установить cookie sid (httponly, secure, samesite=none, 30 дней) и redirect |
