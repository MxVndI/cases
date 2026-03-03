# TASK-B3.2.01

**Название:** Создать модель Item (Beanie Document)  
**Эпик:** [Epic B3: Управление кейсами](../epics/epic-b03-cases.md)  
**User Story:** [B-US-3.2: Содержимое кейса (предметы)](../user-stories/b-us-3.2.md)  
**Статус:** Не начата  
**Исполнитель:** Андрей Пикулев

## Описание

Создать Beanie Document для предметов: id, name, rarity, price, img_link.

## Детали реализации

- Поля: id (UUID/int), name (str), rarity (Literal), price (float), img_link (str)
- Rarity: common, rare, epic, legendary, exotic

## Критерии приёмки

1. Модель сохраняется и читается
2. Rarity валидируется
