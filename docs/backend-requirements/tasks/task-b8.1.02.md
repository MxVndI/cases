# TASK-B8.1.02

**Название:** Реализовать HTML UI (`GET /aml`) со списком таргетов и авто-bootstrap  
**Эпик:** [Epic B8: AML — Шлюз управляющих UI](../epics/epic-b08-aml.md)  
**User Story:** [B-US-8.1: Проксированный доступ к управляющим UI](../user-stories/b-us-8.1.md)  
**Статус:** Выполнена  
**Исполнитель:** Владимир Таран

## Описание

Реализовать `routes/ui.py` с HTML-страницей для администратора, отображающей доступные таргеты.

## Детали реализации

- `GET /aml` → `HTMLResponse`
- Аутентификация: sid-cookie → `AuthAdapter.get_admin_id_by_sid(sid)`
- Запрос активных маппингов для `admin_id` из MongoDB
- Если маппинги пусты — вызов `bootstrap_for_admin(admin_id, settings)`; при ошибке возвращает страницу с сообщением
- Получение `TargetSystem` по target_ids из маппингов (только `disabled=False`)
- Отрисовка карточек: ссылка `/aml/proxy/{target.id}/`, иконка и тип (mongo / redis)
- При отсутствии sid-cookie → 401

## Критерии приёмки

1. `GET /aml` без cookie → 401
2. `GET /aml` с валидным sid → HTML-страница с карточками таргетов
3. Если маппинги отсутствуют → выполняется авто-bootstrap → карточки отображаются
4. Карточки содержат ссылки на `/aml/proxy/{target_id}/`
