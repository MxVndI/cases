mod api;
mod db;
mod shared;

#[allow(dead_code)]
use axum::{
    extract::MatchedPath,
    http::{Request, StatusCode},
    middleware::{self, Next},
    response::{IntoResponse, Response},
    routing::{get, post},
    Router,
};
use db::utils::get_db;
use mongodb::Client;
use once_cell::sync::Lazy;
use prometheus::{
    register_histogram_vec, register_int_counter_vec, Encoder, HistogramVec, IntCounterVec,
    TextEncoder,
};
use redis::aio::MultiplexedConnection;
use std::time::Instant;
use utoipa::OpenApi;
use utoipa_swagger_ui::SwaggerUi;

#[derive(Clone)]
struct AppState {
    client: Client,
    db: String,
    redis: MultiplexedConnection,
}

#[derive(OpenApi)]
#[openapi(
    paths(
        api::transactions::get_user_transactions,
        api::transactions::create,
        api::balance::get_balance,
        api::tap::tap,
    ),
    components(
        schemas(
            api::tap::TapRequest,
            api::tap::TapResponse,
            shared::schemas::Currency,
            shared::requests::CreateTransaction,
            db::models::Transaction,
            shared::responses::GetBalance,
        )
    ),
    tags(
        (name = "payment", description = "Payment service API"),
    ),
)]
struct ApiDoc;

// Общее количество HTTP-запросов
static HTTP_REQUESTS_TOTAL: Lazy<IntCounterVec> = Lazy::new(|| {
    register_int_counter_vec!(
        "http_requests_total",
        "Total number of HTTP requests",
        &["method", "path", "status"]
    )
    .expect("failed to register http_requests_total")
});

// Количество ошибочных HTTP-ответов
static HTTP_ERRORS_TOTAL: Lazy<IntCounterVec> = Lazy::new(|| {
    register_int_counter_vec!(
        "http_errors_total",
        "Total number of HTTP error responses",
        &["method", "path", "status"]
    )
    .expect("failed to register http_errors_total")
});

// Время обработки HTTP-запросов
static HTTP_REQUEST_DURATION_SECONDS: Lazy<HistogramVec> = Lazy::new(|| {
    register_histogram_vec!(
        "http_request_duration_seconds",
        "HTTP request duration in seconds",
        &["method", "path"]
    )
    .expect("failed to register http_request_duration_seconds")
});

// Handler для /metrics
async fn metrics_handler() -> impl IntoResponse {
    let encoder = TextEncoder::new();
    let metric_families = prometheus::gather();
    let mut buffer = Vec::new();

    encoder
        .encode(&metric_families, &mut buffer)
        .expect("failed to encode metrics");

    (
        [("Content-Type", encoder.format_type().to_string())],
        String::from_utf8(buffer).expect("metrics buffer is not valid UTF-8"),
    )
}

// Middleware, который считает метрики по всем HTTP-запросам
async fn metrics_middleware(req: Request<axum::body::Body>, next: Next) -> Response {
    let start = Instant::now();

    let method = req.method().as_str().to_string();

    // Берем шаблонный путь, например /balance/{user_id}, а не конкретный /balance/123
    let path = req
        .extensions()
        .get::<MatchedPath>()
        .map(|p| p.as_str().to_string())
        .unwrap_or_else(|| "unknown".to_string());

    let response = next.run(req).await;

    let status = response.status();
    let status_str = status.as_u16().to_string();
    let elapsed = start.elapsed().as_secs_f64();

    HTTP_REQUESTS_TOTAL
        .with_label_values(&[&method, &path, &status_str])
        .inc();

    HTTP_REQUEST_DURATION_SECONDS
        .with_label_values(&[&method, &path])
        .observe(elapsed);

    if status.is_client_error() || status.is_server_error() {
        HTTP_ERRORS_TOTAL
            .with_label_values(&[&method, &path, &status_str])
            .inc();
    }

    response
}

#[tokio::main]
async fn main() {
    let (client, db) = get_db().await;

    let redis_url =
        std::env::var("REDIS_URL").unwrap_or_else(|_| "redis://localhost:6379".to_string());
    let redis_client = redis::Client::open(redis_url).expect("Failed to create Redis client");
    let redis_conn = redis_client
        .get_multiplexed_async_connection()
        .await
        .expect("Failed to connect to Redis");

    let app_state = AppState {
        client,
        db,
        redis: redis_conn,
    };

    let app = Router::new()
        .route("/", get(|| async { "alive".to_string() }))
        .route("/health", get(|| async { "alive".to_string() }))
        .route("/metrics", get(metrics_handler))
        .route(
            "/transaction/{user_id}",
            post(api::transactions::create).get(api::transactions::get_user_transactions),
        )
        .route("/balance/{user_id}", get(api::balance::get_balance))
        .route("/tap", post(api::tap::tap))
        .route("/bonus/daily", post(api::bonus::daily_bonus))
        .merge(SwaggerUi::new("/docs").url("/api-docs/openapi.json", ApiDoc::openapi()))
        .layer(middleware::from_fn(metrics_middleware))
        .with_state(app_state);

    let listener = tokio::net::TcpListener::bind("0.0.0.0:8000")
        .await
        .unwrap();

    println!("Server started on http://127.0.0.1:8000");
    println!("Swagger UI available at http://127.0.0.1:8000/docs");
    println!("Metrics available at http://127.0.0.1:8000/metrics");

    axum::serve(listener, app).await.unwrap();
}