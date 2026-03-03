# TASK-B3.1.01

**Название:** Создать модель Case (Beanie Document)  
**Эпик:** [Epic B3: Управление кейсами](../epics/epic-b03-cases.md)  
**User Story:** [B-US-3.1: CRUD кейсов](../user-stories/b-us-3.1.md)  
**Статус:** Не начата  
**Исполнитель:** Андрей Пикулев

## Описание

Создать Beanie Document для хранения кейсов: id, name, price, img_link, category, items.

## Детали реализации

- Поля: id (UUID), name (str), price (float), img_link (str), category (str), description (str), items (list[CaseItem])
- CaseItem: item_id, drop_chance
- Field serializers для UUID

## Критерии приёмки

1. Модель сохраняется и читается
2. Связь с предметами через items
