# Epic B3: Управление кейсами и справочниками

**Описание:** Cases Service — центральный сервис платформы. Обеспечивает полный жизненный цикл кейсов (CRUD с полями system_name, tag, status), предметов (Item, привязка к Weapon и Rarity), а также CRUD справочных сущностей: Rarity (редкость), Tag (тег/категория), Weapon (оружие), WeaponType (тип оружия). Реализовано открытие кейса по ID, имени и system_name с алгоритмом случайного выпадения по вероятностям, проверкой баланса через Payment Service и добавлением в инвентарь. SSE-лента (Server-Sent Events) транслирует выигрыши в реальном времени через Redis pub/sub. История выигрышей (WinHistory) хранится в MongoDB с эндпоинтами для получения своих выигрышей и выигрышей других пользователей. Мутации (POST/PATCH/DELETE) защищены статическим `token` (LocalAuth).

**Роли:** Гость, Пользователь, Администратор (через токен)  
**Связанные маршруты:** /api/cases/*  
**Зависимости:** Epic B4: Инвентарь — добавление предметов после открытия; Epic B1: Auth — верификация cookie; Payment Service — проверка и списание баланса

---

### User Stories

| Код | Название | Файл |
|-----|----------|------|
| B-US-3.1 | CRUD кейсов | [b-us-3.1.md](../user-stories/b-us-3.1.md) |
| B-US-3.2 | CRUD предметов | [b-us-3.2.md](../user-stories/b-us-3.2.md) |
| B-US-3.3 | Открытие кейса (игровая логика) | [b-us-3.3.md](../user-stories/b-us-3.3.md) |
| B-US-3.4 | Последние выигрыши и SSE-лента | [b-us-3.4.md](../user-stories/b-us-3.4.md) |
| B-US-3.5 | CRUD справочников (редкости, теги, оружие, типы оружия) | [b-us-3.5.md](../user-stories/b-us-3.5.md) |
| B-US-3.6 | История выигрышей пользователя | [b-us-3.6.md](../user-stories/b-us-3.6.md) |

### Use Cases

| Код | Название | Файл |
|-----|----------|------|
| B-UC-3.1 | Управление кейсом (CRUD) | [b-uc-3.1.md](../use-cases/b-uc-3.1.md) |
| B-UC-3.2 | Открытие кейса пользователем | [b-uc-3.2.md](../use-cases/b-uc-3.2.md) |
| B-UC-3.3 | SSE-лента и история выигрышей | [b-uc-3.3.md](../use-cases/b-uc-3.3.md) |

### Все задачи эпика

| Код | Название | User Story |
|-----|----------|------------|
| TASK-B3.1.01 | Создать модель Case (Beanie Document): name, system_name, price, img_url, case_content, tag, status | B-US-3.1 |
| TASK-B3.1.02 | Реализовать эндпоинт GET /cases/ (список, disabled видны только admin) | B-US-3.1 |
| TASK-B3.1.03 | Реализовать эндпоинт GET /cases/{id} | B-US-3.1 |
| TASK-B3.1.04 | Реализовать эндпоинт GET /cases/by-name/{name} | B-US-3.1 |
| TASK-B3.1.05 | Реализовать эндпоинт GET /cases/by-system-name/{system_name} | B-US-3.1 |
| TASK-B3.1.06 | Реализовать эндпоинт POST /cases/ (admin, token) | B-US-3.1 |
| TASK-B3.1.07 | Реализовать эндпоинт PATCH /cases/ (admin, id в теле, token) | B-US-3.1 |
| TASK-B3.1.08 | Реализовать эндпоинт DELETE /cases/{id} (admin, token) | B-US-3.1 |
| TASK-B3.2.01 | Создать модель Item (Beanie Document): name, price, img_url, rarity_id, weapon_id | B-US-3.2 |
| TASK-B3.2.02 | Реализовать эндпоинты GET /items/ и GET /items/{id} | B-US-3.2 |
| TASK-B3.2.03 | Реализовать эндпоинт POST /items/ (admin, token) | B-US-3.2 |
| TASK-B3.2.04 | Реализовать эндпоинт PATCH /items/ (admin, token) | B-US-3.2 |
| TASK-B3.2.05 | Реализовать эндпоинт DELETE /items/{id} (admin, token) | B-US-3.2 |
| TASK-B3.3.01 | Реализовать эндпоинт POST /cases/open/{id} | B-US-3.3 |
| TASK-B3.3.02 | Реализовать эндпоинт POST /cases/open/by-name/{name} | B-US-3.3 |
| TASK-B3.3.03 | Реализовать эндпоинт POST /cases/open/by-system-name/{system_name} | B-US-3.3 |
| TASK-B3.3.04 | Реализовать алгоритм выпадения на основе вероятностей (drop_chance) | B-US-3.3 |
| TASK-B3.3.05 | Проверять баланс через Payment Service перед открытием | B-US-3.3 |
| TASK-B3.3.06 | Списать стоимость кейса через Payment Service | B-US-3.3 |
| TASK-B3.3.07 | Добавить предмет в инвентарь (InventoryService) | B-US-3.3 |
| TASK-B3.3.08 | Записать открытие в WinHistory | B-US-3.3 |
| TASK-B3.3.09 | Опубликовать выигрыш в Redis (recent_wins list + wins_channel pub/sub) | B-US-3.3 |
| TASK-B3.3.10 | Реализовать POST /cases/calculate_chances (admin) | B-US-3.3 |
| TASK-B3.3.11 | Реализовать POST /cases/calculate_price (admin) | B-US-3.3 |
| TASK-B3.4.01 | Реализовать SSE-эндпоинт GET /cases/wins/stream (Redis pub/sub wins_channel) | B-US-3.4 |
| TASK-B3.4.02 | Реализовать GET /cases/recent_wins (Redis List, обогащение item_img_url и user_nickname) | B-US-3.4 |
| TASK-B3.5.01 | Создать модели Rarity, Tag, Weapon, WeaponType (Beanie Documents) | B-US-3.5 |
| TASK-B3.5.02 | Реализовать CRUD для /rarities/ (name, color) | B-US-3.5 |
| TASK-B3.5.03 | Реализовать CRUD для /tags/ (name) | B-US-3.5 |
| TASK-B3.5.04 | Реализовать CRUD для /weapons/ (name, type) | B-US-3.5 |
| TASK-B3.5.05 | Реализовать CRUD для /weapon-types/ (name) | B-US-3.5 |
| TASK-B3.6.01 | Создать модель WinHistory (Beanie Document) | B-US-3.6 |
| TASK-B3.6.02 | Реализовать GET /cases/wins/my (с пагинацией offset/limit) | B-US-3.6 |
| TASK-B3.6.03 | Реализовать GET /cases/wins/my/stats (total_opened + recent 3) | B-US-3.6 |
| TASK-B3.6.04 | Реализовать GET /cases/wins/user/{user_id} (с пагинацией) | B-US-3.6 |
| TASK-B3.6.05 | Реализовать GET /cases/wins/user/{user_id}/stats | B-US-3.6 |
