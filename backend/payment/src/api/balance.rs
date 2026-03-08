use crate::db::models::BalanceManager;
use crate::{AppState, shared::responses::GetBalance};
use axum::{
    Json,
    extract::{Path, State},
};
use uuid::Uuid;

pub async fn get_balance(
    Path(user_id): Path<Uuid>,
    State(state): State<AppState>,
) -> Json<GetBalance> {
    let db = state.client.database(&state.db);
    match BalanceManager::get_balance(&db, user_id).await {
        Some(data) => Json(GetBalance {
            wallet: data.wallet,
        }),
        _ => Json(GetBalance::default()),
    }
}
