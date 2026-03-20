# B-UC-3.2: Открытие кейса пользователем

**Эпик:** [Epic B3: Управление кейсами](../epics/epic-b03-cases.md)

## Описание

Открытие кейса пользователем. Полностью реализовано: проверка баланса, взвешенный рандом, списание средств, инвентарь, история, SSE-лента. Валюта — CHC (CaseHubCoin).

## Акторы

- **Первичный:** Пользователь
- **Система:** Cases Service, Auth Service, Payment Service

## Предусловия

- Пользователь авторизован (cookie `sid`)
- Пользователь не заблокирован (`status != blocked`)
- Кейс существует и имеет предметы

## Эндпоинты

- `POST /cases/open/{id}` — открытие по UUID
- `POST /cases/open/by-name/{name}` — открытие по названию
- `POST /cases/open/by-system-name/{system_name}` — открытие по system_name

## Основной сценарий

1. Фронтенд отправляет `POST /cases/open/{id}` с cookie `sid`
2. Cases Service передаёт `sid` в Auth Service через HTTP (`GET /verify_user/{ssid}?token=...`)
3. Auth Service возвращает `{uid: "..."}`
4. Cases Service проверяет статус пользователя через User Service (если `blocked` → 403)
5. Cases Service загружает кейс из MongoDB
6. **Проверка баланса:** Payment Service `GET /balance/{user_id}` — баланс должен быть ≥ цены кейса (CHC)
7. **Взвешенный случайный выбор:** `random.choices(items, weights=drop_chances, k=1)`
8. **Списание средств:** Payment Service `POST /transaction/{user_id}` — транзакция `user → system` на сумму цены кейса
9. **Инвентарь:** InventoryService добавляет предмет в инвентарь пользователя
10. **История:** создаётся документ `WinHistory` в MongoDB (user_id, item_id, item_name, item_rarity, item_price, item_img_url, case_name, timestamp)
11. **Redis лента:** `LPUSH recent_wins` + `LTRIM 0 49` (последние 50 выигрышей)
12. **SSE:** `PUBLISH wins_channel` — публикация для подписчиков `/wins/stream`
13. Возвращается `OpenCaseResponse` (выигранный предмет + инвентарь)

## Постусловия

- Баланс пользователя уменьшен на цену кейса (CHC)
- Предмет добавлен в инвентарь
- Запись в WinHistory
- Лента последних выигрышей обновлена
- SSE-событие опубликовано

## Альтернативные сценарии

1. **Недостаточно средств** → 402 (Insufficient funds)
2. **Кейс не найден или пуст** → 404
3. **Кейс со статусом disabled** (и пользователь не admin) → 404
4. **Сессия невалидна** → 401
5. **Пользователь заблокирован** → 403
6. **Ошибка Payment Service** → 400 (Payment failed)

## Связанные User Stories

- [B-US-3.3](../user-stories/b-us-3.3.md)

---

> 📊 **Диаграмма последовательности:** [sequences.md → B-UC-3.2](sequences.md)
