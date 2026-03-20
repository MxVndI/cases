# Epic B8: AML — Шлюз управляющих UI

**Описание:** AML (Admin Management Layer) — внутренний микросервис (Python/FastAPI, порт 8000, контейнер `aml.api-ch`), предоставляющий администраторам защищённый проксированный доступ к управляющим UI: mongo-express и redis-commander. Сервис аутентифицирует администратора через Auth Service (`/verify_user/{sid}`), хранит учётные данные в зашифрованном виде (envelope encryption: AES-256-GCM, KEK из env), проксирует HTTP-запросы к целевым системам, поддерживает upstream-сессии в Redis (TTL 1 час), ведёт аудит-лог в MongoDB (`aml_db`). Целевые системы (`TargetSystem`) и маппинги доступа (`Mapping`) управляются через защищённые внутренние эндпоинты (Bearer-токен). При первом входе администратора выполняется авто-bootstrap маппингов из переменных окружения. UI отображается как HTML-страница со ссылками на таргеты. Dishka используется для DI.

**Роли:** DevOps, Администратор  
**Связанные маршруты:** `/aml/*`, `/internal/access/*`, `/internal/secret/*`  
**Зависимости:** Epic B1 (Auth Service для верификации сессий), Epic B6 (MongoDB `aml_db`, Redis, Docker)

---

### User Stories

| Код | Название | Файл |
|-----|----------|------|
| B-US-8.1 | Проксированный доступ к управляющим UI | [b-us-8.1.md](../user-stories/b-us-8.1.md) |
| B-US-8.2 | Управление целевыми системами и маппингами | [b-us-8.2.md](../user-stories/b-us-8.2.md) |
| B-US-8.3 | Безопасное хранение учётных данных (envelope encryption) | [b-us-8.3.md](../user-stories/b-us-8.3.md) |

### Use Cases

| Код | Название | Файл |
|-----|----------|------|
| B-UC-8.1 | Доступ администратора к управляющему UI через AML | [b-uc-8.1.md](../use-cases/b-uc-8.1.md) |
| B-UC-8.2 | Bootstrap маппингов при первом входе | [b-uc-8.2.md](../use-cases/b-uc-8.2.md) |

### Все задачи эпика

| Код | Название | User Story |
|-----|----------|------------|
| TASK-B8.1.01 | Настроить Dockerfile и docker-compose для AML Service | B-US-8.1 |
| TASK-B8.1.02 | Реализовать HTML UI (`GET /aml`) со списком таргетов и авто-bootstrap | B-US-8.1 |
| TASK-B8.1.03 | Реализовать прокси-эндпоинт (`/aml/proxy/{target_id}/{path}`) с upstream session store | B-US-8.1 |
| TASK-B8.1.04 | Реализовать аудит-лог (AuditEvent, AuditService) | B-US-8.1 |
| TASK-B8.2.01 | Реализовать эндпоинты управления таргетами (`POST /internal/access/targets`) | B-US-8.2 |
| TASK-B8.2.02 | Реализовать эндпоинты управления маппингами (`POST /internal/access/mappings`) | B-US-8.2 |
| TASK-B8.2.03 | Реализовать список таргетов для администратора (`GET /aml/targets`) | B-US-8.2 |
| TASK-B8.3.01 | Реализовать envelope encryption/decryption (AES-256-GCM, KEK из env) | B-US-8.3 |
| TASK-B8.3.02 | Реализовать эндпоинты создания и расшифровки учётных данных (`/internal/secret/*`) | B-US-8.3 |
| TASK-B8.3.03 | Настроить модели Beanie: TargetSystem, Mapping, EncryptedBlob, AuditEvent | B-US-8.3 |
| TASK-B8.3.04 | Настроить Dishka DI-контейнер для AML Service (ioc.py) | B-US-8.3 |
