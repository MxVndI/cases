mod api;
mod db;
mod shared;
use axum::{
    Json, Router,
    extract::{Path, Query, State},
    routing::{get, post},
};

use db::utils::get_db;
use mongodb::Client;

#[derive(Clone)]
struct AppState {
    client: Client,
    db: String,
}

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
        .with_state(app_state);

    let listener = tokio::net::TcpListener::bind("0.0.0.0:8000").await.unwrap();

    println!("Сервер запущен на http://127.0.0.1:8000");
    axum::serve(listener, app).await.unwrap();
}
