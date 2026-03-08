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

pub async fn get_transactions(State(state): State<AppState>) -> Json<Vec<Transaction>> {
    let db = state.client.database(&state.db);
    match TransactionManager::get_all(&db).await {
        Ok(data) => Json(data),
        Err(_) => Json(Vec::new()),
    }
}

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
