# B-US-3.6: История выигрышей пользователя

**Эпик:** [Epic B3: Управление кейсами и справочниками](../epics/epic-b03-cases.md)

**Как** пользователь,  
**я хочу** просматривать историю своих выигрышей и выигрышей других пользователей,  
**чтобы** отслеживать статистику открытий.

## Критерии приёмки

- [ ] Модель WinHistory (Beanie Document): user_id, case_id, case_name, item_id, item_name, item_img_url, item_price, rarity_name, rarity_color, timestamp
- [ ] `GET /cases/wins/my` — список выигрышей текущего пользователя с пагинацией (offset/limit)
- [ ] `GET /cases/wins/my/stats` — статистика: total_opened + 3 последних выигрыша
- [ ] `GET /cases/wins/user/{user_id}` — список выигрышей любого пользователя с пагинацией
- [ ] `GET /cases/wins/user/{user_id}/stats` — статистика выигрышей пользователя

## Задачи

| Код | Название |
|-----|----------|
| TASK-B3.6.01 | Создать модель WinHistory |
| TASK-B3.6.02 | Реализовать GET /cases/wins/my |
| TASK-B3.6.03 | Реализовать GET /cases/wins/my/stats |
| TASK-B3.6.04 | Реализовать GET /cases/wins/user/{user_id} |
| TASK-B3.6.05 | Реализовать GET /cases/wins/user/{user_id}/stats |
