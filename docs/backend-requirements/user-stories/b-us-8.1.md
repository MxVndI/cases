# B-US-8.1: Проксированный доступ к управляющим UI

**Эпик:** [Epic B8: AML — Шлюз управляющих UI](../epics/epic-b08-aml.md)  
**Роль:** Администратор

## User Story

Как администратор, я хочу открывать mongo-express и redis-commander через единый защищённый интерфейс, не зная их реальных учётных данных и не подвергая их прямой сети.

## Описание

AML предоставляет два слоя:

**HTML UI (`GET /aml`)** — страница со списком доступных таргетов (TargetSystem) для текущего администратора. При первом входе, если маппинги ещё не созданы, выполняется авто-bootstrap из переменных окружения. Каждый таргет отображается в виде карточки с кликабельной ссылкой на `/aml/proxy/{target_id}/`.

**Прокси (`/aml/proxy/{target_id}/{path:path}`)** — принимает любые HTTP-методы, проверяет sid-cookie через Auth Service, проверяет наличие маппинга admin_id→target_id, расшифровывает credentials, управляет upstream-сессиями (cookies от mongo-express/redis-commander хранятся в Redis с TTL 1 час), прозрачно проксирует запрос к целевому сервису и возвращает ответ.

**Аудит** — каждое обращение к UI и прокси фиксируется в `AuditEvent` (MongoDB `aml_db`).

**Upstream Session Store** — Redis-ключ `aml:upstream:{admin_id}:{target_id}` хранит JSON с cookies upstream-сессии.

## Критерии приёмки

- `GET /aml` возвращает HTML-страницу с карточками таргетов для аутентифицированного администратора
- При отсутствии маппингов выполняется авто-bootstrap
- `/aml/proxy/{target_id}/{path}` проксирует GET/POST/PUT/PATCH/DELETE/OPTIONS к целевому сервису
- Hop-by-hop заголовки и `Host` фильтруются перед проксированием
- Upstream cookies сохраняются в Redis (TTL 3600 сек) и подставляются в последующие запросы
- Каждый запрос к UI и прокси создаёт `AuditEvent` в `aml_db`
- При отсутствии sid-cookie → 401; при отсутствии маппинга → 403

## Задачи

| Код | Название |
|-----|----------|
| [TASK-B8.1.01](../tasks/task-b8.1.01.md) | Настроить Dockerfile и docker-compose для AML Service |
| [TASK-B8.1.02](../tasks/task-b8.1.02.md) | Реализовать HTML UI (`GET /aml`) со списком таргетов и авто-bootstrap |
| [TASK-B8.1.03](../tasks/task-b8.1.03.md) | Реализовать прокси-эндпоинт (`/aml/proxy/{target_id}/{path}`) с upstream session store |
| [TASK-B8.1.04](../tasks/task-b8.1.04.md) | Реализовать аудит-лог (AuditEvent, AuditService) |
