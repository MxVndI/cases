# B-UC-4.2: Получение баланса и транзакций

**Эпик:** [Epic B4: Инвентарь и баланс](../epics/epic-b04-inventory.md)

## Акторы
- Пользователь / Сервис

## Предусловия
- user_id известен

## Основной сценарий: Получение баланса

1. Клиент отправляет `GET /balance/{user_id}` (Payment Service)
2. Система ищет документ Balance в MongoDB по user_id
3. Система возвращает `{wallet: {balances: {CHC: <amount>}}}`
4. Если баланс не найден, возвращает пустой wallet `{wallet: {balances: {}}}`

## Альтернативный сценарий: История транзакций

1. Клиент отправляет `GET /transaction/{user_id}` (Payment Service)
2. Система ищет все транзакции, где `from == user_id` или `to == user_id`
3. Система возвращает список транзакций: id, amount, currency, status, from, to, timestamp, description

## Постусловия
- Клиент получает текущий баланс и/или историю транзакций в валюте CHC

---

> 📊 **Диаграмма последовательности:** [sequences.md → B-UC-4.2](sequences.md)
