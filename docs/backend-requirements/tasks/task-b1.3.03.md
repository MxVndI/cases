# TASK-B1.3.03

**Название:** Реализовать SessionService  
**Эпик:** [Epic B1: Аутентификация и авторизация](../epics/epic-b01-auth.md)  
**User Story:** [B-US-1.3: Управление сессиями](../user-stories/b-us-1.3.md)  
**Статус:** Не начата  
**Исполнитель:** Никита Миков

## Описание

Создать сервис для бизнес-логики сессий: создание, получение, обновление данных.

## Детали реализации

- create_session(email, provider, user_data) → UUID
- get_session(session_id) → Session
- get_session_user(session_id) → dict (user data)
- update_session_user_info(session_id, user_info)

## Критерии приёмки

1. Сессия создаётся с корректными данными
2. Получение сессии возвращает полные данные
3. Обновление сессии сохраняется
