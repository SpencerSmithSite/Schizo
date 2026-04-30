import { useCallback, useState } from "react";
import { useBoardStore } from "../../store/boardStore";
import { useAppStore } from "../../store/appStore";

import { nanoid } from "../../utils/nanoid";
import type { NoteItem, VideoItem } from "../../types/items";
import { exportBoardAsPng } from "../../utils/exportPng";
import { createSubBoardPortal } from "../../utils/boardNavigation";

const TOOLBAR_BUTTON = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: 40,
  height: 40,
  borderRadius: 8,
  border: "none",
  cursor: "pointer",
  fontSize: 18,
  transition: "background 0.15s, transform 0.1s",
  flexShrink: 0,
} as const;

function makeDefaultPins(itemId: string) {
  return [
    { id: nanoid(), itemId, offsetX: -0.5, offsetY: -0.5 },
    { id: nanoid(), itemId, offsetX: 0.5, offsetY: -0.5 },
    { id: nanoid(), itemId, offsetX: 0, offsetY: -0.5 },
    { id: nanoid(), itemId, offsetX: -0.5, offsetY: 0.5 },
    { id: nanoid(), itemId, offsetX: 0.5, offsetY: 0.5 },
  ];
}

export default function BoardToolbar() {
  const mode = useBoardStore((s) => s.mode);
  const setMode = useBoardStore((s) => s.setMode);
  const addItem = useBoardStore((s) => s.addItem);
  const board = useBoardStore((s) => s.board);
  const viewport = useBoardStore((s) => s.viewport);
  const setSettingsOpen = useAppStore((s) => s.setSettingsOpen);
  const setSearchOpen = useAppStore((s) => s.setSearchOpen);
  const setSidebarOpen = useAppStore((s) => s.setSidebarOpen);
  const sidebarOpen = useAppStore((s) => s.sidebarOpen);
  const fitToContent = useBoardStore((s) => s.fitToContent);
  const [exporting, setExporting] = useState(false);

  const addNote = useCallback(() => {
    if (!board) return;
    const id = nanoid();
    // Place new note near the center of the current viewport
    const centerX = (window.innerWidth / 2 - viewport.x) / viewport.scale - 80;
    const centerY =
      (window.innerHeight / 2 - viewport.y) / viewport.scale - 80;

    const note: NoteItem = {
      id,
      boardId: board.id,
      type: "note",
      x: centerX + (Math.random() - 0.5) * 60,
      y: centerY + (Math.random() - 0.5) * 60,
      width: 160,
      height: 160,
      rotation: (Math.random() - 0.5) * 6,
      zIndex: Date.now(),
      createdAt: Date.now(),
      content: "",
      color: "#fef08a",
      fontSize: 16,
      pins: makeDefaultPins(id),
    };
    addItem(note);
  }, [addItem, board, viewport]);

  const addVideo = useCallback(() => {
    if (!board) return;
    const url = window.prompt("Enter YouTube or Vimeo URL:");
    if (!url) return;
    const id = nanoid();
    const centerX = (window.innerWidth / 2 - viewport.x) / viewport.scale - 160;
    const centerY = (window.innerHeight / 2 - viewport.y) / viewport.scale - 90;
    const video: VideoItem = {
      id,
      boardId: board.id,
      type: "video",
      x: centerX + (Math.random() - 0.5) * 60,
      y: centerY + (Math.random() - 0.5) * 60,
      width: 320,
      height: 180,
      rotation: (Math.random() - 0.5) * 3,
      zIndex: Date.now(),
      createdAt: Date.now(),
      url,
      startTime: 0,
      pins: makeDefaultPins(id),
    };
    addItem(video);
  }, [addItem, board, viewport]);

  const addLink = useCallback(async () => {
    if (!board) return;
    const url = window.prompt("Enter URL:");
    if (!url) return;

    const id = nanoid();
    const centerX = (window.innerWidth / 2 - viewport.x) / viewport.scale - 100;
    const centerY =
      (window.innerHeight / 2 - viewport.y) / viewport.scale - 75;

    addItem({
      id,
      boardId: board.id,
      type: "link",
      x: centerX + (Math.random() - 0.5) * 60,
      y: centerY + (Math.random() - 0.5) * 60,
      width: 220,
      height: 150,
      rotation: (Math.random() - 0.5) * 4,
      zIndex: Date.now(),
      createdAt: Date.now(),
      url,
      title: url,
      pins: makeDefaultPins(id),
    });
  }, [addItem, board, viewport]);

  const addSubBoard = useCallback(async () => {
    if (!board) return;
    const name = window.prompt("Sub-board name:");
    if (!name?.trim()) return;
    const cx = (window.innerWidth / 2 - viewport.x) / viewport.scale - 80;
    const cy = (window.innerHeight / 2 - viewport.y) / viewport.scale - 65;
    await createSubBoardPortal(
      name.trim(),
      cx + (Math.random() - 0.5) * 60,
      cy + (Math.random() - 0.5) * 60,
    );
  }, [board, viewport]);

  const handleExport = useCallback(async () => {
    if (exporting || !board) return;
    setExporting(true);
    try {
      await exportBoardAsPng(board.name);
    } catch (err) {
      console.error("Export failed:", err);
    } finally {
      setExporting(false);
    }
  }, [board, exporting]);

  const tools = [
    {
      icon: "🖱️",
      label: "Select",
      value: "select" as const,
      title: "Select & move items",
    },
    {
      icon: "🔗",
      label: "Connect",
      value: "connect" as const,
      title: "Connect items with string",
    },
    {
      icon: "✋",
      label: "Pan",
      value: "pan" as const,
      title: "Pan the board",
    },
  ];

  return (
    <div
      style={{
        position: "absolute",
        bottom: 24,
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 100,
        display: "flex",
        alignItems: "center",
        gap: 6,
        background: "rgba(30,20,10,0.88)",
        backdropFilter: "blur(12px)",
        borderRadius: 14,
        padding: "8px 12px",
        boxShadow: "0 4px 24px rgba(0,0,0,0.4)",
        border: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      {/* Board switcher */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        style={{
          ...TOOLBAR_BUTTON,
          background: sidebarOpen
            ? "rgba(255,255,255,0.15)"
            : "transparent",
          color: "#fff",
        }}
        title="Boards"
      >
        📋
      </button>

      <div
        style={{
          width: 1,
          height: 28,
          background: "rgba(255,255,255,0.12)",
          margin: "0 2px",
        }}
      />

      {/* Mode tools */}
      {tools.map((t) => (
        <button
          key={t.value}
          onClick={() => setMode(t.value)}
          style={{
            ...TOOLBAR_BUTTON,
            background:
              mode === t.value
                ? "rgba(255,255,255,0.18)"
                : "transparent",
            color: "#fff",
            boxShadow:
              mode === t.value
                ? "inset 0 1px 0 rgba(255,255,255,0.1)"
                : "none",
          }}
          title={t.title}
        >
          {t.icon}
        </button>
      ))}

      <div
        style={{
          width: 1,
          height: 28,
          background: "rgba(255,255,255,0.12)",
          margin: "0 2px",
        }}
      />

      {/* Add items */}
      <button
        onClick={addNote}
        style={{ ...TOOLBAR_BUTTON, background: "transparent", color: "#fff" }}
        title="Add note (N)"
      >
        📝
      </button>

      <button
        onClick={addLink}
        style={{ ...TOOLBAR_BUTTON, background: "transparent", color: "#fff" }}
        title="Add link (L)"
      >
        🔗
      </button>

      <button
        onClick={addVideo}
        style={{ ...TOOLBAR_BUTTON, background: "transparent", color: "#fff" }}
        title="Add video (V) — YouTube or Vimeo"
      >
        🎬
      </button>

      <button
        onClick={addSubBoard}
        style={{ ...TOOLBAR_BUTTON, background: "transparent", color: "#fff" }}
        title="Create sub-board portal (B)"
      >
        🗂️
      </button>

      <div
        style={{
          width: 1,
          height: 28,
          background: "rgba(255,255,255,0.12)",
          margin: "0 2px",
        }}
      />

      {/* Fit to view */}
      <button
        onClick={() => fitToContent(window.innerWidth, window.innerHeight)}
        style={{ ...TOOLBAR_BUTTON, background: "transparent", color: "#fff" }}
        title="Fit all items in view (F)"
      >
        ⊡
      </button>

      {/* Export as PNG */}
      <button
        onClick={handleExport}
        disabled={exporting}
        style={{
          ...TOOLBAR_BUTTON,
          background: "transparent",
          color: exporting ? "rgba(255,255,255,0.4)" : "#fff",
          cursor: exporting ? "not-allowed" : "pointer",
        }}
        title="Export board as PNG"
      >
        {exporting ? "⏳" : "🖼️"}
      </button>

      {/* Search */}
      <button
        onClick={() => setSearchOpen(true)}
        style={{ ...TOOLBAR_BUTTON, background: "transparent", color: "#fff" }}
        title="Search all boards (⌘K)"
      >
        🔍
      </button>

      {/* Settings */}
      <button
        onClick={() => setSettingsOpen(true)}
        style={{ ...TOOLBAR_BUTTON, background: "transparent", color: "#fff" }}
        title="Settings"
      >
        ⚙️
      </button>
    </div>
  );
}
