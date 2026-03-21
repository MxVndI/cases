# B-UC-4.1: Инвентарь и баланс

**Эпик:** [Epic B4: Инвентарь и баланс](../epics/epic-b04-inventory.md)

## Описание

Управление инвентарём и балансом пользователя. Инвентарь полностью реализован в Cases Service. Баланс и транзакции — в Payment Service (Rust/Axum). Валюта — CHC (CaseHubCoin).

## Акторы

- **Первичный:** Пользователь
- **Система:** Cases Service (Inventory), Payment Service

## Предусловия

- Пользователь авторизован (cookie `sid`)
- Пользователь не заблокирован

## Эндпоинты инвентаря (Cases Service, prefix `/inventory`)

| Эндпоинт | Описание |
|----------|----------|
| `GET /inventory/` | Получить инвентарь текущего пользователя (cookie auth) |
| `GET /inventory/user/{user_id}` | Получить инвентарь по user_id |
| `POST /inventory/sell/{entry_id}` | Продать один предмет |
| `POST /inventory/sell-all` | Продать все предметы |

## Эндпоинты баланса (Payment Service, Rust/Axum)

| Эндпоинт | Описание |
|----------|----------|
| `GET /balance/{user_id}` | Получить баланс в CHC |
| `POST /transaction/{user_id}` | Создать транзакцию (from_id, to_id, amount, description) |

## Основной сценарий — Продажа предмета

1. Фронтенд отправляет `POST /inventory/sell/{entry_id}` с cookie `sid`
2. Cases Service аутентифицирует пользователя через Auth Service (`GET /verify_user/{sid}`)
3. Проверяется статус пользователя (если `blocked` → 403)
4. InventoryService удаляет предмет по `entry_id` из инвентаря
5. ItemService получает цену предмета
6. PaymentService создаёт транзакцию `system → user` на сумму цены предмета (CHC)
7. Возвращается `{sold_price, item_id}`

## Дополнительный сценарий — Продажа всех предметов

1. Фронтенд отправляет `POST /inventory/sell-all` с cookie `sid`
2. Аутентификация + проверка статуса
3. InventoryService удаляет все предметы из инвентаря
4. Для каждого предмета создаётся транзакция `system → user`
5. Возвращается `{sold_count, total_price}`

## Обработка ошибок при продаже

- Если Payment Service возвращает ошибку — предмет возвращается в инвентарь (rollback)
- `SYSTEM_UUID = UUID(int=0)` — системный аккаунт для транзакций

## Постусловия

- Предмет(ы) удален(ы) из инвентаря
- Баланс пользователя увеличен на сумму продажи (CHC)

## Альтернативные сценарии

1. **Предмет не найден в инвентаре** → 404
2. **Предмет не найден в каталоге** → 404
3. **Ошибка Payment Service** → 500 + rollback инвентаря
4. **Пользователь заблокирован** → 403
5. **Невалидная сессия** → 401
6. **Пустой инвентарь** (sell-all) → `{sold_count: 0, total_price: 0}`

## Связанные User Stories

- [B-US-4.3](../user-stories/b-us-4.3.md)
