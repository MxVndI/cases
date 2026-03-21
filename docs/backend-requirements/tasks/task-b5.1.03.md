# TASK-B5.1.03

**Название:** Реализовать поиск по email и nickname  
**Эпик:** [Epic B5: Администрирование (API)](../epics/epic-b05-admin.md)  
**User Story:** [B-US-5.1: Просмотр пользователей (admin)](../user-stories/b-us-5.1.md)  
**Статус:** Не начата  
**Исполнитель:** Никита Миков

## Описание

Добавить query-параметр search для поиска по email и nickname.

## Детали реализации

- Query param: search (optional)
- MongoDB $or: [{email: {$regex: search, $options: "i"}}, {nickname: {$regex: search, $options: "i"}}]
- Комбинируется с фильтрами

## Критерии приёмки

1. Поиск по email работает
2. Поиск по nickname работает
3. Регистронезависимый
