use crate::db::models::BalanceManager;
use crate::{AppState, shared::responses::GetBalance};
use axum::{
    Json,
    extract::{Path, State},
};
use uuid::Uuid;

/// Get user balance
#[utoipa::path(
    get,
    path = "/balance/{user_id}",
    tag = "payment",
    params(
        ("user_id" = Uuid, Path, description = "User ID"),
    ),
    responses(
        (status = 200, description = "User balance", body = GetBalance),
    ),
)]
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
