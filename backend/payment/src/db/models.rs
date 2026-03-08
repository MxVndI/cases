use crate::shared::schemas::Currency;
use crate::shared::{requests::CreateTransaction, schemas::Wallet};
use chrono::Utc;
use mongodb::bson::doc;

use mongodb::{
    Database,
    bson::{DateTime, oid::ObjectId},
    results::InsertOneResult,
};
use mongodb_ro::Model;
use mongodb_ro::event::Boot;
use serde::{Deserialize, Serialize};
use uuid::Uuid;
#[derive(Serialize, Deserialize, Debug, Default, Model)]
#[model(collection = "transaction")]
pub struct Transaction {
    _id: Option<ObjectId>,
    #[model(unique)]
    id: Uuid,
    amount: f64,
    currency: Currency,
    status: String,
    from: Uuid,
    to: Uuid,
    timestamp: Option<DateTime>,
}

impl Boot for Transaction {
    type Req = Uuid;
}

pub struct TransactionManager {}

impl TransactionManager {
    pub async fn create(
        db: &Database,
        tr: &CreateTransaction,
        initiator_id: Uuid,
    ) -> Result<String, Box<dyn std::error::Error>> {
        let mut transaction_model = Transaction::new_model(db);
        transaction_model.id = Uuid::new_v4();
        transaction_model.from = initiator_id;
        transaction_model.amount = tr.amount;
        transaction_model.currency = tr.currency.clone();
        transaction_model.to = tr.to;
        transaction_model.status = "started".to_string();
        transaction_model.timestamp = Some(DateTime::from_millis(Utc::now().timestamp_millis()));
        match transaction_model.create().await {
            Ok(InsertOneResult { inserted_id, .. }) => {
                println!("Transaction created with ID: {:?}", inserted_id);

                let cur = tr.currency.clone();
                let cur_name = match cur {
                    Currency::EUR => "EUR",
                    Currency::RUB => "RUB",
                    Currency::USD => "USD",
                };

                let update_key = format!("wallet.balances.{}", cur_name);

                let mut balance_model = Balance::new_model(db);
                let sender_balance = balance_model
                    .r#where(doc! {"user_id": initiator_id.to_string()})
                    .first()
                    .await
                    .map_err(|e| format!("Failed to check sender balance: {}", e))?;

                let sender_amount = match &sender_balance {
                    Some(balance) => match cur {
                        Currency::EUR => balance.wallet.balances["EUR"],
                        Currency::RUB => balance.wallet.balances["RUB"],
                        Currency::USD => balance.wallet.balances["USD"],
                    },
                    None => 0.0,
                };

                if sender_amount < tr.amount && initiator_id.to_string() != Uuid::nil().to_string()
                {
                    let mut transaction_update_model = Transaction::new_model(db);
                    transaction_update_model
                        .r#where(doc! {"_id": inserted_id.clone()})
                        .update(doc! {"$set": {"status": "failed"}})
                        .await
                        .map_err(|e| format!("Failed to update transaction status: {}", e))?;

                    return Err(format!(
                        "Insufficient funds. Sender has {:.2} {}, needs {:.2} {}",
                        sender_amount, cur_name, tr.amount, cur_name
                    )
                    .into());
                }

                let mut balance_model = Balance::new_model(db);
                balance_model
                    .r#where(doc! {"user_id": initiator_id.to_string()})
                    .upsert()
                    .update(doc! {"$inc": { update_key.as_str(): -tr.amount }})
                    .await
                    .map_err(|e| format!("Failed to debit sender: {}", e))?;

                let mut balance_model = Balance::new_model(db);
                balance_model
                    .reset()
                    .r#where(doc! {"user_id": transaction_model.to.to_string()})
                    .upsert()
                    .update(doc! {"$inc": { update_key.as_str(): tr.amount }})
                    .await
                    .map_err(|e| format!("Failed to credit receiver: {}", e))?;

                let mut transaction_update_model = Transaction::new_model(db);
                transaction_update_model
                    .r#where(doc! {"_id": inserted_id.clone()})
                    .update(doc! {"$set": {"status": "completed"}})
                    .await
                    .map_err(|e| format!("Failed to update transaction status: {}", e))?;

                Ok("Transaction completed successfully".to_string())
            }

            Err(e) => Err(format!("Failed to create transaction: {}", e).into()),
        }
    }

    pub async fn create_random(db: &Database) -> Result<String, Box<dyn std::error::Error>> {
        let mut transaction_model = Transaction::new_model(db);
        transaction_model.id = Uuid::new_v4();
        transaction_model.from = Uuid::new_v4();
        transaction_model.amount = 555.0;
        transaction_model.currency = Currency::EUR;
        transaction_model.to = Uuid::new_v4();
        transaction_model.timestamp = Some(DateTime::from_millis(Utc::now().timestamp_millis()));
        match transaction_model.create().await {
            Ok(InsertOneResult { inserted_id, .. }) => {
                println!("Transaction created with ID: {:?}", inserted_id);

                Ok("Transaction created successfully".to_string())
            }

            Err(e) => Err(format!("Failed to create transaction: {}", e).into()),
        }
    }

    pub async fn get_for_user(
        db: &Database,
        user_id: Uuid,
    ) -> Result<Vec<Transaction>, Box<dyn std::error::Error>> {
        let transaction_model = Transaction::new_model(db);
        let all_data = transaction_model
            .r#where(doc! {
                "$or": [
                    { "from": user_id.to_string() },
                    { "to": user_id.to_string() }
                ]
            })
            .get()
            .await;

        match all_data {
            Ok(data) => Ok(data),

            Err(er) => Err(format!("Failed to get transaction: {}", er).into()),
        }
    }

    pub async fn get_all(db: &Database) -> Result<Vec<Transaction>, Box<dyn std::error::Error>> {
        let transaction_model = Transaction::new_model(db);
        let all_data = transaction_model.get().await;

        match all_data {
            Ok(data) => Ok(data),

            Err(er) => Err(format!("Failed to get transaction: {}", er).into()),
        }
    }
}
#[derive(Serialize, Deserialize, Debug, Default, Model)]
#[model(collection = "balance")]
pub struct Balance {
    _id: Option<ObjectId>,
    #[model(unique)]
    user_id: Uuid,
    pub wallet: Wallet,
}

impl Boot for Balance {
    type Req = Uuid;
}

pub struct BalanceManager {}
impl BalanceManager {
    pub async fn get_balance(db: &Database, user_id: Uuid) -> Option<Balance> {
        let mut bm = Balance::new_model(db);
        match bm
            .r#where(doc! {"user_id":user_id.to_string()})
            .first()
            .await
        {
            Ok(data) => match data {
                Some(found) => Some(found),
                _ => None,
            },

            Err(er) => None,
        }
    }
}
