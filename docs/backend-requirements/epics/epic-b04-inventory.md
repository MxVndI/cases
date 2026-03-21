# Epic B4: Инвентарь и баланс

**Описание:** Управление инвентарём и балансом пользователя. Инвентарь реализован в Cases Service: хранение предметов, просмотр, продажа отдельного предмета и продажа всех предметов. Баланс управляется отдельным Payment Service (Rust/Axum): кошелёк с валютой CHC, транзакции (started→completed/failed), проверка средств. Продажа предмета списывает его из инвентаря и создаёт транзакцию system→user через Payment Service.

**Роли:** Пользователь  
**Связанные маршруты:** /api/cases/inventory/*, /api/payment/balance/*, /api/payment/transaction/*  
**Зависимости:** Epic B3: Кейсы — предметы попадают в инвентарь при открытии; Payment Service — для начисления средств при продаже

---

### User Stories

| Код | Название | Файл |
|-----|----------|------|
| B-US-4.1 | Управление балансом (Payment Service) | [b-us-4.1.md](../user-stories/b-us-4.1.md) |
| B-US-4.2 | Управление инвентарём | [b-us-4.2.md](../user-stories/b-us-4.2.md) |
| B-US-4.3 | Продажа предметов | [b-us-4.3.md](../user-stories/b-us-4.3.md) |

### Use Cases

| Код | Название | Файл |
|-----|----------|------|
| B-UC-4.1 | Продажа предмета из инвентаря | [b-uc-4.1.md](../use-cases/b-uc-4.1.md) |
| B-UC-4.2 | Получение баланса и транзакций | [b-uc-4.2.md](../use-cases/b-uc-4.2.md) |

### Все задачи эпика

| Код | Название | User Story |
|-----|----------|------------|
| TASK-B4.1.01 | Реализовать модель Balance (Rust: user_id, wallet: {balances: {CHC: f64}}) | B-US-4.1 |
| TASK-B4.1.02 | Реализовать GET /balance/{user_id} (Payment Service) | B-US-4.1 |
| TASK-B4.1.03 | Реализовать модель Transaction (Rust: id, amount, currency, status, from, to, timestamp, description) | B-US-4.1 |
| TASK-B4.1.04 | Реализовать POST /transaction/{user_id} с проверкой баланса и атомарным обновлением | B-US-4.1 |
| TASK-B4.1.05 | Реализовать GET /transaction/{user_id} (история транзакций) | B-US-4.1 |
| TASK-B4.2.01 | Создать модель Inventory (Beanie Document): user_id, items (список InventoryEntry) | B-US-4.2 |
| TASK-B4.2.02 | Реализовать эндпоинт GET /inventory/ (инвентарь текущего пользователя) | B-US-4.2 |
| TASK-B4.2.03 | Реализовать эндпоинт GET /inventory/user/{user_id} (инвентарь любого пользователя) | B-US-4.2 |
| TASK-B4.3.01 | Реализовать эндпоинт POST /inventory/sell/{entry_id} (продажа одного предмета: удаление из инвентаря + транзакция system→user) | B-US-4.3 |
| TASK-B4.3.02 | Реализовать эндпоинт POST /inventory/sell-all (продажа всех предметов с суммарной транзакцией) | B-US-4.3 |
