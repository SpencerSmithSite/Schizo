import { useCallback } from "react";
import type { BoardPortalItem as BoardPortalItemType } from "../../types/items";
import { useAppStore } from "../../store/appStore";
import { navigateToBoard } from "../../utils/boardNavigation";
import ItemWrapper from "./ItemWrapper";

interface Props {
  item: BoardPortalItemType;
}

export default function BoardPortalItem({ item }: Props) {
  const boards = useAppStore((s) => s.boards);
  const targetBoard = boards.find((b) => b.id === item.targetBoardId);

  const handleDoubleClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (!targetBoard) return;
      navigateToBoard(item.targetBoardId).catch(console.error);
    },
    [item.targetBoardId, targetBoard],
  );

  return (
    <ItemWrapper item={item}>
      <div
        onDoubleClick={handleDoubleClick}
        style={{
          width: "100%",
          height: "100%",
          background: "rgba(22, 15, 8, 0.94)",
          boxShadow: "2px 3px 10px rgba(0,0,0,0.45)",
          borderRadius: "4px",
          border: "1px solid rgba(255,140,40,0.3)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 6,
          padding: "12px 10px",
          cursor: "default",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Pushpin decoration */}
        <div
          style={{
            position: "absolute",
            top: -6,
            left: "50%",
            transform: "translateX(-50%)",
            width: 12,
            height: 12,
            borderRadius: "50%",
            background: "radial-gradient(circle at 35% 35%, #ff9966, #cc4400)",
            boxShadow: "0 1px 3px rgba(0,0,0,0.5)",
            zIndex: 2,
          }}
        />

        {/* Subtle cork texture strip at top */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 3,
            background: "linear-gradient(90deg, rgba(255,140,40,0.4), rgba(255,180,80,0.2), rgba(255,140,40,0.4))",
          }}
        />

        <div style={{ fontSize: 26, lineHeight: 1 }}>🗂️</div>

        <div
          style={{
            fontSize: 13,
            fontFamily: "'Caveat', cursive",
            color: "rgba(255,215,160,0.92)",
            textAlign: "center",
            lineHeight: 1.3,
            maxWidth: "100%",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            padding: "0 4px",
          }}
        >
          {targetBoard ? targetBoard.name : "Board not found"}
        </div>

        <div
          style={{
            fontSize: 10,
            color: "rgba(255,140,40,0.5)",
            fontFamily: "system-ui, sans-serif",
            letterSpacing: 0.3,
          }}
        >
          {targetBoard ? "double-click to open →" : "⚠ missing"}
        </div>

        {item.label && (
          <div
            style={{
              position: "absolute",
              bottom: 5,
              fontSize: 10,
              color: "rgba(255,255,255,0.35)",
              fontFamily: "system-ui, sans-serif",
            }}
          >
            {item.label}
          </div>
        )}
      </div>
    </ItemWrapper>
  );
}
