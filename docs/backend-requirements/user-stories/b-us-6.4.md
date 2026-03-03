# B-US-6.4: Межсервисная коммуникация (Redis Streams)

**Эпик:** [Epic B6: Инфраструктура](../epics/epic-b06-infra.md)  
**Роль:** Разработчик

## User Story

Как разработчик, я хочу настроить межсервисное взаимодействие через Redis Streams для RPC-вызовов.

## Описание

FastStream (FastAPI-совместимая библиотека) для Redis Streams. Паттерн request-reply для синхронных RPC-вызовов между auth и user сервисами. DI-контейнеры Dishka для инъекции зависимостей.

## Задачи

| Код | Название |
|-----|----------|
| [TASK-B6.4.01](../tasks/task-b6.4.01.md) | Настроить Redis Streams для RPC |
| [TASK-B6.4.02](../tasks/task-b6.4.02.md) | Реализовать паттерн request-reply (FastStream) |
| [TASK-B6.4.03](../tasks/task-b6.4.03.md) | Настроить DI-контейнер Dishka для auth service |
| [TASK-B6.4.04](../tasks/task-b6.4.04.md) | Настроить DI-контейнер Dishka для user service |
