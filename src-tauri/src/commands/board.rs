use rusqlite::params;
use serde::{Deserialize, Serialize};
use tauri::State;

use crate::AppState;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct BoardRow {
    pub id: String,
    pub name: String,
    pub created_at: i64,
    pub updated_at: i64,
    pub bg_style: String,
    pub viewport_x: f64,
    pub viewport_y: f64,
    pub viewport_scale: f64,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ItemRow {
    pub id: String,
    pub board_id: String,
    pub r#type: String,
    pub x: f64,
    pub y: f64,
    pub width: f64,
    pub height: f64,
    pub rotation: f64,
    pub z_index: i64,
    pub created_at: i64,
    pub label: Option<String>,
    pub data: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ConnectionRow {
    pub id: String,
    pub board_id: String,
    pub from_pin_id: String,
    pub to_pin_id: String,
    pub style: String,
    pub label: Option<String>,
    pub created_at: i64,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct BoardData {
    pub board: BoardRow,
    pub items: Vec<ItemRow>,
    pub connections: Vec<ConnectionRow>,
}

#[tauri::command]
pub fn list_boards(state: State<AppState>) -> Result<Vec<BoardRow>, String> {
    let conn = state.db.lock().map_err(|e| e.to_string())?;
    let mut stmt = conn
        .prepare(
            "SELECT id, name, created_at, updated_at, bg_style,
             viewport_x, viewport_y, viewport_scale
             FROM boards ORDER BY updated_at DESC",
        )
        .map_err(|e| e.to_string())?;

    let rows = stmt
        .query_map([], |row| {
            Ok(BoardRow {
                id: row.get(0)?,
                name: row.get(1)?,
                created_at: row.get(2)?,
                updated_at: row.get(3)?,
                bg_style: row.get(4)?,
                viewport_x: row.get(5)?,
                viewport_y: row.get(6)?,
                viewport_scale: row.get(7)?,
            })
        })
        .map_err(|e| e.to_string())?;

    rows.collect::<Result<Vec<_>, _>>().map_err(|e| e.to_string())
}

#[tauri::command]
pub fn load_board(id: String, state: State<AppState>) -> Result<BoardData, String> {
    let conn = state.db.lock().map_err(|e| e.to_string())?;

    let board = conn
        .query_row(
            "SELECT id, name, created_at, updated_at, bg_style,
             viewport_x, viewport_y, viewport_scale
             FROM boards WHERE id = ?1",
            params![id],
            |row| {
                Ok(BoardRow {
                    id: row.get(0)?,
                    name: row.get(1)?,
                    created_at: row.get(2)?,
                    updated_at: row.get(3)?,
                    bg_style: row.get(4)?,
                    viewport_x: row.get(5)?,
                    viewport_y: row.get(6)?,
                    viewport_scale: row.get(7)?,
                })
            },
        )
        .map_err(|e| e.to_string())?;

    let mut stmt = conn
        .prepare(
            "SELECT id, board_id, type, x, y, width, height, rotation,
             z_index, created_at, label, data
             FROM items WHERE board_id = ?1 ORDER BY z_index",
        )
        .map_err(|e| e.to_string())?;

    let items = stmt
        .query_map(params![id], |row| {
            Ok(ItemRow {
                id: row.get(0)?,
                board_id: row.get(1)?,
                r#type: row.get(2)?,
                x: row.get(3)?,
                y: row.get(4)?,
                width: row.get(5)?,
                height: row.get(6)?,
                rotation: row.get(7)?,
                z_index: row.get(8)?,
                created_at: row.get(9)?,
                label: row.get(10)?,
                data: row.get(11)?,
            })
        })
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;

    let mut stmt = conn
        .prepare(
            "SELECT id, board_id, from_pin_id, to_pin_id, style, label, created_at
             FROM connections WHERE board_id = ?1",
        )
        .map_err(|e| e.to_string())?;

    let connections = stmt
        .query_map(params![id], |row| {
            Ok(ConnectionRow {
                id: row.get(0)?,
                board_id: row.get(1)?,
                from_pin_id: row.get(2)?,
                to_pin_id: row.get(3)?,
                style: row.get(4)?,
                label: row.get(5)?,
                created_at: row.get(6)?,
            })
        })
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;

    Ok(BoardData {
        board,
        items,
        connections,
    })
}

#[derive(Debug, Deserialize)]
pub struct SaveBoardPayload {
    pub board: BoardRow,
    pub items: Vec<ItemRow>,
    pub connections: Vec<ConnectionRow>,
}

#[tauri::command]
pub fn save_board(payload: SaveBoardPayload, state: State<AppState>) -> Result<(), String> {
    let conn = state.db.lock().map_err(|e| e.to_string())?;

    // Upsert board
    conn.execute(
        "INSERT INTO boards (id, name, created_at, updated_at, bg_style,
         viewport_x, viewport_y, viewport_scale)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)
         ON CONFLICT(id) DO UPDATE SET
           name = excluded.name,
           updated_at = excluded.updated_at,
           bg_style = excluded.bg_style,
           viewport_x = excluded.viewport_x,
           viewport_y = excluded.viewport_y,
           viewport_scale = excluded.viewport_scale",
        params![
            payload.board.id,
            payload.board.name,
            payload.board.created_at,
            payload.board.updated_at,
            payload.board.bg_style,
            payload.board.viewport_x,
            payload.board.viewport_y,
            payload.board.viewport_scale,
        ],
    )
    .map_err(|e| e.to_string())?;

    // Replace all items for this board
    conn.execute(
        "DELETE FROM items WHERE board_id = ?1",
        params![payload.board.id],
    )
    .map_err(|e| e.to_string())?;

    for item in &payload.items {
        conn.execute(
            "INSERT INTO items (id, board_id, type, x, y, width, height, rotation,
             z_index, created_at, label, data)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12)",
            params![
                item.id,
                item.board_id,
                item.r#type,
                item.x,
                item.y,
                item.width,
                item.height,
                item.rotation,
                item.z_index,
                item.created_at,
                item.label,
                item.data,
            ],
        )
        .map_err(|e| e.to_string())?;
    }

    // Replace all connections for this board
    conn.execute(
        "DELETE FROM connections WHERE board_id = ?1",
        params![payload.board.id],
    )
    .map_err(|e| e.to_string())?;

    for conn_row in &payload.connections {
        conn.execute(
            "INSERT INTO connections (id, board_id, from_pin_id, to_pin_id, style, label, created_at)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
            params![
                conn_row.id,
                conn_row.board_id,
                conn_row.from_pin_id,
                conn_row.to_pin_id,
                conn_row.style,
                conn_row.label,
                conn_row.created_at,
            ],
        )
        .map_err(|e| e.to_string())?;
    }

    Ok(())
}

#[tauri::command]
pub fn delete_board(id: String, state: State<AppState>) -> Result<(), String> {
    let conn = state.db.lock().map_err(|e| e.to_string())?;
    conn.execute("DELETE FROM boards WHERE id = ?1", params![id])
        .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn get_setting(key: String, state: State<AppState>) -> Result<Option<String>, String> {
    let conn = state.db.lock().map_err(|e| e.to_string())?;
    let result = conn.query_row(
        "SELECT value FROM settings WHERE key = ?1",
        params![key],
        |row| row.get(0),
    );
    match result {
        Ok(v) => Ok(Some(v)),
        Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
        Err(e) => Err(e.to_string()),
    }
}

#[tauri::command]
pub fn set_setting(key: String, value: String, state: State<AppState>) -> Result<(), String> {
    let conn = state.db.lock().map_err(|e| e.to_string())?;
    conn.execute(
        "INSERT INTO settings (key, value) VALUES (?1, ?2)
         ON CONFLICT(key) DO UPDATE SET value = excluded.value",
        params![key, value],
    )
    .map_err(|e| e.to_string())?;
    Ok(())
}
