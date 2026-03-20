# TASK-B6.5.05

**Название:** Создать и подключить dashboard casehub-overview.json  
**Эпик:** [Epic B6: Инфраструктура](../epics/epic-b06-infra.md)  
**User Story:** [B-US-6.5: Мониторинг и сбор логов](../user-stories/b-us-6.5.md)  
**Статус:** Выполнена  
**Исполнитель:** Владимир Таран

## Описание

Создать Grafana-дашборд с обзорными панелями для всего проекта CaseHub и подключить его через file provisioning.

## Детали реализации

- Файл: `infra/grafana/dashboards/casehub-overview.json`
- Загружается автоматически через provisioning provider `default` (путь `/var/lib/grafana/dashboards`)
- Дашборд использует оба datasource:
  - **Prometheus** (`uid: prometheus`) — метрики сервисов (HTTP request rate, latency, up/down)
  - **Loki** (`uid: loki`) — логи контейнеров с фильтрацией по `service`, `level`
- Монтирование в docker-compose: `./infra/grafana/dashboards:/var/lib/grafana/dashboards`

## Критерии приёмки

1. Dashboard `casehub-overview` появляется в Grafana автоматически после старта
2. Панели с метриками Prometheus отображают данные с трёх сервисов
3. Панели с логами Loki фильтруют по лейблам `service` и `level`
4. Dashboard не требует ручного импорта
