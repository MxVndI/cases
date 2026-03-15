use std::collections::HashMap;

use serde::{Deserialize, Serialize};
use utoipa::ToSchema;

#[derive(Serialize, Deserialize, Debug, Default, Clone, ToSchema)]
#[serde(rename_all = "UPPERCASE")]
pub enum Currency {
    #[default]
    RUB,
    USD,
    EUR,
}

#[derive(Serialize, Deserialize, Debug, Default, Clone, ToSchema)]
pub struct Wallet {
    pub balances: HashMap<String, f64>,
}
