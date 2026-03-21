# TASK-B1.3.02

**Название:** Реализовать SessionRepo с кешированием в Redis  
**Эпик:** [Epic B1: Аутентификация и авторизация](../epics/epic-b01-auth.md)  
**User Story:** [B-US-1.3: Управление сессиями](../user-stories/b-us-1.3.md)  
**Статус:** Не начата  
**Исполнитель:** Никита Миков

## Описание

Создать репозиторий для работы с сессиями: чтение из Redis (cache), fallback на MongoDB, запись в оба хранилища.

## Детали реализации

- Метод get(id): сначала Redis → при промахе → MongoDB → записать в Redis
- Метод create(session): сохранить в MongoDB + Redis
- Метод delete(id): удалить из Redis + MongoDB
- TTL Redis-записи = оставшееся время жизни сессии
- Prefix ключей: sid:{id}

## Критерии приёмки

1. Cache hit: чтение из Redis без MongoDB
2. Cache miss: чтение из MongoDB + запись в Redis
3. Create: запись в оба хранилища
4. Delete: очистка в обоих хранилищах
