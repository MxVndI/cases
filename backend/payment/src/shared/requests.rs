use crate::shared::schemas::Currency;
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Serialize, Deserialize, Debug, Default)]
pub struct CreateTransaction {
    pub currency: Currency,
    pub amount: f64,
    pub to: Uuid,
}
