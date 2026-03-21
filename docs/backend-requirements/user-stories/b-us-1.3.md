# B-US-1.3: Управление сессиями

**Эпик:** [Epic B1: Аутентификация и авторизация](../epics/epic-b01-auth.md)  
**Роль:** Система

## User Story

Как система, я должна управлять сессиями пользователей — создавать, хранить, кешировать и верифицировать.

## Описание

Сессии хранятся в **MongoDB (Beanie Document, auth_db)** и кешируются в **Redis** для быстрого доступа. Модель Session содержит поля: `ssid` (UUID), `user_id` (UUID), `ip`, `user_agent`, `created_at`, `expires_at`. Session ID подписывается **HMAC-SHA256** с SECRET_KEY. Cookie `sid` устанавливается с параметрами: httponly, secure, samesite=none, domain, max_age=30 дней.

## Критерии приёмки

- Session модель (Beanie Document): ssid, user_id, ip, user_agent, created_at, expires_at
- Сессии хранятся в MongoDB (auth_db) и кешируются в Redis
- Cookie sid подписывается HMAC-SHA256 с SECRET_KEY
- Параметры cookie: httponly=true, secure=true, samesite=none, domain, max_age=30 дней
- Верификация сессии проверяет подпись и срок действия
- Эндпоинт GET /verify_user/{ssid} для межсервисной верификации

## Задачи

| Код | Название |
|-----|----------|
| [TASK-B1.3.01](../tasks/task-b1.3.01.md) | Реализовать модель Session (Beanie Document): ssid, user_id, ip, user_agent, created_at, expires_at |
| [TASK-B1.3.02](../tasks/task-b1.3.02.md) | Реализовать SessionRepo с кешированием в Redis |
| [TASK-B1.3.03](../tasks/task-b1.3.03.md) | Реализовать SessionService (создание, верификация, удаление) |
| [TASK-B1.3.04](../tasks/task-b1.3.04.md) | Реализовать HMAC-SHA256 подпись/верификацию sid с SECRET_KEY |
| [TASK-B1.3.05](../tasks/task-b1.3.05.md) | Настроить cookie sid (httponly, secure, samesite=none, domain, 30 дней) |
