# TASK-B7.1.01

**Название:** Создать модель FarmState (Beanie Document)  
**Эпик:** [Epic B7: Ферма — бэкенд](../epics/epic-b07-farm.md)  
**User Story:** [B-US-7.1: Сохранение и загрузка прогресса фермы](../user-stories/b-us-7.1.md)  
**Статус:** Не начата  
**Исполнитель:** Никита Григоренко

## Описание

Создать Beanie Document для хранения прогресса фермы.

## Детали реализации

- Поля: id, user_id (UUID, unique), farm_balance (float), click_level (int), auto_level (int), multiplier_level (int), speed_level (int), last_saved (datetime)
- Индекс по user_id

## Критерии приёмки

1. Модель сохраняется и читается
2. Один state на пользователя (unique user_id)
