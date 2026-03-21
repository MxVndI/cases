# TASK-B5.3.01

**Название:** Реализовать middleware проверки роли admin  
**Эпик:** [Epic B5: Администрирование (API)](../epics/epic-b05-admin.md)  
**User Story:** [B-US-5.3: Проверка прав администратора](../user-stories/b-us-5.3.md)  
**Статус:** Не начата  
**Исполнитель:** Никита Миков

## Описание

Создать FastAPI dependency для проверки, что текущий пользователь имеет роль admin.

## Детали реализации

- Dependency: get_current_admin_user()
- Получить user_id через SessionService
- Загрузить пользователя, проверить role == "admin"
- При несоответствии — HTTPException 403

## Критерии приёмки

1. Admin проходит проверку
2. User получает 403
3. Guest получает 401
