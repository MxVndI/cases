# B-US-3.1: CRUD кейсов

**Эпик:** [Epic B3: Управление кейсами](../epics/epic-b03-cases.md)  
**Роль:** Администратор

## User Story

Как администратор, я хочу создавать, редактировать и удалять кейсы через API.

## Описание

Case Service предоставляет REST API для полного управления кейсами. Публичный GET доступен всем, мутации защищены проверкой роли admin.

## Задачи

| Код | Название |
|-----|----------|
| [TASK-B3.1.01](../tasks/task-b3.1.01.md) | Создать модель Case (Beanie Document) |
| [TASK-B3.1.02](../tasks/task-b3.1.02.md) | Реализовать эндпоинт GET /cases |
| [TASK-B3.1.03](../tasks/task-b3.1.03.md) | Реализовать эндпоинт POST /cases (admin) |
| [TASK-B3.1.04](../tasks/task-b3.1.04.md) | Реализовать эндпоинт PUT /cases/{id} (admin) |
| [TASK-B3.1.05](../tasks/task-b3.1.05.md) | Реализовать эндпоинт DELETE /cases/{id} (admin) |
