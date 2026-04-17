import { useCallback } from "react";
import { useAppStore } from "../../store/appStore";
import { useBoardStore } from "../../store/boardStore";
import { getAdapter } from "../../utils/adapter";
import { nanoid } from "../../utils/nanoid";
import type { Board } from "../../types/board";

export default function BoardSwitcher() {
  const boards = useAppStore((s) => s.boards);
  const activeBoardId = useAppStore((s) => s.activeBoardId);
  const addBoard = useAppStore((s) => s.addBoard);
  const removeBoard = useAppStore((s) => s.removeBoard);
  const setActiveBoardId = useAppStore((s) => s.setActiveBoardId);
  const sidebarOpen = useAppStore((s) => s.sidebarOpen);
  const setSidebarOpen = useAppStore((s) => s.setSidebarOpen);
  const initBoard = useBoardStore((s) => s.initBoard);
  const board = useBoardStore((s) => s.board);
  const items = useBoardStore((s) => s.items);
  const connections = useBoardStore((s) => s.connections);
  const viewport = useBoardStore((s) => s.viewport);

  const createBoard = useCallback(async () => {
    const name = window.prompt("Board name:", "New Board");
    if (!name) return;
    const newBoard: Board = {
      id: nanoid(),
      name,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      backgroundStyle: "cork",
      viewport: { x: 0, y: 0, scale: 1 },
    };
    const adapter = await getAdapter();
    // Save current board before switching away
    if (board) {
      await adapter
        .saveBoard({ ...board, viewport, updatedAt: Date.now() }, items, connections)
        .catch(console.error);
    }
    await adapter.saveBoard(newBoard, [], []).catch(console.error);
    addBoard(newBoard);
    setActiveBoardId(newBoard.id);
    initBoard(newBoard, [], []);
  }, [addBoard, board, connections, initBoard, items, setActiveBoardId, viewport]);

  const switchBoard = useCallback(
    async (target: Board) => {
      if (target.id === activeBoardId) {
        setSidebarOpen(false);
        return;
      }
      const adapter = await getAdapter();
      // Persist current board state before switching
      if (board) {
        await adapter
          .saveBoard({ ...board, viewport, updatedAt: Date.now() }, items, connections)
          .catch(console.error);
      }
      setActiveBoardId(target.id);
      try {
        const { board: b, items: it, connections: cn } = await adapter.loadBoard(target.id);
        initBoard(b, it, cn);
      } catch {
        initBoard(target, [], []);
      }
      setSidebarOpen(false);
    },
    [activeBoardId, board, connections, initBoard, items, setActiveBoardId, setSidebarOpen, viewport],
  );

  const deleteBoard = useCallback(
    async (id: string, name: string) => {
      if (!window.confirm(`Delete board "${name}"?`)) return;
      const adapter = await getAdapter();
      await adapter.deleteBoard(id).catch(console.error);
      removeBoard(id);
    },
    [removeBoard],
  );

  if (!sidebarOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={() => setSidebarOpen(false)}
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 200,
          background: "rgba(0,0,0,0.3)",
        }}
      />
      {/* Sidebar */}
      <div
        style={{
          position: "fixed",
          left: 0,
          top: 0,
          bottom: 0,
          width: 260,
          zIndex: 201,
          background: "rgba(25,18,10,0.95)",
          backdropFilter: "blur(20px)",
          borderRight: "1px solid rgba(255,255,255,0.08)",
          display: "flex",
          flexDirection: "column",
          padding: "16px 0",
        }}
      >
        <div
          style={{
            padding: "0 16px 12px",
            borderBottom: "1px solid rgba(255,255,255,0.08)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <span
            style={{
              color: "#fff",
              fontWeight: 600,
              fontSize: 15,
              fontFamily: "system-ui, sans-serif",
            }}
          >
            Boards
          </span>
          <button
            onClick={createBoard}
            title="Create a new board"
            style={{
              background: "rgba(255,255,255,0.1)",
              border: "none",
              borderRadius: 6,
              color: "#fff",
              padding: "4px 10px",
              cursor: "pointer",
              fontSize: 12,
              fontFamily: "system-ui, sans-serif",
            }}
          >
            + New
          </button>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "8px 0" }}>
          {boards.length === 0 && (
            <div
              style={{
                color: "rgba(255,255,255,0.35)",
                fontSize: 13,
                textAlign: "center",
                marginTop: 24,
                fontFamily: "system-ui, sans-serif",
              }}
            >
              No boards yet.
              <br />
              Create one to get started.
            </div>
          )}
          {boards.map((b) => (
            <div
              key={b.id}
              onClick={() => switchBoard(b)}
              style={{
                padding: "10px 16px",
                cursor: "pointer",
                background:
                  b.id === activeBoardId
                    ? "rgba(255,255,255,0.1)"
                    : "transparent",
                borderLeft:
                  b.id === activeBoardId
                    ? "3px solid #ff6600"
                    : "3px solid transparent",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                transition: "background 0.15s",
              }}
            >
              <span
                style={{
                  color: "#fff",
                  fontSize: 14,
                  fontFamily: "system-ui, sans-serif",
                }}
              >
                {b.name}
              </span>
              {b.id !== activeBoardId && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteBoard(b.id, b.name);
                  }}
                  title="Delete this board"
                  style={{
                    background: "none",
                    border: "none",
                    color: "rgba(255,255,255,0.3)",
                    cursor: "pointer",
                    fontSize: 14,
                    padding: 2,
                  }}
                >
                  ×
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
