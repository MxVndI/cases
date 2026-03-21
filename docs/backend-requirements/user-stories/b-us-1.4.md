# B-US-1.4: Межсервисная авторизация

**Эпик:** [Epic B1: Аутентификация и авторизация](../epics/epic-b01-auth.md)  
**Роль:** Смежный сервис (User / Cases / Admin)

## User Story

Как смежный сервис, я хочу верифицировать сессии пользователей и обмениваться данными с Auth Service, чтобы аутентифицировать запросы.

## Описание

Межсервисная авторизация реализована двумя механизмами:

1. **HTTP-верификация сессий:** Auth Service предоставляет `GET /verify_user/{ssid}?token=...` с Bearer inter-service токеном. User Service, Cases Service и Admin Service вызывают этот эндпоинт для проверки cookie sid пользователя.
2. **Redis Streams (user.rpc):** Auth Service публикует сообщения в поток `user.rpc` для асинхронного создания/обновления пользователей в User Service при OAuth/email-входе.

## Критерии приёмки

- GET /verify_user/{ssid}?token=... возвращает данные сессии по ssid
- Доступ к /verify_user защищён Bearer inter-service токеном
- User/Cases/Admin сервисы вызывают Auth HTTP API для верификации cookie
- Redis Streams (user.rpc) используется для асинхронной передачи данных пользователя
- Auth публикует в user.rpc при OAuth и email-входе
- User Service подписан на user.rpc и создаёт/обновляет пользователя

## Задачи

| Код | Название |
|-----|----------|
| [TASK-B1.4.01](../tasks/task-b1.4.01.md) | Реализовать эндпоинт GET /verify_user/{ssid} с Bearer inter-service токеном |
| [TASK-B1.4.02](../tasks/task-b1.4.02.md) | Реализовать HTTP-клиент верификации в User/Cases/Admin сервисах |
| [TASK-B1.4.03](../tasks/task-b1.4.03.md) | Реализовать публикацию в Redis Streams (user.rpc) из Auth Service |
| [TASK-B1.4.04](../tasks/task-b1.4.04.md) | Реализовать подписчик Redis Streams (user.rpc) в User Service |
