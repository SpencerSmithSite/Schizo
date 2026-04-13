pub mod schema;

use rusqlite::{Connection, Result};
use std::path::Path;

pub fn open(db_path: &Path) -> Result<Connection> {
    let conn = Connection::open(db_path)?;
    conn.execute_batch(schema::CREATE_TABLES)?;

    // Insert schema version if not present
    let version: u32 = conn
        .query_row(
            "SELECT version FROM schema_version LIMIT 1",
            [],
            |row| row.get(0),
        )
        .unwrap_or(0);

    if version == 0 {
        conn.execute(
            "INSERT INTO schema_version (version) VALUES (?1)",
            [schema::SCHEMA_VERSION],
        )?;
    }

    Ok(conn)
}
