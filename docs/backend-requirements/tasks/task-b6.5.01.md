# TASK-B6.5.01

**Название:** Настроить Prometheus (prometheus.yml, scrape targets, Docker volume)  
**Эпик:** [Epic B6: Инфраструктура](../epics/epic-b06-infra.md)  
**User Story:** [B-US-6.5: Мониторинг и сбор логов](../user-stories/b-us-6.5.md)  
**Статус:** Выполнена  
**Исполнитель:** Владимир Таран

## Описание

Развернуть Prometheus в `docker-compose.yml` и настроить конфигурационный файл для сбора метрик с бэкенд-сервисов.

## Детали реализации

- Образ: `prom/prometheus:v3.2.1`, контейнер `prometheus-ch`, порт `9090:9090`
- Конфиг монтируется: `./infra/prometheus/prometheus.yml:/etc/prometheus/prometheus.yml:ro`
- Данные хранятся в volume `prometheus_data:/prometheus`
- `prometheus.yml`:
  - `scrape_interval: 5s`, `evaluation_interval: 5s`
  - scrape jobs: `authservice:8000`, `casesservice:8000`, `paymentservice:8000`, `prometheus:9090` (все на path `/metrics`)
- `depends_on`: authservice, casesservice, paymentservice
- Сеть: `casehub_backend`

## Критерии приёмки

1. Prometheus стартует без ошибок
2. Все 4 targets переходят в состояние `UP` в UI (`http://localhost:9090/targets`)
3. Метрики доступны через PromQL-запросы в Grafana
