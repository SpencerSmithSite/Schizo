import { invoke } from "@tauri-apps/api/core";
import type { PlatformAdapter, LoadedBoard } from "./adapter";
import type { Board, BoardBackground } from "../types/board";
import type { Item } from "../types/items";
import type { Connection } from "../types/connections";

// ── Wire types (match Rust struct field names) ────────────────────────────────

interface BoardRow {
  id: string;
  name: string;
  created_at: number;
  updated_at: number;
  bg_style: string;
  viewport_x: number;
  viewport_y: number;
  viewport_scale: number;
}

interface ItemRow {
  id: string;
  board_id: string;
  type: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  z_index: number;
  created_at: number;
  label: string | null;
  data: string;
}

interface ConnectionRow {
  id: string;
  board_id: string;
  from_pin_id: string;
  to_pin_id: string;
  style: string;
  label: string | null;
  created_at: number;
}

// ── Conversion helpers ────────────────────────────────────────────────────────

function boardFromRow(row: BoardRow): Board {
  return {
    id: row.id,
    name: row.name,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    backgroundStyle: row.bg_style as BoardBackground,
    viewport: { x: row.viewport_x, y: row.viewport_y, scale: row.viewport_scale },
  };
}

function boardToRow(board: Board): BoardRow {
  return {
    id: board.id,
    name: board.name,
    created_at: board.createdAt,
    updated_at: board.updatedAt,
    bg_style: board.backgroundStyle,
    viewport_x: board.viewport.x,
    viewport_y: board.viewport.y,
    viewport_scale: board.viewport.scale,
  };
}

function itemFromRow(row: ItemRow): Item {
  // data blob holds type-specific fields + pins array
  const data: Record<string, unknown> = JSON.parse(row.data);
  const base = {
    id: row.id,
    boardId: row.board_id,
    x: row.x,
    y: row.y,
    width: row.width,
    height: row.height,
    rotation: row.rotation,
    zIndex: row.z_index,
    createdAt: row.created_at,
    label: row.label ?? undefined,
    pins: (data.pins as Item["pins"]) ?? [],
  };

  switch (row.type) {
    case "note":
      return {
        ...base,
        type: "note",
        content: (data.content as string) ?? "",
        color: (data.color as string) ?? "#fff9c4",
        fontSize: (data.fontSize as number) ?? 14,
      };
    case "image":
      return {
        ...base,
        type: "image",
        src: (data.src as string) ?? "",
        altText: data.altText as string | undefined,
      };
    case "screenshot":
      return {
        ...base,
        type: "screenshot",
        src: (data.src as string) ?? "",
        capturedAt: (data.capturedAt as number) ?? row.created_at,
        sourceUrl: data.sourceUrl as string | undefined,
      };
    case "link":
      return {
        ...base,
        type: "link",
        url: (data.url as string) ?? "",
        title: data.title as string | undefined,
        description: data.description as string | undefined,
        faviconUrl: data.faviconUrl as string | undefined,
        previewImageUrl: data.previewImageUrl as string | undefined,
        fetchedAt: data.fetchedAt as number | undefined,
      };
    case "video":
      return {
        ...base,
        type: "video",
        src: data.src as string | undefined,
        url: data.url as string | undefined,
        startTime: (data.startTime as number) ?? 0,
        endTime: data.endTime as number | undefined,
        thumbnailUrl: data.thumbnailUrl as string | undefined,
      };
    default:
      // fallback — treat unknown type as a note
      return { ...base, type: "note", content: "", color: "#fff9c4", fontSize: 14 };
  }
}

function itemToRow(item: Item): ItemRow {
  // Pull out the base columns; everything else (type-specific + pins) goes to data
  const { id, boardId, x, y, width, height, rotation, zIndex, createdAt, label, pins, type, ...rest } =
    item as Item & Record<string, unknown>;
  return {
    id: id as string,
    board_id: boardId as string,
    type: type as string,
    x: x as number,
    y: y as number,
    width: width as number,
    height: height as number,
    rotation: rotation as number,
    z_index: zIndex as number,
    created_at: createdAt as number,
    label: (label as string | undefined) ?? null,
    data: JSON.stringify({ ...rest, pins }),
  };
}

function connectionFromRow(row: ConnectionRow): Connection {
  return {
    id: row.id,
    boardId: row.board_id,
    fromPinId: row.from_pin_id,
    toPinId: row.to_pin_id,
    style: JSON.parse(row.style),
    label: row.label ?? undefined,
    createdAt: row.created_at,
  };
}

function connectionToRow(conn: Connection): ConnectionRow {
  return {
    id: conn.id,
    board_id: conn.boardId,
    from_pin_id: conn.fromPinId,
    to_pin_id: conn.toPinId,
    style: JSON.stringify(conn.style),
    label: conn.label ?? null,
    created_at: conn.createdAt,
  };
}

// ── Adapter ───────────────────────────────────────────────────────────────────

export const tauriAdapter: PlatformAdapter = {
  async listBoards() {
    const rows = await invoke<BoardRow[]>("list_boards");
    return rows.map(boardFromRow);
  },

  async loadBoard(id: string): Promise<LoadedBoard> {
    const data = await invoke<{
      board: BoardRow;
      items: ItemRow[];
      connections: ConnectionRow[];
    }>("load_board", { id });
    return {
      board: boardFromRow(data.board),
      items: data.items.map(itemFromRow),
      connections: data.connections.map(connectionFromRow),
    };
  },

  async saveBoard(board, items, connections) {
    await invoke("save_board", {
      payload: {
        board: boardToRow(board),
        items: items.map(itemToRow),
        connections: connections.map(connectionToRow),
      },
    });
  },

  async deleteBoard(id) {
    await invoke("delete_board", { id });
  },

  async getSetting(key) {
    return invoke<string | null>("get_setting", { key });
  },

  async setSetting(key, value) {
    await invoke("set_setting", { key, value });
  },
};
