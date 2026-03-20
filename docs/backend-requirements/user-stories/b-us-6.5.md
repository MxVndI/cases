# B-US-6.5: Мониторинг и сбор логов (Prometheus + Grafana + Loki)

**Эпик:** [Epic B6: Инфраструктура](../epics/epic-b06-infra.md)  
**Роль:** DevOps

## User Story

Как DevOps, я хочу собирать метрики и логи всех сервисов в единый стек мониторинга, чтобы оперативно отслеживать состояние системы и диагностировать инциденты.

## Описание

Стек мониторинга состоит из четырёх контейнеров, поднимаемых в `docker-compose.yml`:

- **Prometheus** (`prom/prometheus:v3.2.1`, порт 9090) — scrape метрик с `/metrics` эндпоинтов сервисов. Конфигурация: `infra/prometheus/prometheus.yml`. Scrape targets: `authservice:8000`, `casesservice:8000`, `paymentservice:8000`, сам `prometheus:9090`. Интервал опроса: 5 секунд.
- **Loki** (`grafana/loki:3.0.0`, порт 3100) — агрегация и хранение логов. Конфигурация: `infra/loki/loki-config.yml`. Хранение: TSDB (schema v13), retention 7 дней. Данные в Docker volume `loki_data`.
- **Promtail** (`grafana/promtail:3.0.0`) — агент сбора логов из Docker-контейнеров через Docker Service Discovery (`docker_sd_configs`). Конфигурация: `infra/promtail/promtail-config.yml`. Автоматически обнаруживает все контейнеры в сети `casehub_backend`, добавляет лейблы `job`, `service`, `container` и нормализует уровни логирования (`DEBUG`, `INFO`, `WARN`, `ERROR`). Пушит в `loki-ch:3100`.
- **Grafana** (`grafana/grafana:11.4.0`, порт 3000) — визуализация. Источники данных прописаны через provisioning: Prometheus (`datasource.yml`) и Loki (`loki.yml`). Dashboard `casehub-overview.json` поставляется через `infra/grafana/dashboards/`.

## Критерии приёмки

- Prometheus поднимается и успешно скрейпит метрики с authservice, casesservice, paymentservice
- Loki принимает логи от Promtail и хранит их 7 дней (retention 168h)
- Promtail автоматически обнаруживает Docker-контейнеры в сети `casehub_backend` и парсит лог-уровни
- Grafana доступна на порту 3000; оба datasource (Prometheus, Loki) подключены автоматически через provisioning
- Dashboard `casehub-overview` загружается автоматически при старте Grafana
- Все четыре контейнера входят в `docker-compose.yml` и сеть `casehub_backend`

## Задачи

| Код | Название |
|-----|----------|
| [TASK-B6.5.01](../tasks/task-b6.5.01.md) | Настроить Prometheus (prometheus.yml, scrape targets, Docker volume) |
| [TASK-B6.5.02](../tasks/task-b6.5.02.md) | Настроить Loki (loki-config.yml, TSDB schema v13, retention 7 дней) |
| [TASK-B6.5.03](../tasks/task-b6.5.03.md) | Настроить Promtail (Docker SD, relabeling, pipeline stages для log-level) |
| [TASK-B6.5.04](../tasks/task-b6.5.04.md) | Настроить Grafana с provisioning datasources (Prometheus + Loki) |
| [TASK-B6.5.05](../tasks/task-b6.5.05.md) | Создать и подключить dashboard casehub-overview.json |
