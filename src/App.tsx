import { useCallback, useEffect, useRef, useState } from "react";
import { useBoardStore } from "./store/boardStore";
import { useAppStore } from "./store/appStore";
import BoardCanvas from "./components/board/BoardCanvas";
import BoardToolbar from "./components/board/BoardToolbar";
import BoardSwitcher from "./components/ui/BoardSwitcher";
import OllamaChat from "./components/ui/OllamaChat";
import OllamaSettings from "./components/ui/OllamaSettings";
import { getAdapter } from "./utils/adapter";
import { nanoid } from "./utils/nanoid";
import type { Board } from "./types/board";

const AUTO_SAVE_DELAY_MS = 1500;

export default function App() {
  const board = useBoardStore((s) => s.board);
  const items = useBoardStore((s) => s.items);
  const connections = useBoardStore((s) => s.connections);
  const viewport = useBoardStore((s) => s.viewport);
  const initBoard = useBoardStore((s) => s.initBoard);
  const updateBoard = useBoardStore((s) => s.updateBoard);
  const selectedIds = useBoardStore((s) => s.selectedIds);
  const removeItem = useBoardStore((s) => s.removeItem);
  const clearSelection = useBoardStore((s) => s.clearSelection);
  const undo = useBoardStore((s) => s.undo);
  const redo = useBoardStore((s) => s.redo);
  const updateAppBoard = useAppStore((s) => s.updateBoard);

  const setBoards = useAppStore((s) => s.setBoards);
  const addBoard = useAppStore((s) => s.addBoard);
  const setActiveBoardId = useAppStore((s) => s.setActiveBoardId);
  const settingsOpen = useAppStore((s) => s.settingsOpen);
  const setSettingsOpen = useAppStore((s) => s.setSettingsOpen);

  const [chatOpen, setChatOpen] = useState(false);
  const [renamingBoard, setRenamingBoard] = useState(false);
  const [renameValue, setRenameValue] = useState("");
  const renameInputRef = useRef<HTMLInputElement>(null);

  const startRename = useCallback(() => {
    if (!board) return;
    setRenameValue(board.name);
    setRenamingBoard(true);
    setTimeout(() => {
      renameInputRef.current?.select();
    }, 0);
  }, [board]);

  const commitRename = useCallback(() => {
    if (!board) return;
    const trimmed = renameValue.trim();
    const name = trimmed || board.name;
    updateBoard({ name });
    updateAppBoard(board.id, { name });
    setRenamingBoard(false);
  }, [board, renameValue, updateBoard, updateAppBoard]);

  const handleRenameKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") commitRename();
      if (e.key === "Escape") setRenamingBoard(false);
    },
    [commitRename],
  );

  // ── Load saved boards on first mount ──────────────────────────────────────
  useEffect(() => {
    (async () => {
      const adapter = await getAdapter();
      let savedBoards = await adapter.listBoards();

      if (savedBoards.length === 0) {
        // First run — create and persist a default board
        const defaultBoard: Board = {
          id: nanoid(),
          name: "My Board",
          createdAt: Date.now(),
          updatedAt: Date.now(),
          backgroundStyle: "cork",
          viewport: { x: 0, y: 0, scale: 1 },
        };
        await adapter.saveBoard(defaultBoard, [], []);
        savedBoards = [defaultBoard];
        addBoard(defaultBoard);
      } else {
        setBoards(savedBoards);
      }

      // Load the most-recently-updated board
      const first = savedBoards[0];
      setActiveBoardId(first.id);
      try {
        const { board: b, items: it, connections: cn } = await adapter.loadBoard(first.id);
        initBoard(b, it, cn);
      } catch {
        initBoard(first, [], []);
      }
    })().catch(console.error);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Keyboard shortcuts ────────────────────────────────────────────────────
  const selectedIdsRef = useRef(selectedIds);
  selectedIdsRef.current = selectedIds;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (document.activeElement as HTMLElement)?.tagName;
      const inInput = tag === "INPUT" || tag === "TEXTAREA";

      // Undo: Cmd+Z (Mac) / Ctrl+Z (Win/Linux)
      if ((e.metaKey || e.ctrlKey) && e.key === "z" && !e.shiftKey) {
        if (inInput) return;
        e.preventDefault();
        undo();
        return;
      }

      // Redo: Cmd+Shift+Z or Cmd+Y
      if (
        ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === "z") ||
        ((e.metaKey || e.ctrlKey) && e.key === "y")
      ) {
        if (inInput) return;
        e.preventDefault();
        redo();
        return;
      }

      // Delete selected items
      if (e.key !== "Delete" && e.key !== "Backspace") return;
      if (inInput) return;
      const ids = selectedIdsRef.current;
      if (ids.size === 0) return;
      e.preventDefault();
      ids.forEach((id) => removeItem(id));
      clearSelection();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [removeItem, clearSelection, undo, redo]);

  // ── Auto-save on changes (debounced) ──────────────────────────────────────
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!board) return;

    // Keep the viewport in sync with the board object so it persists correctly
    const boardWithViewport: Board = { ...board, viewport, updatedAt: Date.now() };

    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      getAdapter()
        .then((adapter) => adapter.saveBoard(boardWithViewport, items, connections))
        .catch(console.error);
    }, AUTO_SAVE_DELAY_MS);

    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [board, items, connections, viewport]);

  if (!board) {
    return (
      <div
        style={{
          width: "100vw",
          height: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#c8a96e",
          fontFamily: "system-ui, sans-serif",
          color: "#5a3e1b",
          fontSize: 18,
        }}
      >
        Loading…
      </div>
    );
  }

  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        overflow: "hidden",
        position: "relative",
      }}
    >
      {/* Board name header — double-click to rename */}
      <div
        onDoubleClick={startRename}
        style={{
          position: "absolute",
          top: 16,
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 100,
          background: "rgba(30,20,10,0.75)",
          backdropFilter: "blur(8px)",
          borderRadius: 8,
          padding: "4px 16px",
          color: "rgba(255,255,255,0.8)",
          fontSize: 13,
          fontFamily: "'Caveat', cursive",
          letterSpacing: 0.5,
          cursor: "default",
          userSelect: "none",
          minWidth: 80,
          textAlign: "center",
        }}
        title="Double-click to rename board"
      >
        {renamingBoard ? (
          <input
            ref={renameInputRef}
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            onBlur={commitRename}
            onKeyDown={handleRenameKeyDown}
            style={{
              background: "transparent",
              border: "none",
              outline: "none",
              color: "rgba(255,255,255,0.95)",
              fontSize: 13,
              fontFamily: "'Caveat', cursive",
              letterSpacing: 0.5,
              width: Math.max(renameValue.length * 9, 60),
              textAlign: "center",
            }}
          />
        ) : (
          board.name
        )}
      </div>

      {/* AI chat button */}
      <button
        onClick={() => setChatOpen((o) => !o)}
        title="Open AI chat (powered by your local Ollama server)"
        style={{
          position: "absolute",
          top: 16,
          right: 16,
          zIndex: 100,
          background: chatOpen
            ? "rgba(255,102,0,0.8)"
            : "rgba(30,20,10,0.75)",
          backdropFilter: "blur(8px)",
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: 10,
          color: "#fff",
          padding: "6px 14px",
          cursor: "pointer",
          fontSize: 13,
          fontFamily: "system-ui, sans-serif",
          display: "flex",
          alignItems: "center",
          gap: 6,
        }}
      >
        🤖 AI
      </button>

      <BoardCanvas />
      <BoardToolbar />
      <BoardSwitcher />

      {chatOpen && <OllamaChat onClose={() => setChatOpen(false)} />}
      {settingsOpen && <OllamaSettings onClose={() => setSettingsOpen(false)} />}
    </div>
  );
}
