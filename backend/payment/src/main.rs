mod api;
mod db;
mod shared;
#[allow(dead_code)]
use axum::{
    Router,
    routing::{get, post},
};
use db::utils::get_db;
use mongodb::Client;
use utoipa::OpenApi;
use utoipa_swagger_ui::SwaggerUi;

#[derive(Clone)]
struct AppState {
    client: Client,
    db: String,
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

#[tokio::main]
async fn main() {
    let (client, db) = get_db().await;
    let app_state = AppState { client, db };
    let app = Router::new()
        .route("/", get(|| async { "alive".to_string() }))
        .route(
            "/transaction/{user_id}",
            post(api::transactions::create).get(api::transactions::get_user_transactions),
        )
        .route("/balance/{user_id}", get(api::balance::get_balance))
        .route("/tap", post(api::tap::tap))
        .merge(SwaggerUi::new("/docs").url("/api-docs/openapi.json", ApiDoc::openapi()))
        .with_state(app_state);

    let listener = tokio::net::TcpListener::bind("0.0.0.0:8000").await.unwrap();

    println!("Сервер запущен на http://127.0.0.1:8000");
    println!("Swagger UI доступен по адресу http://127.0.0.1:8000/docs");
    axum::serve(listener, app).await.unwrap();
}
