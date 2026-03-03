# TASK-B5.1.01

**Название:** Реализовать эндпоинт GET /admin/users с пагинацией  
**Эпик:** [Epic B5: Администрирование (API)](../epics/epic-b05-admin.md)  
**User Story:** [B-US-5.1: Просмотр пользователей (admin)](../user-stories/b-us-5.1.md)  
**Статус:** Не начата  
**Исполнитель:** Никита Миков

## Описание

Эндпоинт для получения списка пользователей с пагинацией (offset/limit).

## Детали реализации

- GET /admin/users?offset=0&limit=20
- Middleware admin
- MongoDB find с skip/limit
- Вернуть: users[], total_count

## Критерии приёмки

1. Пагинация работает
2. Total count корректен
3. 403 для не-admin
