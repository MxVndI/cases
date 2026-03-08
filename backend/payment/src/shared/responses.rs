use crate::shared::schemas::{Currency, Wallet};
use mongodb::bson::DateTime;
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Serialize, Deserialize, Debug)]
pub struct GetBalance {
    pub wallet: Wallet,
}

impl Default for GetBalance {
    fn default() -> Self {
        Self {
            wallet: Default::default(),
        }
    }
}
#[derive(Serialize, Deserialize, Debug)]
pub struct GetTransaction {
    pub from: Uuid,
    pub to: Uuid,
    pub currency: Currency,
    pub amount: f64,
    pub status: String,
    pub timestamp: DateTime,
}
