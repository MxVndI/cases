use std::collections::HashMap;

use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Debug, Default, Clone)]
pub enum Currency {
    #[default]
    RUB,
    USD,
    EUR,
}

#[derive(Serialize, Deserialize, Debug, Default, Clone)]
pub struct Wallet {
    pub balances: HashMap<String, f64>,
}
