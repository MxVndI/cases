use axum::{
    Json,
    extract::State,
    http::{HeaderMap, StatusCode},
};
use redis::AsyncCommands;
use serde::{Deserialize, Serialize};
use utoipa::ToSchema;
use uuid::Uuid;

use crate::{
    AppState, db::models::TransactionManager, shared::requests::CreateTransaction,
    shared::schemas::Currency,
};

const MAX_TAP_AMOUNT: f64 = 100000.0;
const MAX_TAPS_PER_SECOND: i64 = 10;

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
        (status = 429, description = "Too many requests - rate limit exceeded"),
        (status = 500, description = "Internal server error"),
    ),
)]
pub async fn tap(
    headers: HeaderMap,
    State(state): State<AppState>,
    Json(payload): Json<TapRequest>,
) -> Result<Json<TapResponse>, StatusCode> {
    // Проверка максимальной суммы за один tap
    if payload.amount == 0.0 || payload.amount.abs() > MAX_TAP_AMOUNT {
        return Err(StatusCode::BAD_REQUEST);
    }

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

    // Rate limiting: INCR tap:{user_id}, EXPIRE 1 sec
    let rate_key = format!("tap:{}", user_id);
    let mut redis_conn = state.redis.clone();
    let count: i64 = redis_conn
        .incr(&rate_key, 1i64)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    if count == 1 {
        let _: () = redis_conn
            .expire(&rate_key, 1)
            .await
            .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
    }

    if count > MAX_TAPS_PER_SECOND {
        return Err(StatusCode::TOO_MANY_REQUESTS);
    }

    // Создаем транзакцию: положительное = system→user, отрицательное = user→system
    let db = state.client.database(&state.db);
    let (from_id, to_id, abs_amount) = if payload.amount > 0.0 {
        (Uuid::nil(), user_id, payload.amount)
    } else {
        (user_id, Uuid::nil(), payload.amount.abs())
    };
    let transaction_data = CreateTransaction {
        currency: Currency::CHC,
        amount: abs_amount,
        to: to_id,
        description: Some("Фарм".to_string()),
    };

    match TransactionManager::create(&db, &transaction_data, from_id).await {
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
