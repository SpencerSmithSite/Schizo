import { useCallback, useEffect, useRef, useState } from "react";
import { useBoardStore } from "./store/boardStore";
import { useAppStore } from "./store/appStore";
import BoardCanvas from "./components/board/BoardCanvas";
import BoardToolbar from "./components/board/BoardToolbar";
import BoardSwitcher from "./components/ui/BoardSwitcher";
import ConnectionStylePanel from "./components/board/ConnectionStylePanel";
import OllamaChat from "./components/ui/OllamaChat";
import OllamaSettings from "./components/ui/OllamaSettings";
import SearchPanel from "./components/ui/SearchPanel";
import { getAdapter } from "./utils/adapter";
import { nanoid } from "./utils/nanoid";
import { buildOnboardingBoard } from "./utils/onboarding";
import { navigateBack, createSubBoardPortal } from "./utils/boardNavigation";
import type { Board } from "./types/board";
import type { NoteItem, LinkItem, VideoItem } from "./types/items";

const AUTO_SAVE_DELAY_MS = 1500;

export default function App() {
  const board = useBoardStore((s) => s.board);
  const items = useBoardStore((s) => s.items);
  const connections = useBoardStore((s) => s.connections);
  const viewport = useBoardStore((s) => s.viewport);
  const initBoard = useBoardStore((s) => s.initBoard);
  const updateBoard = useBoardStore((s) => s.updateBoard);
  const selectedIds = useBoardStore((s) => s.selectedIds);
  const addItem = useBoardStore((s) => s.addItem);
  const removeItem = useBoardStore((s) => s.removeItem);
  const clearSelection = useBoardStore((s) => s.clearSelection);
  const setMode = useBoardStore((s) => s.setMode);
  const undo = useBoardStore((s) => s.undo);
  const redo = useBoardStore((s) => s.redo);
  const selectAll = useBoardStore((s) => s.selectAll);
  const copyToClipboard = useBoardStore((s) => s.copyToClipboard);
  const pasteFromClipboard = useBoardStore((s) => s.pasteFromClipboard);
  const fitToContent = useBoardStore((s) => s.fitToContent);
  const removeConnection = useBoardStore((s) => s.removeConnection);
  const setSelectedConnection = useBoardStore((s) => s.setSelectedConnection);
  const updateAppBoard = useAppStore((s) => s.updateBoard);

  const setBoards = useAppStore((s) => s.setBoards);
  const addBoard = useAppStore((s) => s.addBoard);
  const setActiveBoardId = useAppStore((s) => s.setActiveBoardId);
  const settingsOpen = useAppStore((s) => s.settingsOpen);
  const setSettingsOpen = useAppStore((s) => s.setSettingsOpen);
  const searchOpen = useAppStore((s) => s.searchOpen);
  const setSearchOpen = useAppStore((s) => s.setSearchOpen);
  const boardNavStack = useAppStore((s) => s.boardNavStack);
  const allBoards = useAppStore((s) => s.boards);
  const parentBoardName = boardNavStack.length > 0
    ? (allBoards.find((b) => b.id === boardNavStack[boardNavStack.length - 1])?.name ?? "Back")
    : null;

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
        // First run — seed the app with a pre-populated welcome board
        const { board: defaultBoard, items: defaultItems, connections: defaultConnections } =
          buildOnboardingBoard();
        await adapter.saveBoard(defaultBoard, defaultItems, defaultConnections);
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

      // Undo: Cmd+Z / Ctrl+Z
      if ((e.metaKey || e.ctrlKey) && e.key === "z" && !e.shiftKey) {
        if (inInput) return;
        e.preventDefault();
        undo();
        return;
      }

      // Redo: Cmd+Shift+Z / Ctrl+Y
      if (
        ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === "z") ||
        ((e.metaKey || e.ctrlKey) && e.key === "y")
      ) {
        if (inInput) return;
        e.preventDefault();
        redo();
        return;
      }

      // Cmd+K / Ctrl+K — open search
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen(true);
        return;
      }

      // Cmd+A / Ctrl+A — select all items
      if ((e.metaKey || e.ctrlKey) && e.key === "a") {
        if (inInput) return;
        e.preventDefault();
        selectAll();
        return;
      }

      // Cmd+C / Ctrl+C — copy selected items
      if ((e.metaKey || e.ctrlKey) && e.key === "c") {
        if (inInput) return;
        e.preventDefault();
        copyToClipboard(selectedIdsRef.current);
        return;
      }

      // Cmd+V / Ctrl+V — paste clipboard
      if ((e.metaKey || e.ctrlKey) && e.key === "v") {
        if (inInput) return;
        e.preventDefault();
        pasteFromClipboard();
        return;
      }

      // Skip remaining shortcuts when a modifier is held or focus is in an input
      if (e.metaKey || e.ctrlKey || e.altKey || inInput) return;

      // N — add note
      if (e.key === "n" || e.key === "N") {
        e.preventDefault();
        const { board, viewport } = useBoardStore.getState();
        if (!board) return;
        const id = nanoid();
        const cx = (window.innerWidth / 2 - viewport.x) / viewport.scale - 80;
        const cy = (window.innerHeight / 2 - viewport.y) / viewport.scale - 80;
        const note: NoteItem = {
          id,
          boardId: board.id,
          type: "note",
          x: cx + (Math.random() - 0.5) * 60,
          y: cy + (Math.random() - 0.5) * 60,
          width: 160,
          height: 160,
          rotation: (Math.random() - 0.5) * 6,
          zIndex: Date.now(),
          createdAt: Date.now(),
          content: "",
          color: "#fef08a",
          fontSize: 16,
          pins: [
            { id: nanoid(), itemId: id, offsetX: -0.5, offsetY: -0.5 },
            { id: nanoid(), itemId: id, offsetX: 0.5, offsetY: -0.5 },
            { id: nanoid(), itemId: id, offsetX: 0, offsetY: -0.5 },
            { id: nanoid(), itemId: id, offsetX: -0.5, offsetY: 0.5 },
            { id: nanoid(), itemId: id, offsetX: 0.5, offsetY: 0.5 },
          ],
        };
        addItem(note);
        return;
      }

      // L — add link
      if (e.key === "l" || e.key === "L") {
        e.preventDefault();
        const { board, viewport } = useBoardStore.getState();
        if (!board) return;
        const url = window.prompt("Enter URL:");
        if (!url) return;
        const id = nanoid();
        const cx = (window.innerWidth / 2 - viewport.x) / viewport.scale - 110;
        const cy = (window.innerHeight / 2 - viewport.y) / viewport.scale - 75;
        const link: LinkItem = {
          id,
          boardId: board.id,
          type: "link",
          x: cx + (Math.random() - 0.5) * 60,
          y: cy + (Math.random() - 0.5) * 60,
          width: 220,
          height: 150,
          rotation: (Math.random() - 0.5) * 4,
          zIndex: Date.now(),
          createdAt: Date.now(),
          url,
          title: url,
          pins: [
            { id: nanoid(), itemId: id, offsetX: -0.5, offsetY: -0.5 },
            { id: nanoid(), itemId: id, offsetX: 0.5, offsetY: -0.5 },
            { id: nanoid(), itemId: id, offsetX: 0, offsetY: -0.5 },
            { id: nanoid(), itemId: id, offsetX: -0.5, offsetY: 0.5 },
            { id: nanoid(), itemId: id, offsetX: 0.5, offsetY: 0.5 },
          ],
        };
        addItem(link);
        // Async fetch metadata and update the card once resolved
        getAdapter()
          .then((adapter) => adapter.fetchLinkPreview(url))
          .then((preview) => {
            useBoardStore.getState().updateItem(id, {
              title: preview.title || url,
              description: preview.description,
              faviconUrl: preview.faviconUrl,
              previewImageUrl: preview.previewImageUrl,
              fetchedAt: Date.now(),
            } as Partial<LinkItem>);
          })
          .catch(() => {/* silently ignore — card already shows the URL */});
        return;
      }

      // V — add video
      if (e.key === "v" || e.key === "V") {
        e.preventDefault();
        const { board, viewport } = useBoardStore.getState();
        if (!board) return;
        const url = window.prompt("Enter YouTube or Vimeo URL:");
        if (!url) return;
        const id = nanoid();
        const cx = (window.innerWidth / 2 - viewport.x) / viewport.scale - 160;
        const cy = (window.innerHeight / 2 - viewport.y) / viewport.scale - 90;
        const video: VideoItem = {
          id,
          boardId: board.id,
          type: "video",
          x: cx + (Math.random() - 0.5) * 60,
          y: cy + (Math.random() - 0.5) * 60,
          width: 320,
          height: 180,
          rotation: (Math.random() - 0.5) * 3,
          zIndex: Date.now(),
          createdAt: Date.now(),
          url,
          startTime: 0,
          pins: [
            { id: nanoid(), itemId: id, offsetX: -0.5, offsetY: -0.5 },
            { id: nanoid(), itemId: id, offsetX: 0.5, offsetY: -0.5 },
            { id: nanoid(), itemId: id, offsetX: 0, offsetY: -0.5 },
            { id: nanoid(), itemId: id, offsetX: -0.5, offsetY: 0.5 },
            { id: nanoid(), itemId: id, offsetX: 0.5, offsetY: 0.5 },
          ],
        };
        addItem(video);
        return;
      }

      // B — create sub-board portal
      if (e.key === "b" || e.key === "B") {
        e.preventDefault();
        const { board, viewport } = useBoardStore.getState();
        if (!board) return;
        const name = window.prompt("Sub-board name:");
        if (!name?.trim()) return;
        const cx = (window.innerWidth / 2 - viewport.x) / viewport.scale - 80;
        const cy = (window.innerHeight / 2 - viewport.y) / viewport.scale - 65;
        createSubBoardPortal(
          name.trim(),
          cx + (Math.random() - 0.5) * 60,
          cy + (Math.random() - 0.5) * 60,
        ).catch(console.error);
        return;
      }

      // F — fit all items in view
      if (e.key === "f" || e.key === "F") {
        e.preventDefault();
        fitToContent(window.innerWidth, window.innerHeight);
        return;
      }

      // C — connect mode toggle
      if (e.key === "c" || e.key === "C") {
        e.preventDefault();
        const { mode } = useBoardStore.getState();
        setMode(mode === "connect" ? "select" : "connect");
        return;
      }

      // Escape — back to select mode, deselect connection
      if (e.key === "Escape") {
        setMode("select");
        setSelectedConnection(null);
        return;
      }

      // Delete / Backspace — remove selected items or selected connection
      if (e.key !== "Delete" && e.key !== "Backspace") return;
      e.preventDefault();
      const { selectedConnectionId } = useBoardStore.getState();
      if (selectedConnectionId) {
        removeConnection(selectedConnectionId);
        setSelectedConnection(null);
        return;
      }
      const ids = selectedIdsRef.current;
      if (ids.size === 0) return;
      ids.forEach((id) => removeItem(id));
      clearSelection();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [addItem, removeItem, clearSelection, setMode, undo, redo, selectAll, copyToClipboard, pasteFromClipboard, removeConnection, setSelectedConnection, setSearchOpen, fitToContent]);

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
      {/* Back breadcrumb — shown when navigated into a sub-board */}
      {parentBoardName && (
        <button
          onClick={() => navigateBack().catch(console.error)}
          title={`Back to "${parentBoardName}"`}
          style={{
            position: "absolute",
            top: 16,
            left: 16,
            zIndex: 100,
            background: "rgba(30,20,10,0.75)",
            backdropFilter: "blur(8px)",
            border: "1px solid rgba(255,140,40,0.25)",
            borderRadius: 8,
            color: "rgba(255,200,140,0.85)",
            padding: "5px 12px",
            cursor: "pointer",
            fontSize: 13,
            fontFamily: "system-ui, sans-serif",
            display: "flex",
            alignItems: "center",
            gap: 5,
          }}
        >
          ← {parentBoardName}
        </button>
      )}

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
      <ConnectionStylePanel />

      {chatOpen && <OllamaChat onClose={() => setChatOpen(false)} />}
      {settingsOpen && <OllamaSettings onClose={() => setSettingsOpen(false)} />}
      {searchOpen && <SearchPanel />}
    </div>
  );
}
