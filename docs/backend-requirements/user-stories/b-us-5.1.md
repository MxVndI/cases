# B-US-5.1: Управление кейсами (админ)

**Эпик:** [Epic B5: Администрирование (API)](../epics/epic-b05-admin.md)  
**Роль:** Администратор

## User Story

Как администратор, я хочу управлять кейсами, предметами, редкостями, тегами, оружием и загружать изображения через Admin Service.

## Описание

Admin Service (Python/FastAPI BFF, порт 8012) проксирует запросы к Cases Service с inter-service токеном. Авторизация администратора: cookie `sid` → Auth Service /verify_user → User Service проверка role=admin (`require_admin`).

CRUD для сущностей: **cases**, **items**, **rarities**, **tags**, **weapons**, **weapon_types**. Загрузка изображений: `POST /upload/image` → S3/RustFS (лимит 5 МБ, форматы: png, jpeg, webp, gif). Все мутации защищены `require_admin` auth.

## Критерии приёмки

- Admin BFF проксирует CRUD запросы к Cases Service с inter-service токеном
- CRUD для cases, items, rarities, tags, weapons, weapon_types
- POST /upload/image загружает в S3/RustFS (5 МБ лимит, png/jpeg/webp/gif)
- Авторизация: cookie sid → Auth verify → User role check (require_admin)
- Все мутации требуют роль admin
- Admin Service работает на порту 8012

## Задачи

| Код | Название |
|-----|----------|
| [TASK-B5.1.01](../tasks/task-b5.1.01.md) | Настроить Admin Service BFF (FastAPI, порт 8012) с require_admin auth |
| [TASK-B5.1.02](../tasks/task-b5.1.02.md) | Реализовать проксирование CRUD кейсов к Cases Service |
| [TASK-B5.1.03](../tasks/task-b5.1.03.md) | Реализовать проксирование CRUD items, rarities, tags, weapons, weapon_types |
| [TASK-B5.1.04](../tasks/task-b5.1.04.md) | Реализовать POST /upload/image (S3/RustFS, 5 МБ, png/jpeg/webp/gif) |
| [TASK-B5.1.05](../tasks/task-b5.1.05.md) | Реализовать cookie auth: sid → Auth /verify_user → User role=admin |
