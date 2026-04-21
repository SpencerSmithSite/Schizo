import { useCallback, useEffect, useRef, useState } from "react";
import { useAppStore } from "../../store/appStore";
import { useBoardStore } from "../../store/boardStore";
import { getAdapter } from "../../utils/adapter";
import { searchAllBoards, type SearchResult } from "../../utils/search";

const ITEM_ICONS: Record<string, string> = {
  note: "📝",
  link: "🔗",
  image: "🖼️",
  screenshot: "📸",
  video: "🎬",
};

export default function SearchPanel() {
  const setSearchOpen = useAppStore((s) => s.setSearchOpen);
  const boards = useAppStore((s) => s.boards);
  const activeBoardId = useAppStore((s) => s.activeBoardId);
  const setActiveBoardId = useAppStore((s) => s.setActiveBoardId);

  const board = useBoardStore((s) => s.board);
  const items = useBoardStore((s) => s.items);
  const connections = useBoardStore((s) => s.connections);
  const viewport = useBoardStore((s) => s.viewport);
  const initBoard = useBoardStore((s) => s.initBoard);
  const setViewport = useBoardStore((s) => s.setViewport);
  const selectItem = useBoardStore((s) => s.selectItem);
  const clearSelection = useBoardStore((s) => s.clearSelection);

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);

  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Reset active index when results change
  useEffect(() => {
    setActiveIdx(0);
  }, [results]);

  const runSearch = useCallback(
    async (q: string) => {
      if (!q.trim()) {
        setResults([]);
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const adapter = await getAdapter();
        const found = await searchAllBoards(
          q,
          boards,
          adapter,
          items,
          activeBoardId ?? undefined,
        );
        setResults(found);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    },
    [boards, items, activeBoardId],
  );

  const handleInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      setQuery(val);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => runSearch(val), 300);
    },
    [runSearch],
  );

  const navigateTo = useCallback(
    async (result: SearchResult) => {
      const adapter = await getAdapter();

      if (result.boardId !== activeBoardId) {
        // Persist current board before switching
        if (board) {
          await adapter
            .saveBoard({ ...board, viewport, updatedAt: Date.now() }, items, connections)
            .catch(console.error);
        }
        try {
          const { board: b, items: it, connections: cn } = await adapter.loadBoard(result.boardId);
          initBoard(b, it, cn);
        } catch {
          const target = boards.find((brd) => brd.id === result.boardId);
          if (target) initBoard(target, [], []);
        }
        setActiveBoardId(result.boardId);
      }

      // Center viewport on the item (scale 1)
      const scale = 1;
      const cx = result.itemX + result.itemWidth / 2;
      const cy = result.itemY + result.itemHeight / 2;
      setViewport({
        x: window.innerWidth / 2 - cx * scale,
        y: window.innerHeight / 2 - cy * scale,
        scale,
      });

      clearSelection();
      // Defer selection to after React re-renders the new board's items
      setTimeout(() => selectItem(result.itemId), 0);

      setSearchOpen(false);
    },
    [
      activeBoardId,
      board,
      boards,
      clearSelection,
      connections,
      initBoard,
      items,
      selectItem,
      setActiveBoardId,
      setSearchOpen,
      setViewport,
      viewport,
    ],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") {
        setSearchOpen(false);
        return;
      }
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIdx((i) => Math.min(i + 1, results.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIdx((i) => Math.max(i - 1, 0));
      } else if (e.key === "Enter" && results.length > 0) {
        e.preventDefault();
        navigateTo(results[activeIdx]);
      }
    },
    [activeIdx, navigateTo, results, setSearchOpen],
  );

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={() => setSearchOpen(false)}
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 300,
          background: "rgba(0,0,0,0.45)",
        }}
      />

      {/* Panel */}
      <div
        style={{
          position: "fixed",
          top: "15%",
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 301,
          width: "min(600px, 90vw)",
          background: "rgba(22,16,8,0.97)",
          backdropFilter: "blur(20px)",
          borderRadius: 14,
          border: "1px solid rgba(255,255,255,0.1)",
          boxShadow: "0 8px 40px rgba(0,0,0,0.6)",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          maxHeight: "65vh",
        }}
        onKeyDown={handleKeyDown}
      >
        {/* Search input row */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "12px 16px",
            borderBottom: "1px solid rgba(255,255,255,0.07)",
            flexShrink: 0,
          }}
        >
          <span style={{ fontSize: 16, opacity: 0.6 }}>🔍</span>
          <input
            ref={inputRef}
            value={query}
            onChange={handleInput}
            placeholder="Search all boards…"
            style={{
              flex: 1,
              background: "transparent",
              border: "none",
              outline: "none",
              color: "#fff",
              fontSize: 16,
              fontFamily: "system-ui, sans-serif",
            }}
          />
          {loading && (
            <span style={{ fontSize: 12, color: "rgba(255,255,255,0.35)" }}>
              Searching…
            </span>
          )}
          <span
            style={{
              fontSize: 10,
              color: "rgba(255,255,255,0.25)",
              fontFamily: "system-ui, sans-serif",
              border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: 4,
              padding: "1px 5px",
            }}
          >
            Esc
          </span>
        </div>

        {/* Results */}
        <div style={{ overflowY: "auto", flex: 1 }}>
          {query.trim() && !loading && results.length === 0 && (
            <div
              style={{
                padding: "24px 16px",
                textAlign: "center",
                color: "rgba(255,255,255,0.3)",
                fontFamily: "system-ui, sans-serif",
                fontSize: 14,
              }}
            >
              No results for "{query}"
            </div>
          )}

          {!query.trim() && (
            <div
              style={{
                padding: "20px 16px",
                color: "rgba(255,255,255,0.25)",
                fontFamily: "system-ui, sans-serif",
                fontSize: 13,
                textAlign: "center",
              }}
            >
              Type to search notes, links, images, and videos across all boards
            </div>
          )}

          {results.map((r, i) => (
            <div
              key={`${r.boardId}:${r.itemId}`}
              onClick={() => navigateTo(r)}
              style={{
                padding: "10px 16px",
                cursor: "pointer",
                background:
                  i === activeIdx
                    ? "rgba(255,255,255,0.08)"
                    : "transparent",
                borderLeft:
                  i === activeIdx
                    ? "3px solid #ff6600"
                    : "3px solid transparent",
                display: "flex",
                alignItems: "flex-start",
                gap: 10,
                transition: "background 0.1s",
              }}
              onMouseEnter={() => setActiveIdx(i)}
            >
              <span style={{ fontSize: 16, flexShrink: 0, marginTop: 1 }}>
                {ITEM_ICONS[r.itemType] ?? "📌"}
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 13,
                    color: "#fff",
                    fontFamily: "system-ui, sans-serif",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {r.snippet || `(${r.itemType})`}
                </div>
                <div
                  style={{
                    fontSize: 11,
                    color: "rgba(255,255,255,0.35)",
                    fontFamily: "system-ui, sans-serif",
                    marginTop: 2,
                  }}
                >
                  {r.boardName}
                  {r.boardId === activeBoardId && (
                    <span style={{ marginLeft: 6, color: "#ff6600" }}>
                      current board
                    </span>
                  )}
                </div>
              </div>
              <span
                style={{
                  fontSize: 10,
                  color: "rgba(255,255,255,0.2)",
                  fontFamily: "system-ui, sans-serif",
                  marginTop: 3,
                  flexShrink: 0,
                }}
              >
                ↵
              </span>
            </div>
          ))}
        </div>

        {results.length > 0 && (
          <div
            style={{
              padding: "6px 16px",
              borderTop: "1px solid rgba(255,255,255,0.06)",
              fontSize: 11,
              color: "rgba(255,255,255,0.25)",
              fontFamily: "system-ui, sans-serif",
              display: "flex",
              gap: 12,
              flexShrink: 0,
            }}
          >
            <span>↑↓ navigate</span>
            <span>↵ jump to item</span>
            <span>{results.length} result{results.length !== 1 ? "s" : ""}</span>
          </div>
        )}
      </div>
    </>
  );
}
