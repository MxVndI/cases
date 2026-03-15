use axum::{
    Json,
    extract::{Path, State},
};
use uuid::Uuid;

use crate::{
    AppState,
    db::models::{Transaction, TransactionManager},
    shared::requests::CreateTransaction,
};

/// Get all transactions
#[utoipa::path(
    get,
    path = "/transactions",
    tag = "payment",
    responses(
        (status = 200, description = "List of all transactions", body = [Transaction]),
    ),
)]
pub async fn get_transactions(State(state): State<AppState>) -> Json<Vec<Transaction>> {
    let db = state.client.database(&state.db);
    match TransactionManager::get_all(&db).await {
        Ok(data) => Json(data),
        Err(_) => Json(Vec::new()),
    }
}

/// Get transactions for a specific user
#[utoipa::path(
    get,
    path = "/transaction/{user_id}",
    tag = "payment",
    params(
        ("user_id" = Uuid, Path, description = "User ID"),
    ),
    responses(
        (status = 200, description = "List of user transactions", body = [Transaction]),
    ),
)]
pub async fn get_user_transactions(
    Path(user_id): Path<Uuid>,
    State(state): State<AppState>,
) -> Json<Vec<Transaction>> {
    let db = state.client.database(&state.db);
    match TransactionManager::get_for_user(&db, user_id).await {
        Ok(data) => Json(data),
        Err(_) => Json(Vec::new()),
    }
}

pub async fn create_random(State(state): State<AppState>) -> Json<String> {
    let db = state.client.database(&state.db);
    match TransactionManager::create_random(&db).await {
        Ok(data) => Json(data),
        Err(e) => Json(e.to_string()),
    }
}

/// Create a transaction for a specific user
#[utoipa::path(
    post,
    path = "/transaction/{user_id}",
    tag = "payment",
    params(
        ("user_id" = Uuid, Path, description = "User ID"),
    ),
    request_body = CreateTransaction,
    responses(
        (status = 200, description = "Transaction created successfully", body = String),
        (status = 400, description = "Bad request"),
    ),
)]
pub async fn create(
    Path(user_id): Path<Uuid>,
    State(state): State<AppState>,
    Json(payload): Json<CreateTransaction>,
) -> Json<String> {
    let db = state.client.database(&state.db);
    match TransactionManager::create(&db, &payload, user_id).await {
        Ok(data) => Json(data),
        Err(e) => Json(e.to_string()),
    }
}
