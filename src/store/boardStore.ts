import { create } from "zustand";
import type { Board, Viewport } from "../types/board";
import type { Item, Pin } from "../types/items";
import type { Connection } from "../types/connections";
import { DEFAULT_STRING_STYLE } from "../types/connections";
import { nanoid } from "../utils/nanoid";

const HISTORY_LIMIT = 50;

type Snapshot = { items: Item[]; connections: Connection[] };

function snapshot(s: { items: Item[]; connections: Connection[] }): Snapshot {
  return { items: s.items, connections: s.connections };
}

function pushPast(past: Snapshot[], snap: Snapshot): Snapshot[] {
  const next = [...past, snap];
  if (next.length > HISTORY_LIMIT) next.shift();
  return next;
}

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
  fitToContent: (screenW: number, screenH: number) => void;

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
  updateConnection: (id: string, patch: Partial<Connection>) => void;

  // Selected connection (for style panel)
  selectedConnectionId: string | null;
  setSelectedConnection: (id: string | null) => void;

  // Selection
  selectedIds: Set<string>;
  selectItem: (id: string, additive?: boolean) => void;
  selectItemsInRect: (
    rect: { x: number; y: number; w: number; h: number },
    additive?: boolean,
  ) => void;
  selectAll: () => void;
  clearSelection: () => void;

  // Clipboard (in-memory copy/paste)
  clipboard: Item[];
  copyToClipboard: (ids: Set<string>) => void;
  pasteFromClipboard: () => void;

  // Interaction mode
  mode: "select" | "connect" | "pan";
  setMode: (mode: "select" | "connect" | "pan") => void;

  // Pending connection drag
  pendingFromPin: Pin | null;
  setPendingFromPin: (pin: Pin | null) => void;

  // History (undo / redo)
  past: Snapshot[];
  future: Snapshot[];
  /** Call once before a continuous gesture (drag, resize) begins. */
  pushHistory: () => void;
  undo: () => void;
  redo: () => void;
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

  fitToContent: (screenW, screenH) =>
    set((s) => {
      if (s.items.length === 0) return s;
      const PAD = 64;
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      for (const it of s.items) {
        minX = Math.min(minX, it.x);
        minY = Math.min(minY, it.y);
        maxX = Math.max(maxX, it.x + it.width);
        maxY = Math.max(maxY, it.y + it.height);
      }
      const bboxW = maxX - minX;
      const bboxH = maxY - minY;
      const scale = Math.min(
        Math.max((screenW - PAD * 2) / bboxW, 0.1),
        Math.max((screenH - PAD * 2) / bboxH, 0.1),
        4,
      );
      return {
        viewport: {
          scale,
          x: screenW / 2 - (minX + bboxW / 2) * scale,
          y: screenH / 2 - (minY + bboxH / 2) * scale,
        },
      };
    }),

  initBoard: (board, items, connections) =>
    set({ board, items, connections, viewport: board.viewport, past: [], future: [] }),

  updateBoard: (patch) =>
    set((s) => ({ board: s.board ? { ...s.board, ...patch } : s.board })),

  // addItem snapshots history inline (discrete, single-frame action)
  addItem: (item) =>
    set((s) => ({
      items: [...s.items, item],
      past: pushPast(s.past, snapshot(s)),
      future: [],
    })),

  // updateItem does NOT snapshot — callers must call pushHistory() before a
  // continuous gesture (drag / resize) so we get one undo step per gesture.
  updateItem: (id, patch) =>
    set((s) => ({
      items: s.items.map((it) =>
        it.id === id ? ({ ...it, ...patch } as Item) : it,
      ),
    })),

  // removeItem snapshots history inline
  removeItem: (id) =>
    set((s) => ({
      items: s.items.filter((it) => it.id !== id),
      connections: s.connections.filter(
        (c) =>
          !s.items
            .find((it) => it.id === id)
            ?.pins.some((p) => p.id === c.fromPinId || p.id === c.toPinId),
      ),
      past: pushPast(s.past, snapshot(s)),
      future: [],
    })),

  // bringToFront is a cosmetic z-order change — not worth polluting undo history
  bringToFront: (id) =>
    set((s) => {
      const maxZ = Math.max(...s.items.map((it) => it.zIndex), 0);
      return {
        items: s.items.map((it) =>
          it.id === id ? ({ ...it, zIndex: maxZ + 1 } as Item) : it,
        ),
      };
    }),

  // addConnection snapshots history inline
  addConnection: (fromPinId, toPinId) => {
    const { connections, board } = get();
    if (!board) return;
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
    set((s) => ({
      connections: [...s.connections, conn],
      past: pushPast(s.past, snapshot(s)),
      future: [],
    }));
  },

  // removeConnection snapshots history inline
  removeConnection: (id) =>
    set((s) => ({
      connections: s.connections.filter((c) => c.id !== id),
      past: pushPast(s.past, snapshot(s)),
      future: [],
      selectedConnectionId: s.selectedConnectionId === id ? null : s.selectedConnectionId,
    })),

  // updateConnection snapshots history inline (style / label changes)
  updateConnection: (id, patch) =>
    set((s) => ({
      connections: s.connections.map((c) => (c.id === id ? { ...c, ...patch } : c)),
      past: pushPast(s.past, snapshot(s)),
      future: [],
    })),

  selectedConnectionId: null,
  setSelectedConnection: (id) => set({ selectedConnectionId: id }),

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

  selectItemsInRect: (rect, additive = false) =>
    set((s) => {
      const matched = new Set<string>();
      for (const item of s.items) {
        if (
          item.x < rect.x + rect.w &&
          item.x + item.width > rect.x &&
          item.y < rect.y + rect.h &&
          item.y + item.height > rect.y
        ) {
          matched.add(item.id);
        }
      }
      if (additive) {
        const next = new Set(s.selectedIds);
        matched.forEach((id) => next.add(id));
        return { selectedIds: next };
      }
      return { selectedIds: matched };
    }),

  selectAll: () => set((s) => ({ selectedIds: new Set(s.items.map((it) => it.id)) })),

  clearSelection: () => set({ selectedIds: new Set() }),

  clipboard: [],

  copyToClipboard: (ids) =>
    set((s) => ({ clipboard: s.items.filter((it) => ids.has(it.id)) })),

  pasteFromClipboard: () => {
    const { clipboard, board, items } = get();
    if (clipboard.length === 0 || !board) return;
    const OFFSET = 32;
    const maxZ = Math.max(...items.map((it) => it.zIndex), 0);
    const newItems = clipboard.map((it, i) => {
      const newId = nanoid();
      return {
        ...it,
        id: newId,
        boardId: board.id,
        x: it.x + OFFSET,
        y: it.y + OFFSET,
        zIndex: maxZ + 1 + i,
        createdAt: Date.now(),
        pins: it.pins.map((p) => ({ ...p, id: nanoid(), itemId: newId })),
      } as Item;
    });
    set((s) => ({
      items: [...s.items, ...newItems],
      past: pushPast(s.past, snapshot(s)),
      future: [],
      selectedIds: new Set(newItems.map((it) => it.id)),
    }));
  },

  mode: "select",
  setMode: (mode) => set({ mode }),

  pendingFromPin: null,
  setPendingFromPin: (pin) => set({ pendingFromPin: pin }),

  // ── History ────────────────────────────────────────────────────────────────

  past: [],
  future: [],

  pushHistory: () =>
    set((s) => ({
      past: pushPast(s.past, snapshot(s)),
      future: [],
    })),

  undo: () =>
    set((s) => {
      if (s.past.length === 0) return s;
      const prev = s.past[s.past.length - 1];
      return {
        ...prev,
        past: s.past.slice(0, -1),
        future: [snapshot(s), ...s.future],
        selectedIds: new Set(), // clear selection to avoid dangling refs
      };
    }),

  redo: () =>
    set((s) => {
      if (s.future.length === 0) return s;
      const next = s.future[0];
      return {
        ...next,
        past: pushPast(s.past, snapshot(s)),
        future: s.future.slice(1),
        selectedIds: new Set(),
      };
    }),
}));
