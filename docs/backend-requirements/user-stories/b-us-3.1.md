# B-US-3.1: CRUD кейсов

**Эпик:** [Epic B3: Управление кейсами](../epics/epic-b03-cases.md)  
**Роль:** Администратор / Пользователь

## User Story

Как администратор, я хочу создавать, редактировать и удалять кейсы через API. Как пользователь, я хочу просматривать доступные кейсы.

## Описание

Cases Service (Python/FastAPI, Beanie/MongoDB cases_db) предоставляет полный CRUD для кейсов. Публичные GET-эндпоинты доступны всем, мутации защищены inter-service токеном (вызываются через Admin Service BFF).

Модель **Case**: name, system_name, price (CHC), img_url, case_content (список предметов с drop_chance), tag, status (active/disabled).

Эндпоинты чтения: `GET /cases/` (список, опциональный фильтр по tag), `GET /cases/{id}`, `GET /cases/name/{name}`, `GET /cases/system-name/{system_name}`. Мутации: `POST /cases/` (token auth), `PATCH /cases/{id}` (token), `DELETE /cases/{id}` (token). Утилиты: `POST /cases/{case_id}/calculate_chances`, `POST /cases/{case_id}/calculate_price`.

## Критерии приёмки

- GET /cases/ возвращает список кейсов с опциональным фильтром по tag
- GET /cases/{id}, /cases/name/{name}, /cases/system-name/{system_name} — получение кейса
- POST /cases/ создаёт кейс (inter-service token auth)
- PATCH /cases/{id} обновляет кейс (inter-service token auth)
- DELETE /cases/{id} удаляет кейс (inter-service token auth)
- POST /cases/{case_id}/calculate_chances пересчитывает вероятности
- POST /cases/{case_id}/calculate_price пересчитывает цену
- Case модель: name, system_name, price CHC, img_url, case_content, tag, status
- Валюта — CHC (CaseHubCoin)

## Задачи

| Код | Название |
|-----|----------|
| [TASK-B3.1.01](../tasks/task-b3.1.01.md) | Создать модель Case (Beanie Document): name, system_name, price, img_url, case_content, tag, status |
| [TASK-B3.1.02](../tasks/task-b3.1.02.md) | Реализовать GET /cases/ (список, фильтр по tag) |
| [TASK-B3.1.03](../tasks/task-b3.1.03.md) | Реализовать GET /cases/{id}, /cases/name/{name}, /cases/system-name/{system_name} |
| [TASK-B3.1.04](../tasks/task-b3.1.04.md) | Реализовать POST /cases/ (inter-service token auth) |
| [TASK-B3.1.05](../tasks/task-b3.1.05.md) | Реализовать PATCH /cases/{id} (inter-service token auth) |
| [TASK-B3.1.06](../tasks/task-b3.1.06.md) | Реализовать DELETE /cases/{id} (inter-service token auth) |
| [TASK-B3.1.07](../tasks/task-b3.1.07.md) | Реализовать POST /cases/{case_id}/calculate_chances и calculate_price |
