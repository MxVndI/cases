# B-US-6.3: Базы данных и кеш

**Эпик:** [Epic B6: Инфраструктура](../epics/epic-b06-infra.md)  
**Роль:** Разработчик

## User Story

Как разработчик, я хочу настроить подключения к MongoDB и Redis для хранения данных, кеширования и межсервисного взаимодействия.

## Описание

**MongoDB 8.0** с 4 базами данных:
- `auth_db` — сессии (Auth Service, Beanie ODM)
- `user_db` — пользователи (User Service, Beanie ODM)
- `cases_db` — кейсы, предметы, редкости, теги, оружие, история, инвентарь (Cases Service, Beanie ODM)
- `payment_db` — балансы, транзакции (Payment Service, mongodb crate для Rust)

**Redis 8.4** используется для:
- Кеширование сессий (Auth Service)
- Email-коды с TTL 10 мин (Auth Service)
- Redis Streams (user.rpc) — межсервисное взаимодействие Auth → User
- recent_wins list (Cases Service)
- SSE pub/sub wins_channel (Cases Service)
- Farm state hash (Cases Service)
- Rate limiting (Payment Service, 10 req/sec для /tap)
- Daily bonus cooldown (Payment Service, 24h)

Python-сервисы используют **Beanie ODM**, Rust-сервис — **mongodb crate**.

## Критерии приёмки

- MongoDB 8.0 с 4 базами: auth_db, user_db, cases_db, payment_db
- Redis 8.4 для кеширования, TTL-кодов, Streams, SSE, rate limiting
- Python-сервисы используют Beanie ODM
- Payment Service (Rust) использует mongodb crate
- RedisManager с connection pool

## Задачи

| Код | Название |
|-----|----------|
| [TASK-B6.3.01](../tasks/task-b6.3.01.md) | Настроить MongoDB (Beanie) для auth_db |
| [TASK-B6.3.02](../tasks/task-b6.3.02.md) | Настроить MongoDB (Beanie) для user_db |
| [TASK-B6.3.03](../tasks/task-b6.3.03.md) | Настроить MongoDB (Beanie) для cases_db |
| [TASK-B6.3.04](../tasks/task-b6.3.04.md) | Настроить MongoDB (mongodb crate) для payment_db |
| [TASK-B6.3.05](../tasks/task-b6.3.05.md) | Настроить Redis для кеширования сессий и email-кодов (TTL) |
| [TASK-B6.3.06](../tasks/task-b6.3.06.md) | Настроить Redis Streams (user.rpc) |
| [TASK-B6.3.07](../tasks/task-b6.3.07.md) | Настроить Redis для recent_wins, SSE pub/sub, farm state |
| [TASK-B6.3.08](../tasks/task-b6.3.08.md) | Настроить Redis для rate limiting и daily bonus cooldown (Payment) |
