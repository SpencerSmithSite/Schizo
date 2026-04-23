import type { Board } from "../types/board";
import type { NoteItem } from "../types/items";
import type { Connection } from "../types/connections";
import { nanoid } from "./nanoid";

/**
 * Builds a pre-populated welcome board shown on first run.
 * Five sticky notes arranged in a hub-and-spoke layout with red yarn connections.
 */
export function buildOnboardingBoard(): {
  board: Board;
  items: NoteItem[];
  connections: Connection[];
} {
  const boardId = nanoid();
  const now = Date.now();

  function makeNote(
    x: number,
    y: number,
    w: number,
    h: number,
    rotation: number,
    content: string,
    color: string,
    z: number,
  ): NoteItem {
    const id = nanoid();
    return {
      id,
      boardId,
      type: "note",
      x,
      y,
      width: w,
      height: h,
      rotation,
      zIndex: z,
      createdAt: now,
      content,
      color,
      fontSize: 14,
      pins: [
        { id: nanoid(), itemId: id, offsetX: -0.5, offsetY: -0.5 },
        { id: nanoid(), itemId: id, offsetX: 0.5, offsetY: -0.5 },
        { id: nanoid(), itemId: id, offsetX: 0, offsetY: -0.5 },
        { id: nanoid(), itemId: id, offsetX: -0.5, offsetY: 0.5 },
        { id: nanoid(), itemId: id, offsetX: 0.5, offsetY: 0.5 },
      ],
    };
  }

  const center = makeNote(
    -100, -110,
    200, 220,
    -1.5,
    "Welcome to Schizo!\n\nYour private, offline corkboard. Pin notes, links, and videos to the canvas and connect them with string.",
    "#fef08a",
    10,
  );

  const shortcuts = makeNote(
    -360, -180,
    170, 160,
    2.0,
    "Shortcuts\n\nN — add note\nL — add link\nV — add video\nC — connect mode\nDel — delete selected\n⌘Z — undo",
    "#86efac",
    9,
  );

  const connections_ = makeNote(
    200, -180,
    170, 150,
    -2.5,
    "Connect items\n\nPress C or click Connect in the toolbar, then drag from one pin ● to another.\n\nClick a string to change its style.",
    "#93c5fd",
    9,
  );

  const boards = makeNote(
    -360, 80,
    170, 130,
    1.5,
    "Multiple boards\n\nOpen the sidebar (≡) to create boards for different topics.\n\n⌘K searches across all boards.",
    "#fca5a5",
    9,
  );

  const privacy = makeNote(
    200, 80,
    170, 130,
    -1.0,
    "100% private\n\nAll data lives in a local SQLite file on your machine. No cloud. No accounts. Open source.",
    "#d8b4fe",
    9,
  );

  const items = [center, shortcuts, connections_, boards, privacy];

  function connect(fromNote: NoteItem, toNote: NoteItem, color: string): Connection {
    return {
      id: nanoid(),
      boardId,
      fromPinId: fromNote.pins[3].id, // bottom-left pin of fromNote
      toPinId: toNote.pins[1].id,     // top-right pin of toNote
      style: { color, thickness: 2, texture: "yarn", slack: 0.35 },
      createdAt: now,
    };
  }

  const connections: Connection[] = [
    connect(center, shortcuts, "#cc2200"),
    connect(center, connections_, "#cc5500"),
    connect(center, boards, "#007acc"),
    connect(center, privacy, "#7c3aed"),
  ];

  const board: Board = {
    id: boardId,
    name: "Welcome Board",
    createdAt: now,
    updatedAt: now,
    backgroundStyle: "cork",
    viewport: { x: 200, y: 280, scale: 1 },
  };

  return { board, items, connections };
}
