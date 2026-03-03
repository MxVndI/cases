# B-US-6.3: Базы данных (MongoDB, Redis)

**Эпик:** [Epic B6: Инфраструктура](../epics/epic-b06-infra.md)  
**Роль:** Разработчик

## User Story

Как разработчик, я хочу настроить подключения к MongoDB и Redis для хранения данных и кеширования.

## Описание

MongoDB (Beanie ODM): отдельные БД для auth и user сервисов. Redis: кеширование сессий, хранение кодов верификации, Redis Streams для RPC. RedisManager с connection pool.

## Задачи

| Код | Название |
|-----|----------|
| [TASK-B6.3.01](../tasks/task-b6.3.01.md) | Настроить MongoDB (Beanie) для auth service |
| [TASK-B6.3.02](../tasks/task-b6.3.02.md) | Настроить MongoDB (Beanie) для user service |
| [TASK-B6.3.03](../tasks/task-b6.3.03.md) | Настроить Redis для кеширования |
| [TASK-B6.3.04](../tasks/task-b6.3.04.md) | Настроить Redis Connection Pool (RedisManager) |
