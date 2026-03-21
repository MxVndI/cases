# B-US-4.2: Управление инвентарём

**Эпик:** [Epic B4: Инвентарь и баланс](../epics/epic-b04-inventory.md)  
**Роль:** Пользователь / Гость

## User Story

Как пользователь, я хочу видеть свой инвентарь выигранных предметов, а как гость — просматривать инвентарь других пользователей.

## Описание

Инвентарь реализован в **Cases Service** (Python/FastAPI) через роутер `/inventory/`.

**Модель данных (Beanie Document, MongoDB):**

- `Inventory` — документ-контейнер:
    - `id: UUID` — идентификатор инвентаря
    - `user_id: UUID` — владелец
    - `items: list[InventoryItem]` — список записей предметов
    - `created_at: datetime`, `last_updated: datetime`
- `InventoryItem` (вложенная BaseModel):
    - `id: UUID` — уникальный идентификатор записи (entry_id)
    - `item_id: UUID` — ссылка на предмет из каталога Item
    - `obtained_at: datetime` — дата получения

**Реализованные эндпоинты:**

| Метод | Путь | Описание | Авторизация |
|-------|------|----------|-------------|
| GET | `/inventory/` | Инвентарь текущего пользователя | Cookie `sid` → Auth Service |
| GET | `/inventory/user/{user_id}` | Инвентарь любого пользователя по UUID | Публичный |

**Логика:**

- `GET /inventory/` — извлекает `sid` из cookie, верифицирует через Auth Service (`get_uid`), возвращает `Inventory` или `{"items": []}` если инвентарь пуст
- `GET /inventory/user/{user_id}` — публичный доступ, возвращает инвентарь по `user_id`
- При отсутствии авторизации на `/inventory/` возвращается `401`

## Критерии приёмки

- `GET /inventory/` возвращает инвентарь авторизованного пользователя с полным списком `items`
- `GET /inventory/` без cookie `sid` возвращает `401`
- `GET /inventory/user/{user_id}` возвращает инвентарь указанного пользователя без авторизации
- Пустой инвентарь возвращает `{"items": []}`

## Задачи

| Код | Название |
|-----|----------|
| [TASK-B4.2.01](../tasks/task-b4.2.01.md) | Модель Inventory (Beanie Document) с вложенным списком InventoryItem |
| [TASK-B4.2.02](../tasks/task-b4.2.02.md) | Эндпоинт GET /inventory/ — инвентарь текущего пользователя (cookie auth) |
| [TASK-B4.2.03](../tasks/task-b4.2.03.md) | Эндпоинт GET /inventory/user/{user_id} — публичный просмотр инвентаря |
