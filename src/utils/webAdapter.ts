/**
 * Web / PWA adapter — persists to localStorage.
 * Used when running outside of Tauri (browser dev, PWA).
 */
import type { PlatformAdapter, LoadedBoard, LinkPreview } from "./adapter";
import type { Board } from "../types/board";
import type { Item } from "../types/items";
import type { Connection } from "../types/connections";

const BOARDS_KEY = "schizo:boards";
const itemsKey = (boardId: string) => `schizo:items:${boardId}`;
const connsKey = (boardId: string) => `schizo:connections:${boardId}`;
const SETTINGS_KEY = "schizo:settings";

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export const webAdapter: PlatformAdapter = {
  async listBoards(): Promise<Board[]> {
    return readJson<Board[]>(BOARDS_KEY, []);
  },

  async loadBoard(id: string): Promise<LoadedBoard> {
    const boards = readJson<Board[]>(BOARDS_KEY, []);
    const board = boards.find((b) => b.id === id);
    if (!board) throw new Error(`Board ${id} not found`);
    const items = readJson<Item[]>(itemsKey(id), []);
    const connections = readJson<Connection[]>(connsKey(id), []);
    return { board, items, connections };
  },

  async saveBoard(board: Board, items: Item[], connections: Connection[]): Promise<void> {
    const boards = readJson<Board[]>(BOARDS_KEY, []);
    const idx = boards.findIndex((b) => b.id === board.id);
    if (idx >= 0) boards[idx] = board;
    else boards.push(board);
    localStorage.setItem(BOARDS_KEY, JSON.stringify(boards));
    localStorage.setItem(itemsKey(board.id), JSON.stringify(items));
    localStorage.setItem(connsKey(board.id), JSON.stringify(connections));
  },

  async deleteBoard(id: string): Promise<void> {
    const boards = readJson<Board[]>(BOARDS_KEY, []).filter((b) => b.id !== id);
    localStorage.setItem(BOARDS_KEY, JSON.stringify(boards));
    localStorage.removeItem(itemsKey(id));
    localStorage.removeItem(connsKey(id));
  },

  async getSetting(key: string): Promise<string | null> {
    return readJson<Record<string, string>>(SETTINGS_KEY, {})[key] ?? null;
  },

  async setSetting(key: string, value: string): Promise<void> {
    const settings = readJson<Record<string, string>>(SETTINGS_KEY, {});
    settings[key] = value;
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  },

  async fetchLinkPreview(url: string): Promise<LinkPreview> {
    try {
      const parsed = new URL(url);
      const domain = parsed.hostname;
      const faviconUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;

      // Best-effort HTML fetch (may fail for CORS-blocked URLs)
      const resp = await fetch(url, { signal: AbortSignal.timeout(6000) });
      const text = await resp.text();
      const parser = new DOMParser();
      const doc = parser.parseFromString(text, "text/html");

      const ogTitle = doc.querySelector('meta[property="og:title"]')?.getAttribute("content");
      const ogDesc = doc.querySelector('meta[property="og:description"]')?.getAttribute("content");
      const metaDesc = doc.querySelector('meta[name="description"]')?.getAttribute("content");
      const ogImage = doc.querySelector('meta[property="og:image"]')?.getAttribute("content");
      const pageTitle = doc.querySelector("title")?.textContent?.trim();

      return {
        title: ogTitle || pageTitle || undefined,
        description: ogDesc || metaDesc || undefined,
        faviconUrl,
        previewImageUrl: ogImage || undefined,
      };
    } catch {
      // Fallback: just return the favicon from Google's service
      try {
        const domain = new URL(url).hostname;
        return { faviconUrl: `https://www.google.com/s2/favicons?domain=${domain}&sz=32` };
      } catch {
        return {};
      }
    }
  },
};
