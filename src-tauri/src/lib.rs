mod commands;
mod db;

use std::path::PathBuf;
use std::sync::Mutex;

use rusqlite::Connection;
use tauri::Manager;

pub struct AppState {
    pub db: Mutex<Connection>,
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .setup(|app| {
            let data_dir: PathBuf = app
                .path()
                .app_data_dir()
                .expect("Failed to get app data dir");
            std::fs::create_dir_all(&data_dir)?;
            let db_path = data_dir.join("schizo.db");
            let conn = db::open(&db_path).expect("Failed to open database");
            app.manage(AppState {
                db: Mutex::new(conn),
            });
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::board::list_boards,
            commands::board::load_board,
            commands::board::save_board,
            commands::board::delete_board,
            commands::board::get_setting,
            commands::board::set_setting,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
