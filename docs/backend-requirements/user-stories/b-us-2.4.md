# B-US-2.4: Публичные профили и управление статусами

**Эпик:** [Epic B2: Управление пользователями](../epics/epic-b02-user.md)

**Как** сервис или пользователь,  
**я хочу** получать публичные профили по никнейму, список пользователей с фильтрами и управлять статусами,  
**чтобы** обеспечить работу публичных профилей и административного управления.

## Критерии приёмки

- [ ] `GET /v1/users/public/{nickname}` возвращает публичный профиль (id, nickname, role, status) без email
- [ ] `GET /v1/users/` возвращает список пользователей с фильтрами (search, status, role, page, limit), защищён Bearer-токеном
- [ ] `GET /v1/users/{user_id}` возвращает полный профиль по ID, защищён Bearer-токеном
- [ ] `PATCH /v1/users/{user_id}/status` обновляет статус пользователя (active/blocked), защищён Bearer-токеном
- [ ] Реализован `UserService.get_user_by_nickname`

## Задачи

| Код | Название |
|-----|----------|
| TASK-B2.4.01 | Реализовать GET /v1/users/public/{nickname} |
| TASK-B2.4.02 | Реализовать GET /v1/users/ (список с фильтрами) |
| TASK-B2.4.03 | Реализовать GET /v1/users/{user_id} |
| TASK-B2.4.04 | Реализовать PATCH /v1/users/{user_id}/status |
| TASK-B2.4.05 | Реализовать UserService.get_user_by_nickname |
