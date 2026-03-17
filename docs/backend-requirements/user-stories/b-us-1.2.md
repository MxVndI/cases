# B-US-1.2: Вход по email (код подтверждения)

**Эпик:** [Epic B1: Аутентификация и авторизация](../epics/epic-b01-auth.md)  
**Роль:** Гость

## User Story

Как гость, я хочу авторизоваться по email с помощью одноразового кода, чтобы войти без пароля через подтверждение на почте.

## Описание

Auth Service (Python/FastAPI) реализует passwordless-вход по email. Эндпоинт `POST /email/login/start` принимает email, генерирует 6-символьный код через **shortuuid**, сохраняет его в **Redis с TTL 10 минут** и отправляет на email через **SMTP (aiosmtplib)**. Эндпоинт `POST /email/login/finish` принимает email и код, проверяет его в Redis, публикует в **Redis Streams (user.rpc)** для создания/получения пользователя в User Service, создаёт сессию и устанавливает подписанный cookie `sid`. Паролей нет.

## Критерии приёмки

- POST /email/login/start генерирует 6-символьный код (shortuuid) и сохраняет в Redis (TTL 10 мин)
- Код отправляется на email через SMTP (aiosmtplib)
- POST /email/login/finish проверяет код из Redis
- При успешной проверке пользователь создаётся/получается через Redis Streams (user.rpc)
- Устанавливается HMAC-SHA256 подписанный cookie sid (30 дней)
- Паролей нет — только код подтверждения

## Задачи

| Код | Название |
|-----|----------|
| [TASK-B1.2.01](../tasks/task-b1.2.01.md) | Реализовать эндпоинт POST /email/login/start |
| [TASK-B1.2.02](../tasks/task-b1.2.02.md) | Генерировать 6-символьный код (shortuuid) и сохранять в Redis (TTL 10 мин) |
| [TASK-B1.2.03](../tasks/task-b1.2.03.md) | Отправлять код на email через SMTP (aiosmtplib) |
| [TASK-B1.2.04](../tasks/task-b1.2.04.md) | Реализовать эндпоинт POST /email/login/finish |
| [TASK-B1.2.05](../tasks/task-b1.2.05.md) | Проверять код в Redis и создать пользователя через Redis Streams (user.rpc) |
| [TASK-B1.2.06](../tasks/task-b1.2.06.md) | Создать сессию и установить подписанный cookie sid |
