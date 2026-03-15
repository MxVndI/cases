use axum::{
    Json,
    extract::State,
    http::{HeaderMap, StatusCode},
};
use serde::{Deserialize, Serialize};
use utoipa::ToSchema;
use uuid::Uuid;

use crate::{
    AppState, db::models::TransactionManager, shared::requests::CreateTransaction,
    shared::schemas::Currency,
};

#[derive(Serialize, Deserialize, ToSchema)]
pub struct TapRequest {
    pub amount: f64,
}

#[derive(Serialize, Deserialize, ToSchema)]
pub struct TapResponse {
    pub success: bool,
    pub message: String,
    pub transaction_id: Option<Uuid>,
}

/// Tap endpoint - creates a transaction from system to user
#[utoipa::path(
    post,
    path = "/tap",
    tag = "payment",
    request_body = TapRequest,
    responses(
        (status = 200, description = "Transaction created successfully", body = TapResponse),
        (status = 401, description = "Unauthorized - invalid or missing sid cookie"),
        (status = 500, description = "Internal server error"),
    ),
)]
pub async fn tap(
    headers: HeaderMap,
    State(state): State<AppState>,
    Json(payload): Json<TapRequest>,
) -> Result<Json<TapResponse>, StatusCode> {
    // Получаем sid из куки
    let cookie_header = headers
        .get("cookie")
        .and_then(|v| v.to_str().ok())
        .ok_or(StatusCode::UNAUTHORIZED)?;

    let sid = cookie_header
        .split("; ")
        .find_map(|pair| {
            let mut parts = pair.splitn(2, "=");
            match (parts.next(), parts.next()) {
                (Some("sid"), Some(value)) => Some(value.to_string()),
                _ => None,
            }
        })
        .ok_or(StatusCode::UNAUTHORIZED)?;

    // Отправляем запрос на auth service для верификации
    let auth_service_url =
        std::env::var("AUTH_SERVICE_URL").unwrap_or_else(|_| "http://localhost:8000".to_string());
    let token = std::env::var("TOKEN").unwrap_or_else(|_| "".to_string());

    let client = reqwest::Client::new();
    let response = client
        .get(format!("{}/verify_user/{}", auth_service_url, sid))
        .query(&[("token", &token)])
        .send()
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    if !response.status().is_success() {
        return Err(StatusCode::UNAUTHORIZED);
    }

    #[derive(Deserialize)]
    struct AuthResponse {
        uid: String,
    }

    let auth_data: AuthResponse = response
        .json()
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    let user_id = Uuid::parse_str(&auth_data.uid).map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    // Создаем транзакцию от системы (Uuid::nil()) на аккаунт пользователя
    let db = state.client.database(&state.db);
    let transaction_data = CreateTransaction {
        currency: Currency::RUB,
        amount: payload.amount,
        to: user_id,
    };

    match TransactionManager::create(&db, &transaction_data, Uuid::nil()).await {
        Ok(_) => Ok(Json(TapResponse {
            success: true,
            message: "Транзакция успешно создана".to_string(),
            transaction_id: Some(user_id),
        })),
        Err(e) => {
            eprintln!("Ошибка создания транзакции: {}", e);
            Err(StatusCode::INTERNAL_SERVER_ERROR)
        }
    }
}
