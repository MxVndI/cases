# Epic B5: Администрирование (BFF)

**Описание:** Admin Service — Backend for Frontend для админ-панели. Аутентификация администратора через cookie-сессию: dependency `require_admin` извлекает `sid` из cookie, верифицирует сессию через Auth Service (`/verify_user/{ssid}`), затем проверяет роль пользователя через User Service. Все эндпоинты проксируют запросы к Cases Service (с межсервисным токеном) и User Service (с Bearer-токеном). Включает полный CRUD для кейсов, предметов, редкостей, тегов, оружия, типов оружия, управление пользователями (список, блокировка/разблокировка, создание), загрузку изображений в S3-хранилище (RustFS). Dishka DI для внедрения сервисов.

**Роли:** Администратор  
**Связанные маршруты:** /api/admin/*  
**Зависимости:** Epic B1: Auth — верификация сессии; Epic B2: User — проверка роли, управление пользователями; Epic B3: Cases — CRUD кейсов/предметов/справочников

---

### User Stories

| Код | Название | Файл |
|-----|----------|------|
| B-US-5.1 | Просмотр пользователей (admin) | [b-us-5.1.md](../user-stories/b-us-5.1.md) |
| B-US-5.2 | Блокировка и разблокировка (admin) | [b-us-5.2.md](../user-stories/b-us-5.2.md) |
| B-US-5.3 | Cookie-аутентификация администратора | [b-us-5.3.md](../user-stories/b-us-5.3.md) |
| B-US-5.4 | Проксирование CRUD и загрузка файлов | [b-us-5.4.md](../user-stories/b-us-5.4.md) |

### Use Cases

| Код | Название | Файл |
|-----|----------|------|
| B-UC-5.1 | Управление пользователями (admin BFF) | [b-uc-5.1.md](../use-cases/b-uc-5.1.md) |
| B-UC-5.2 | Проксирование CRUD и загрузка изображений | [b-uc-5.2.md](../use-cases/b-uc-5.2.md) |

### Все задачи эпика

| Код | Название | User Story |
|-----|----------|------------|
| TASK-B5.1.01 | Реализовать эндпоинт GET /admin/users/ с фильтрами (search, status, role, page, limit) | B-US-5.1 |
| TASK-B5.1.02 | Реализовать проксирование к User Service с Bearer-токеном | B-US-5.1 |
| TASK-B5.1.03 | Реализовать эндпоинт POST /admin/users/ (создание пользователя) | B-US-5.1 |
| TASK-B5.2.01 | Реализовать эндпоинт POST /admin/users/{user_id}/block | B-US-5.2 |
| TASK-B5.2.02 | Реализовать эндпоинт POST /admin/users/{user_id}/unblock | B-US-5.2 |
| TASK-B5.3.01 | Реализовать dependency require_admin (cookie sid → Auth verify → User role check) | B-US-5.3 |
| TASK-B5.3.02 | Реализовать AdminAuth.get_admin_user_id (HTTP к Auth и User сервисам) | B-US-5.3 |
| TASK-B5.3.03 | Реализовать эндпоинт GET /admin/auth/me (проверка admin-сессии) | B-US-5.3 |
| TASK-B5.3.04 | Возвращать 401/403 для неавторизованных/не-администраторов | B-US-5.3 |
| TASK-B5.4.01 | Реализовать проксирование CRUD кейсов к Cases Service (/admin/cases/*) | B-US-5.4 |
| TASK-B5.4.02 | Реализовать проксирование CRUD предметов к Cases Service (/admin/items/*) | B-US-5.4 |
| TASK-B5.4.03 | Реализовать проксирование CRUD редкостей/тегов/оружия/типов оружия | B-US-5.4 |
| TASK-B5.4.04 | Реализовать эндпоинт POST /admin/upload/image (загрузка в RustFS/S3, ограничение 5 МБ, типы: png/jpeg/webp/gif) | B-US-5.4 |
| TASK-B5.4.05 | Реализовать StorageService (boto3, S3-совместимый клиент) | B-US-5.4 |
