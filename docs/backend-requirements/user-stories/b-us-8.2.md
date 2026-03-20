# B-US-8.2: Управление целевыми системами и маппингами

**Эпик:** [Epic B8: AML — Шлюз управляющих UI](../epics/epic-b08-aml.md)  
**Роль:** DevOps

## User Story

Как DevOps, я хочу регистрировать управляющие UI (TargetSystem) и назначать им права доступа (Mapping) для конкретных администраторов через защищённые внутренние API.

## Описание

**TargetSystem** — документ MongoDB, описывающий управляющий UI:
- `type`: `"mongo"` | `"redis"`
- `name`: человекочитаемое имя (напр. `"mongo-express"`)
- `endpoint`: внутренний URL (напр. `http://mongo-express:8081`)
- `auth_mode`: `"basic"` | `"form"` | `"none"`
- `login_path`: опциональный путь для form-based auth
- `disabled`: мягкое удаление

**Mapping** — документ MongoDB, связывающий `admin_id` → `target_id` + `credentials_id`. Определяет, к каким таргетам имеет доступ конкретный администратор.

Управление производится через **внутренние эндпоинты** (Bearer-токен из `allowed_tokens`):
- `POST /internal/access/targets` — создать TargetSystem
- `POST /internal/access/mappings` — создать Mapping (с проверкой существования и активности target)

Публичный (для admin-сессии):
- `GET /aml/targets` — список активных таргетов текущего администратора

## Критерии приёмки

- `POST /internal/access/targets` создаёт TargetSystem, возвращает `{id: UUID}`
- `POST /internal/access/mappings` создаёт Mapping; если target не существует или disabled → 404
- `GET /aml/targets` возвращает только активные таргеты текущего admin (фильтр по маппингам)
- Внутренние эндпоинты защищены `require_internal_token` (Bearer из `allowed_tokens`)
- Мягкое удаление через флаг `disabled` (не удаляет из БД)

## Задачи

| Код | Название |
|-----|----------|
| [TASK-B8.2.01](../tasks/task-b8.2.01.md) | Реализовать эндпоинты управления таргетами (`POST /internal/access/targets`) |
| [TASK-B8.2.02](../tasks/task-b8.2.02.md) | Реализовать эндпоинты управления маппингами (`POST /internal/access/mappings`) |
| [TASK-B8.2.03](../tasks/task-b8.2.03.md) | Реализовать список таргетов для администратора (`GET /aml/targets`) |
