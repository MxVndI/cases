# B-US-3.5: CRUD справочников (редкости, теги, оружие, типы оружия)

**Эпик:** [Epic B3: Управление кейсами и справочниками](../epics/epic-b03-cases.md)

**Как** администратор,  
**я хочу** управлять справочными сущностями (редкости, теги, оружие, типы оружия),  
**чтобы** использовать их при создании предметов и кейсов.

## Критерии приёмки

- [ ] CRUD для `/rarities/`: name (строка), color (hex-цвет). GET — доступен всем, POST/PATCH/DELETE — по токену
- [ ] CRUD для `/tags/`: name (уникальная строка). GET — доступен всем, POST/PATCH/DELETE — по токену
- [ ] CRUD для `/weapons/`: name, type (ссылка на тип оружия). GET — доступен всем, POST/PATCH/DELETE — по токену
- [ ] CRUD для `/weapon-types/`: name. GET — доступен всем, POST/PATCH/DELETE — по токену
- [ ] Модели Rarity, Tag, Weapon, WeaponType — Beanie Documents с UUID-идентификаторами

## Задачи

| Код | Название |
|-----|----------|
| TASK-B3.5.01 | Создать модели Rarity, Tag, Weapon, WeaponType |
| TASK-B3.5.02 | Реализовать CRUD для /rarities/ |
| TASK-B3.5.03 | Реализовать CRUD для /tags/ |
| TASK-B3.5.04 | Реализовать CRUD для /weapons/ |
| TASK-B3.5.05 | Реализовать CRUD для /weapon-types/ |
