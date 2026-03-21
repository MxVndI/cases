use crate::shared::schemas::{Currency, Wallet};
use mongodb::bson::DateTime;
use serde::{Deserialize, Serialize};
use utoipa::ToSchema;
use uuid::Uuid;

#[derive(Serialize, Deserialize, Debug, Default, ToSchema)]
pub struct GetBalance {
    pub wallet: Wallet,
}

#[derive(Serialize, Deserialize, Debug, ToSchema)]
pub struct GetTransaction {
    #[schema(value_type = String, format = "Uuid")]
    pub from: Uuid,
    #[schema(value_type = String, format = "Uuid")]
    pub to: Uuid,
    pub currency: Currency,
    pub amount: f64,
    pub status: String,
    #[schema(value_type = String)]
    pub timestamp: DateTime,
}
