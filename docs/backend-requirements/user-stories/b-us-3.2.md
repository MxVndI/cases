# B-US-3.2: CRUD предметов

**Эпик:** [Epic B3: Управление кейсами](../epics/epic-b03-cases.md)  
**Роль:** Администратор / Гость

## User Story

Как администратор, я хочу создавать, редактировать и удалять предметы, а как гость — просматривать каталог предметов, чтобы система могла управлять содержимым кейсов.

## Описание

Cases Service (Python/FastAPI) предоставляет полный CRUD для сущности **Item** через роутер `/items/`.

Модель `Item` (Beanie Document, MongoDB):

- `id: UUID` — уникальный идентификатор
- `img_url: str | None` — ссылка на изображение
- `price: float` — цена в CHC
- `name: str` — название предмета
- `weapon: Weapon` (name, type) — вложенная модель оружия
- `rarity: Rarity` (name, color) — вложенная модель редкости
- `created_at: datetime` — дата создания

Реализованные эндпоинты:

| Метод | Путь | Описание | Авторизация |
|-------|------|----------|-------------|
| GET | `/items/` | Список всех предметов | Публичный |
| GET | `/items/{id}` | Предмет по UUID | Публичный |
| POST | `/items/` | Создание предмета | Bearer-токен (`LocalAuth`) |
| PATCH | `/items/` | Обновление предмета | Bearer-токен (`LocalAuth`) |
| DELETE | `/items/{id}` | Удаление предмета | Bearer-токен (`LocalAuth`) |

Мутирующие операции (POST, PATCH, DELETE) защищены проверкой сервисного токена через `LocalAuth.verify_token()`. При невалидном токене возвращается `403 Forbidden`.

## Критерии приёмки

- GET `/items/` возвращает `list[ItemResponse]` со всеми полями модели
- GET `/items/{id}` возвращает `ItemResponse` или `404`
- POST `/items/` принимает `CreateItem`, возвращает UUID созданного предмета
- PATCH `/items/` принимает `UpdateItem`, возвращает UUID обновлённого предмета
- DELETE `/items/{id}` удаляет предмет; требует query-параметр `token`
- Все мутации отклоняются с `403` без валидного токена

## Задачи

| Код | Название |
|-----|----------|
| [TASK-B3.2.01](../tasks/task-b3.2.01.md) | Модель Item (Beanie Document): id, img_url, price, name, weapon, rarity, created_at |
| [TASK-B3.2.02](../tasks/task-b3.2.02.md) | Эндпоинт GET /items/ — список всех предметов |
| [TASK-B3.2.03](../tasks/task-b3.2.03.md) | Эндпоинт GET /items/{id} — предмет по UUID |
| [TASK-B3.2.04](../tasks/task-b3.2.04.md) | Эндпоинт POST /items/ — создание предмета (с LocalAuth) |
| [TASK-B3.2.05](../tasks/task-b3.2.05.md) | Эндпоинт PATCH /items/ — обновление предмета (с LocalAuth) |
| [TASK-B3.2.06](../tasks/task-b3.2.06.md) | Эндпоинт DELETE /items/{id} — удаление предмета (с LocalAuth) |
