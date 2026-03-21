# B-US-4.3: Продажа предметов из инвентаря

**Эпик:** [Epic B4: Инвентарь и баланс](../epics/epic-b04-inventory.md)  
**Роль:** Пользователь

## User Story

Как пользователь, я хочу продавать предметы из инвентаря за CHC — по одному или все сразу.

## Описание

Продажа реализована в **Cases Service** (Python/FastAPI) через роутер `/inventory/`. При продаже создаётся транзакция `system → user` через **Payment Service**.

**Системный UUID:** `UUID(int=0)` (00000000-0000-0000-0000-000000000000) — источник средств при продаже.

**Реализованные эндпоинты:**

| Метод | Путь | Описание | Авторизация |
|-------|------|----------|-------------|
| POST | `/inventory/sell/{entry_id}` | Продать один предмет по entry_id | Cookie `sid` → Auth Service |
| POST | `/inventory/sell-all` | Продать все предметы из инвентаря | Cookie `sid` → Auth Service |

**Логика продажи одного предмета (`POST /inventory/sell/{entry_id}`):**

1. Авторизация по cookie `sid` → Auth Service (`get_uid`)
2. Проверка статуса пользователя через User Service (блокировка → `403`)
3. Удаление записи из инвентаря по `entry_id` (`InventoryService.remove_item`)
4. Получение цены предмета из каталога Item (`ItemService.get_by_id`)
5. Создание транзакции `system → user` через Payment Service (`PaymentService.create_transaction`)
6. При ошибке оплаты — rollback: предмет возвращается в инвентарь
7. Возвращает `{ sold_price: float, item_id: str }`

**Логика массовой продажи (`POST /inventory/sell-all`):**

1. Авторизация и проверка блокировки — аналогично
2. Удаление всех записей из инвентаря (`InventoryService.remove_all`)
3. Для каждого предмета — получение цены и создание транзакции
4. Возвращает `{ sold_count: int, total_price: float }`

## Критерии приёмки

- `POST /inventory/sell/{entry_id}` удаляет предмет из инвентаря и начисляет `item.price` CHC на баланс
- При ошибке Payment Service предмет возвращается в инвентарь (rollback)
- Заблокированный пользователь получает `403`
- `POST /inventory/sell-all` продаёт все предметы, возвращает суммарную стоимость
- Без авторизации (cookie `sid`) — `401`
- Несуществующий `entry_id` — `404`

## Задачи

| Код | Название |
|-----|----------|
| [TASK-B4.3.01](../tasks/task-b4.3.01.md) | Эндпоинт POST /inventory/sell/{entry_id} — продажа одного предмета с rollback |
| [TASK-B4.3.02](../tasks/task-b4.3.02.md) | Эндпоинт POST /inventory/sell-all — массовая продажа всех предметов |
| [TASK-B4.3.03](../tasks/task-b4.3.03.md) | Интеграция с Payment Service: транзакция system→user при продаже |
