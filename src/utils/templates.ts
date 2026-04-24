import type { NoteItem } from "../types/items";
import type { Connection } from "../types/connections";
import type { Viewport } from "../types/board";
import { nanoid } from "./nanoid";

export type TemplateId = "empty" | "cold-case" | "research" | "mood-board";

export interface TemplateResult {
  items: NoteItem[];
  connections: Connection[];
  viewport: Viewport;
}

function makeNote(
  boardId: string,
  now: number,
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

function conn(
  boardId: string,
  now: number,
  from: NoteItem,
  to: NoteItem,
  color: string,
  texture: "yarn" | "thread" | "wire" | "rope",
  thickness = 2,
  slack = 0.3,
): Connection {
  return {
    id: nanoid(),
    boardId,
    fromPinId: from.pins[4].id, // bottom-right pin
    toPinId: to.pins[2].id,     // top-center pin
    style: { color, thickness, texture, slack },
    createdAt: now,
  };
}

// ── Cold Case ────────────────────────────────────────────────────────────────

export function buildColdCaseTemplate(boardId: string): TemplateResult {
  const now = Date.now();
  const n = (x: number, y: number, w: number, h: number, rot: number, text: string, color: string, z: number) =>
    makeNote(boardId, now, x, y, w, h, rot, text, color, z);

  const subject  = n(-110, -130, 220, 160, -1.5, "THE CASE\n\nSubject: ???\n\nReplace this with your case details. Connect the evidence.", "#fca5a5", 10);
  const suspect  = n(-380, -200, 170, 140, 2.0,  "SUSPECT\n\nName:\nAlibi:\nMotive:", "#fee2e2", 9);
  const evidence = n( 210, -200, 165, 140, -2.0, "EVIDENCE\n\nItem 1:\nItem 2:\nItem 3:", "#fef08a", 9);
  const timeline = n(-380,  80,  170, 130, 1.5,  "TIMELINE\n\n00:00 —\n01:00 —\n02:00 —", "#fed7aa", 9);
  const motive   = n( 210,  80,  165, 130, -1.0, "MOTIVE\n\nTheory:\n\nSupporting facts:", "#fde68a", 9);

  const items = [subject, suspect, evidence, timeline, motive];
  const connections: Connection[] = [
    conn(boardId, now, subject, suspect,  "#cc2200", "yarn", 2, 0.35),
    conn(boardId, now, subject, evidence, "#cc2200", "yarn", 2, 0.35),
    conn(boardId, now, subject, timeline, "#cc4400", "yarn", 2, 0.35),
    conn(boardId, now, subject, motive,   "#cc4400", "yarn", 2, 0.35),
  ];

  return { items, connections, viewport: { x: 220, y: 300, scale: 1 } };
}

// ── Research ─────────────────────────────────────────────────────────────────

export function buildResearchTemplate(boardId: string): TemplateResult {
  const now = Date.now();
  const n = (x: number, y: number, w: number, h: number, rot: number, text: string, color: string, z: number) =>
    makeNote(boardId, now, x, y, w, h, rot, text, color, z);

  const question  = n(-110, -130, 220, 160, -1.0, "RESEARCH QUESTION\n\nWhat are you trying to find out?\n\nHypothesis:", "#93c5fd", 10);
  const background = n(-380, -200, 165, 140,  2.0, "BACKGROUND\n\nContext:\n\nPrior work:", "#bfdbfe", 9);
  const sources    = n( 210, -200, 165, 140, -2.0, "SOURCES\n\n1.\n2.\n3.", "#86efac", 9);
  const findings   = n(-380,  80,  165, 130,  1.5, "KEY FINDINGS\n\nFinding 1:\nFinding 2:", "#fef08a", 9);
  const gaps       = n( 210,  80,  165, 130, -1.0, "OPEN QUESTIONS\n\nWhat's still unclear?\n\nNext steps:", "#d8b4fe", 9);

  const items = [question, background, sources, findings, gaps];
  const connections: Connection[] = [
    conn(boardId, now, question, background, "#3b82f6", "wire", 2, 0.2),
    conn(boardId, now, question, sources,    "#3b82f6", "wire", 2, 0.2),
    conn(boardId, now, question, findings,   "#3b82f6", "wire", 2, 0.2),
    conn(boardId, now, question, gaps,       "#6366f1", "wire", 2, 0.2),
  ];

  return { items, connections, viewport: { x: 220, y: 300, scale: 1 } };
}

// ── Mood Board ────────────────────────────────────────────────────────────────

export function buildMoodBoardTemplate(boardId: string): TemplateResult {
  const now = Date.now();
  const n = (x: number, y: number, w: number, h: number, rot: number, text: string, color: string, z: number) =>
    makeNote(boardId, now, x, y, w, h, rot, text, color, z);

  const theme      = n(-110, -130, 220, 160, -1.0, "THEME\n\nCapture your concept here.\n\nAdjective 1:\nAdjective 2:\nAdjective 3:", "#f9a8d4", 10);
  const colors     = n(-380, -200, 165, 140,  2.5, "COLORS\n\nPrimary:\nSecondary:\nAccent:", "#fef08a", 9);
  const inspiration = n(210, -200, 165, 140, -2.0, "INSPIRATION\n\nReferences:\n\nArtist / Source:", "#bfdbfe", 9);
  const style      = n(-380,  80,  165, 130,  1.5, "STYLE\n\nTypography:\nTexture:\nShape language:", "#86efac", 9);
  const feeling    = n( 210,  80,  165, 130, -1.5, "FEELING\n\nEmotion to evoke:\n\nAudience:", "#c4b5fd", 9);

  const items = [theme, colors, inspiration, style, feeling];
  const connections: Connection[] = [
    conn(boardId, now, theme, colors,      "#ec4899", "thread", 1.5, 0.4),
    conn(boardId, now, theme, inspiration, "#ec4899", "thread", 1.5, 0.4),
    conn(boardId, now, theme, style,       "#a855f7", "thread", 1.5, 0.4),
    conn(boardId, now, theme, feeling,     "#a855f7", "thread", 1.5, 0.4),
  ];

  return { items, connections, viewport: { x: 220, y: 300, scale: 1 } };
}

// ── Dispatcher ───────────────────────────────────────────────────────────────

export function buildTemplate(id: TemplateId, boardId: string): TemplateResult {
  switch (id) {
    case "cold-case":    return buildColdCaseTemplate(boardId);
    case "research":     return buildResearchTemplate(boardId);
    case "mood-board":   return buildMoodBoardTemplate(boardId);
    case "empty":
    default:
      return { items: [], connections: [], viewport: { x: 0, y: 0, scale: 1 } };
  }
}
