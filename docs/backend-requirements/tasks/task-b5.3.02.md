# TASK-B5.3.02

**Название:** Возвращать 403 Forbidden для не-администраторов  
**Эпик:** [Epic B5: Администрирование (API)](../epics/epic-b05-admin.md)  
**User Story:** [B-US-5.3: Проверка прав администратора](../user-stories/b-us-5.3.md)  
**Статус:** Не начата  
**Исполнитель:** Никита Миков

## Описание

Обеспечить корректный HTTP-ответ при попытке доступа без прав.

## Детали реализации

- HTTPException(status_code=403, detail="Forbidden: admin access required")
- JSON-ответ: {detail: "Forbidden..."}

## Критерии приёмки

1. Status code 403
2. Информативное сообщение
