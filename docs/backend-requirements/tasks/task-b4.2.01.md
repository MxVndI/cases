# TASK-B4.2.01

**Название:** Создать модель InventoryItem (Beanie Document)  
**Эпик:** [Epic B4: Инвентарь и баланс](../epics/epic-b04-inventory.md)  
**User Story:** [B-US-4.2: Управление инвентарём](../user-stories/b-us-4.2.md)  
**Статус:** Не начата  
**Исполнитель:** Владимир Таран

## Описание

Создать Beanie Document для хранения предметов инвентаря.

## Детали реализации

- Поля: id (UUID), user_id (UUID), item_id (UUID), case_id (UUID), obtained_at (datetime), status (active/sold)
- Индекс по user_id для быстрого поиска

## Критерии приёмки

1. Модель сохраняется и читается
2. Индекс по user_id
