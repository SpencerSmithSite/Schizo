import type { Item } from "../types/items";
import type { Board } from "../types/board";
import type { PlatformAdapter } from "./adapter";

export interface SearchResult {
  boardId: string;
  boardName: string;
  itemId: string;
  itemType: Item["type"];
  snippet: string;
  itemX: number;
  itemY: number;
  itemWidth: number;
  itemHeight: number;
}

function getItemText(item: Item): string {
  const parts: string[] = [];
  if (item.label) parts.push(item.label);
  switch (item.type) {
    case "note":
      if (item.content) parts.push(item.content);
      break;
    case "link":
      if (item.title) parts.push(item.title);
      if (item.description) parts.push(item.description);
      if (item.url) parts.push(item.url);
      break;
    case "image":
      if (item.altText) parts.push(item.altText);
      break;
    case "screenshot":
      if (item.sourceUrl) parts.push(item.sourceUrl);
      break;
    case "video":
      if (item.url) parts.push(item.url);
      if (item.src) parts.push(item.src);
      break;
    case "board-portal":
      break;
  }
  return parts.join(" ");
}

function makeSnippet(text: string, query: string, maxLen = 90): string {
  const lower = text.toLowerCase();
  const idx = lower.indexOf(query.toLowerCase());
  if (idx === -1) return text.slice(0, maxLen) + (text.length > maxLen ? "…" : "");
  const start = Math.max(0, idx - 25);
  const end = Math.min(text.length, idx + query.length + 50);
  return (start > 0 ? "…" : "") + text.slice(start, end) + (end < text.length ? "…" : "");
}

export async function searchAllBoards(
  query: string,
  boards: Board[],
  adapter: PlatformAdapter,
  activeItems?: Item[],
  activeBoardId?: string,
): Promise<SearchResult[]> {
  if (!query.trim()) return [];
  const q = query.trim().toLowerCase();
  const results: SearchResult[] = [];

  await Promise.all(
    boards.map(async (board) => {
      try {
        // Use in-memory items for the active board (may have unsaved changes)
        const items =
          board.id === activeBoardId && activeItems
            ? activeItems
            : (await adapter.loadBoard(board.id)).items;

        for (const item of items) {
          const text = getItemText(item);
          if (text.toLowerCase().includes(q)) {
            results.push({
              boardId: board.id,
              boardName: board.name,
              itemId: item.id,
              itemType: item.type,
              snippet: makeSnippet(text, q),
              itemX: item.x,
              itemY: item.y,
              itemWidth: item.width,
              itemHeight: item.height,
            });
          }
        }
      } catch {
        /* skip boards that fail to load */
      }
    }),
  );

  // Sort: active board first, then alphabetical by board name
  results.sort((a, b) => {
    if (a.boardId === activeBoardId && b.boardId !== activeBoardId) return -1;
    if (b.boardId === activeBoardId && a.boardId !== activeBoardId) return 1;
    return a.boardName.localeCompare(b.boardName);
  });

  return results;
}
