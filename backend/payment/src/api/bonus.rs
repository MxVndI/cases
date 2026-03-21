use axum::{
    Json,
    extract::State,
    http::{HeaderMap, StatusCode},
};
use redis::AsyncCommands;
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::{
    AppState, db::models::TransactionManager, shared::requests::CreateTransaction,
    shared::schemas::Currency,
};

const DAILY_BONUS_AMOUNT: f64 = 100.0;
const DAILY_BONUS_COOLDOWN_SECS: u64 = 86400;

#[derive(Serialize, Deserialize)]
pub struct DailyBonusResponse {
    pub success: bool,
    pub message: String,
    pub amount: f64,
}

pub async fn daily_bonus(
    headers: HeaderMap,
    State(state): State<AppState>,
    Json(_): Json<serde_json::Value>,
) -> Result<Json<DailyBonusResponse>, StatusCode> {
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

    let bonus_key = format!("daily_bonus:{}", user_id);
    let mut redis_conn = state.redis.clone();

    let exists: bool = redis_conn
        .exists(&bonus_key)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    if exists {
        return Ok(Json(DailyBonusResponse {
            success: false,
            message: "Бонус уже получен сегодня".to_string(),
            amount: 0.0,
        }));
    }

    let db = state.client.database(&state.db);
    let transaction_data = CreateTransaction {
        currency: Currency::CHC,
        amount: DAILY_BONUS_AMOUNT,
        to: user_id,
        description: Some("Ежедневный бонус".to_string()),
    };

    let tx_result = TransactionManager::create(&db, &transaction_data, Uuid::nil()).await;
    if let Err(e) = tx_result {
        eprintln!("Daily bonus transaction error: {}", e);
        return Err(StatusCode::INTERNAL_SERVER_ERROR);
    }
    drop(tx_result);

    let _: () = redis_conn
        .set_ex(&bonus_key, "1", DAILY_BONUS_COOLDOWN_SECS)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    Ok(Json(DailyBonusResponse {
        success: true,
        message: "Бонус получен!".to_string(),
        amount: DAILY_BONUS_AMOUNT,
    }))
}
