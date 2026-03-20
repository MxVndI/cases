# B-UC-6.2: Мониторинг сервисов через Grafana

**Эпик:** [Epic B6: Инфраструктура](../epics/epic-b06-infra.md)

## Описание

DevOps запускает стек мониторинга и получает единую точку наблюдения за метриками (Prometheus) и логами (Loki) всех сервисов через интерфейс Grafana.

## Акторы

- **Первичный:** DevOps
- **Система:** Prometheus, Loki, Promtail, Grafana

## Предусловия

- Все сервисы (`authservice`, `casesservice`, `paymentservice`) запущены в сети `casehub_backend`
- `docker-compose.yml` содержит секции `prometheus`, `loki`, `promtail`, `grafana`
- Конфигурационные файлы присутствуют: `infra/prometheus/prometheus.yml`, `infra/loki/loki-config.yml`, `infra/promtail/promtail-config.yml`, `infra/grafana/provisioning/`

## Основной сценарий

1. DevOps выполняет `docker compose up`
2. Prometheus стартует, читает `prometheus.yml`, начинает scrape `/metrics` у `authservice:8000`, `casesservice:8000`, `paymentservice:8000` с интервалом 5 секунд
3. Loki стартует, инициализирует хранилище TSDB schema v13 в volume `loki_data`, слушает порт 3100
4. Promtail стартует, подключается к Docker daemon через `/var/run/docker.sock`, обнаруживает все контейнеры сети `casehub_backend`, добавляет лейблы `job`, `service`, `container`, парсит уровни логирования и пушит логи в `loki-ch:3100/loki/api/v1/push`
5. Grafana стартует на порту 3000, автоматически подключает datasource Prometheus (`http://prometheus-ch:9090`) и Loki (`http://loki-ch:3100`) из provisioning YAML
6. Dashboard `casehub-overview.json` автоматически загружается из `/var/lib/grafana/dashboards`
7. DevOps открывает `http://localhost:3000`, видит метрики сервисов и логи в едином интерфейсе

## Постусловия

- Prometheus собирает метрики с трёх сервисов; данные доступны через Grafana (datasource Prometheus)
- Все логи контейнеров сети `casehub_backend` хранятся в Loki 7 дней; доступны через Grafana (datasource Loki)
- Dashboard `casehub-overview` отображается в Grafana без ручных настроек

## Альтернативные сценарии

1. **Сервис не отдаёт `/metrics`** → Prometheus помечает target как `DOWN`; Grafana отображает ошибку в datasource; остальные targets продолжают работу
2. **Promtail не может подключиться к Docker socket** → логи не собираются; Loki остаётся пустым; метрики Prometheus не затронуты
3. **Loki недоступен** → Promtail не может доставить логи (retry); Grafana показывает ошибку datasource Loki; Prometheus продолжает работу независимо
4. **Grafana не находит provisioning файлы** → datasources и dashboard не загружаются автоматически; требуется ручная конфигурация

## Связанные User Stories

- [B-US-6.5](../user-stories/b-us-6.5.md)

---

> 📊 **Диаграмма последовательности:** [sequences.md → B-UC-6.2](sequences.md)
