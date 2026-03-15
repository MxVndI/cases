use std::env;

use mongodb::Client;
use mongodb::bson::doc;

pub async fn get_db() -> (Client, String) {
    let uri = env::var("MONGODB_URL").unwrap_or("mongodb://localhost:27017".to_string());
    let dbname = env::var("MONGODB_DB_NAME").unwrap_or("payment_db".to_string());

    let client = Client::with_uri_str(&uri).await.unwrap();
    client
        .database("admin")
        .run_command(doc! { "ping": 1 })
        .await
        .unwrap();

    println!("Successfully connected to MongoDB!");

    (client, dbname)
}
