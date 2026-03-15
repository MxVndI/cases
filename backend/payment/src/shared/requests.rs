use crate::shared::schemas::Currency;
use serde::{Deserialize, Serialize};
use utoipa::ToSchema;
use uuid::Uuid;

#[derive(Serialize, Deserialize, Debug, Default, ToSchema)]
pub struct CreateTransaction {
    pub currency: Currency,
    pub amount: f64,
    pub to: Uuid,
}
