# B-US-1.4: Межсервисная валидация сессий

**Эпик:** [Epic B1: Аутентификация и авторизация](../epics/epic-b01-auth.md)  
**Роль:** User Service

## User Story

Как User Service, я хочу валидировать сессии пользователей через Auth Service, чтобы аутентифицировать запросы.

## Описание

User Service отправляет RPC-запрос через Redis Stream auth.rpc с sid. Auth Service проверяет подпись и возвращает данные сессии. Используется FastStream для RPC-паттерна.

## Задачи

| Код | Название |
|-----|----------|
| [TASK-B1.4.01](../tasks/task-b1.4.01.md) | Реализовать Redis Stream subscriber для auth.rpc |
| [TASK-B1.4.02](../tasks/task-b1.4.02.md) | Обрабатывать RPC-запросы на валидацию sid |
| [TASK-B1.4.03](../tasks/task-b1.4.03.md) | Возвращать данные сессии через Redis Streams |
