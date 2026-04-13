import type { Board } from "../types/board";
import type { Item } from "../types/items";
import type { Connection } from "../types/connections";

export interface LoadedBoard {
  board: Board;
  items: Item[];
  connections: Connection[];
}

export interface PlatformAdapter {
  listBoards(): Promise<Board[]>;
  loadBoard(id: string): Promise<LoadedBoard>;
  saveBoard(board: Board, items: Item[], connections: Connection[]): Promise<void>;
  deleteBoard(id: string): Promise<void>;
  getSetting(key: string): Promise<string | null>;
  setSetting(key: string, value: string): Promise<void>;
}

function isTauriApp(): boolean {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}

let _adapter: PlatformAdapter | null = null;

export async function getAdapter(): Promise<PlatformAdapter> {
  if (_adapter) return _adapter;
  if (isTauriApp()) {
    const { tauriAdapter } = await import("./tauriAdapter");
    _adapter = tauriAdapter;
  } else {
    const { webAdapter } = await import("./webAdapter");
    _adapter = webAdapter;
  }
  return _adapter;
}
