# B-US-2.3: Межсервисная коммуникация (User RPC)

**Эпик:** [Epic B2: Управление пользователями](../epics/epic-b02-user.md)  
**Роль:** Auth Service

## User Story

Как Auth Service, я хочу получать данные пользователя через RPC, чтобы сохранять их в сессии при авторизации.

## Описание

User Service подписывается на Redis Stream user.rpc через FastStream. Обрабатывает action: "get" — возвращает пользователя по email (или создаёт нового). User Service также валидирует sid через auth.rpc.

## Задачи

| Код | Название |
|-----|----------|
| [TASK-B2.3.01](../tasks/task-b2.3.01.md) | Реализовать Redis Stream subscriber для user.rpc |
| [TASK-B2.3.02](../tasks/task-b2.3.02.md) | Обрабатывать RPC-запрос get (по email) |
| [TASK-B2.3.03](../tasks/task-b2.3.03.md) | Реализовать SessionService для валидации sid через auth.rpc |
