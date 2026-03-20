# B-UC-3.1: Получение списка кейсов

**Эпик:** [Epic B3: Управление кейсами](../epics/epic-b03-cases.md)

## Описание

Получение кейсов через Cases Service API. Поддерживаются несколько эндпоинтов для получения кейсов. Cases Service использует Beanie/MongoDB.

## Акторы

- **Первичный:** Пользователь / Гость
- **Система:** Cases Service

## Предусловия

- Cases Service доступен
- В MongoDB существуют кейсы

## Модель кейса (Case, Beanie Document)

| Поле | Тип | Описание |
|-------|------|----------|
| `id` | UUID | Уникальный идентификатор |
| `name` | string | Название кейса |
| `system_name` | string | URL-совместимое имя (транслитерация, unique) |
| `price` | float | Цена в CHC (CaseHubCoin) |
| `img_url` | string? | URL изображения |
| `case_content` | list[CaseContent] | Предметы с вероятностями (`item_id`, `drop_chance`) |
| `tag` | string? | Тег кейса (должен существовать в Tag collection) |
| `status` | string | `active` / `disabled` |
| `created_at` | datetime | Дата создания |

## Основной сценарий — Список кейсов

1. Фронтенд отправляет `GET /cases/`
2. Cases Service загружает все кейсы из MongoDB
3. Кейсы со статусом `disabled` скрываются (если запрос не от админа/токена)
4. Для каждого кейса загружаются данные предметов из `case_content`
5. Возвращается `list[CaseResponse]`

## Дополнительные эндпоинты

- `GET /cases/{id}` — получение кейса по UUID
- `GET /cases/by-name/{name}` — получение кейса по названию
- `GET /cases/by-system-name/{system_name}` — получение кейса по system_name

Доступ к `disabled`-кейсам определяется через `_can_access_disabled_cases`: проверяется либо Bearer-токен (межсервисный), либо cookie `sid` с ролью admin.

## Постусловия

- Клиент получает JSON-список кейсов с предметами и вероятностями

## Альтернативные сценарии

1. **Кейс не найден** (по id/name/system_name) → 404
2. **Кейс со статусом disabled** и пользователь не админ → 404
3. **MongoDB недоступен** → 500

## Связанные User Stories

- [B-US-3.1](../user-stories/b-us-3.1.md)

---

> 📊 **Диаграмма последовательности:** [sequences.md → B-UC-3.1](sequences.md)
