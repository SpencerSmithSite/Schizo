/// SQLite schema for Schizo.
/// Uses a single `items` table with a `type` column and `data` JSON blob
/// for type-specific fields. This avoids a table-per-type explosion while
/// keeping the indexed fields (id, board_id, x, y, z_index) queryable.

pub const SCHEMA_VERSION: u32 = 1;

pub const CREATE_TABLES: &str = r#"
PRAGMA journal_mode=WAL;
PRAGMA foreign_keys=ON;

CREATE TABLE IF NOT EXISTS schema_version (
    version INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS boards (
    id          TEXT PRIMARY KEY NOT NULL,
    name        TEXT NOT NULL,
    created_at  INTEGER NOT NULL,
    updated_at  INTEGER NOT NULL,
    bg_style    TEXT NOT NULL DEFAULT 'cork',
    viewport_x  REAL NOT NULL DEFAULT 0,
    viewport_y  REAL NOT NULL DEFAULT 0,
    viewport_scale REAL NOT NULL DEFAULT 1.0
);

CREATE TABLE IF NOT EXISTS items (
    id          TEXT PRIMARY KEY NOT NULL,
    board_id    TEXT NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
    type        TEXT NOT NULL,
    x           REAL NOT NULL,
    y           REAL NOT NULL,
    width       REAL NOT NULL,
    height      REAL NOT NULL,
    rotation    REAL NOT NULL DEFAULT 0,
    z_index     INTEGER NOT NULL DEFAULT 0,
    created_at  INTEGER NOT NULL,
    label       TEXT,
    data        TEXT NOT NULL DEFAULT '{}'
);
CREATE INDEX IF NOT EXISTS idx_items_board ON items(board_id);

CREATE TABLE IF NOT EXISTS connections (
    id          TEXT PRIMARY KEY NOT NULL,
    board_id    TEXT NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
    from_pin_id TEXT NOT NULL,
    to_pin_id   TEXT NOT NULL,
    style       TEXT NOT NULL DEFAULT '{}',
    label       TEXT,
    created_at  INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_connections_board ON connections(board_id);

CREATE TABLE IF NOT EXISTS settings (
    key     TEXT PRIMARY KEY NOT NULL,
    value   TEXT NOT NULL
);
"#;
