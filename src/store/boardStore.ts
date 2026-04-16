import { create } from "zustand";
import type { Board, Viewport } from "../types/board";
import type { Item, Pin } from "../types/items";
import type { Connection } from "../types/connections";
import { DEFAULT_STRING_STYLE } from "../types/connections";
import { nanoid } from "../utils/nanoid";

interface BoardState {
  // Active board
  board: Board | null;
  items: Item[];
  connections: Connection[];

  // Viewport
  viewport: Viewport;
  setViewport: (v: Viewport) => void;
  panBy: (dx: number, dy: number) => void;
  zoomTo: (scale: number, cx: number, cy: number) => void;

  // Board lifecycle
  initBoard: (board: Board, items: Item[], connections: Connection[]) => void;
  updateBoard: (patch: Partial<Board>) => void;

  // Items
  addItem: (item: Item) => void;
  updateItem: (id: string, patch: Partial<Item>) => void;
  removeItem: (id: string) => void;
  bringToFront: (id: string) => void;

  // Connections
  addConnection: (fromPinId: string, toPinId: string) => void;
  removeConnection: (id: string) => void;

  // Selection
  selectedIds: Set<string>;
  selectItem: (id: string, additive?: boolean) => void;
  clearSelection: () => void;

  // Interaction mode
  mode: "select" | "connect" | "pan";
  setMode: (mode: "select" | "connect" | "pan") => void;

  // Pending connection drag
  pendingFromPin: Pin | null;
  setPendingFromPin: (pin: Pin | null) => void;
}

export const useBoardStore = create<BoardState>((set, get) => ({
  board: null,
  items: [],
  connections: [],

  viewport: { x: 0, y: 0, scale: 1 },

  setViewport: (v) => set({ viewport: v }),

  panBy: (dx, dy) =>
    set((s) => ({
      viewport: { ...s.viewport, x: s.viewport.x + dx, y: s.viewport.y + dy },
    })),

  zoomTo: (scale, cx, cy) =>
    set((s) => {
      const clamped = Math.min(Math.max(scale, 0.1), 4);
      const ratio = clamped / s.viewport.scale;
      return {
        viewport: {
          x: cx - (cx - s.viewport.x) * ratio,
          y: cy - (cy - s.viewport.y) * ratio,
          scale: clamped,
        },
      };
    }),

  initBoard: (board, items, connections) =>
    set({ board, items, connections, viewport: board.viewport }),

  updateBoard: (patch) =>
    set((s) => ({ board: s.board ? { ...s.board, ...patch } : s.board })),

  addItem: (item) => set((s) => ({ items: [...s.items, item] })),

  updateItem: (id, patch) =>
    set((s) => ({
      items: s.items.map((it) =>
        it.id === id ? ({ ...it, ...patch } as Item) : it,
      ),
    })),

  removeItem: (id) =>
    set((s) => ({
      items: s.items.filter((it) => it.id !== id),
      connections: s.connections.filter(
        (c) =>
          !s.items
            .find((it) => it.id === id)
            ?.pins.some(
              (p) => p.id === c.fromPinId || p.id === c.toPinId,
            ),
      ),
    })),

  bringToFront: (id) =>
    set((s) => {
      const maxZ = Math.max(...s.items.map((it) => it.zIndex), 0);
      return {
        items: s.items.map((it) =>
          it.id === id ? ({ ...it, zIndex: maxZ + 1 } as Item) : it,
        ),
      };
    }),

  addConnection: (fromPinId, toPinId) => {
    const { connections, board } = get();
    if (!board) return;
    // Prevent duplicate connections between same pins
    const exists = connections.some(
      (c) =>
        (c.fromPinId === fromPinId && c.toPinId === toPinId) ||
        (c.fromPinId === toPinId && c.toPinId === fromPinId),
    );
    if (exists) return;
    const conn: Connection = {
      id: nanoid(),
      boardId: board.id,
      fromPinId,
      toPinId,
      style: { ...DEFAULT_STRING_STYLE },
      createdAt: Date.now(),
    };
    set((s) => ({ connections: [...s.connections, conn] }));
  },

  removeConnection: (id) =>
    set((s) => ({ connections: s.connections.filter((c) => c.id !== id) })),

  selectedIds: new Set(),

  selectItem: (id, additive = false) =>
    set((s) => {
      if (additive) {
        const next = new Set(s.selectedIds);
        next.has(id) ? next.delete(id) : next.add(id);
        return { selectedIds: next };
      }
      return { selectedIds: new Set([id]) };
    }),

  clearSelection: () => set({ selectedIds: new Set() }),

  mode: "select",
  setMode: (mode) => set({ mode }),

  pendingFromPin: null,
  setPendingFromPin: (pin) => set({ pendingFromPin: pin }),
}));
