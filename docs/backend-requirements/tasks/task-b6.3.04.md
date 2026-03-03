# TASK-B6.3.04

**Название:** Настроить Redis Connection Pool (RedisManager)  
**Эпик:** [Epic B6: Инфраструктура](../epics/epic-b06-infra.md)  
**User Story:** [B-US-6.3: Базы данных (MongoDB, Redis)](../user-stories/b-us-6.3.md)  
**Статус:** Не начата  
**Исполнитель:** Владимир Таран

## Описание

Создать менеджер подключений к Redis с пулом для эффективного переиспользования.

## Детали реализации

- ConnectionPool.from_url с max_connections=20
- Health check interval=30s
- Context manager для безопасного получения/возврата клиента
- Graceful disconnect

## Критерии приёмки

1. Пул подключений работает
2. Health check проходит
3. Нет утечек соединений
