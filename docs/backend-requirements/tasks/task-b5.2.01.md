# TASK-B5.2.01

**Название:** Реализовать эндпоинт POST /admin/users/{userId}  
**Эпик:** [Epic B5: Администрирование (API)](../epics/epic-b05-admin.md)  
**User Story:** [B-US-5.2: Блокировка и разблокировка (admin)](../user-stories/b-us-5.2.md)  
**Статус:** Не начата  
**Исполнитель:** Никита Миков

## Описание

Эндпоинт для блокировки/разблокировки пользователя.

## Детали реализации

- POST /admin/users/{userId}, тело: {block: bool}
- Middleware admin
- block: true → status = blocked, block: false → status = active

## Критерии приёмки

1. Статус меняется
2. 403 для не-admin
3. 404 для несуществующего
