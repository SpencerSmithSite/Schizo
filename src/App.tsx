import { useEffect, useRef, useState } from "react";
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

  const setBoards = useAppStore((s) => s.setBoards);
  const addBoard = useAppStore((s) => s.addBoard);
  const setActiveBoardId = useAppStore((s) => s.setActiveBoardId);
  const settingsOpen = useAppStore((s) => s.settingsOpen);
  const setSettingsOpen = useAppStore((s) => s.setSettingsOpen);

  const [chatOpen, setChatOpen] = useState(false);

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
      {/* Board name header */}
      <div
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
          pointerEvents: "none",
        }}
      >
        {board.name}
      </div>

      {/* AI chat button */}
      <button
        onClick={() => setChatOpen((o) => !o)}
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
