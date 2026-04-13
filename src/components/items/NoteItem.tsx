import { useState, useCallback, useRef } from "react";
import type { NoteItem as NoteItemType } from "../../types/items";
import { useBoardStore } from "../../store/boardStore";
import ItemWrapper from "./ItemWrapper";

interface Props {
  item: NoteItemType;
}

const NOTE_COLORS = [
  "#fef08a", // yellow
  "#86efac", // green
  "#93c5fd", // blue
  "#f9a8d4", // pink
  "#fdba74", // orange
  "#d8b4fe", // purple
  "#ffffff", // white
];

export default function NoteItem({ item }: Props) {
  const updateItem = useBoardStore((s) => s.updateItem);
  const [editing, setEditing] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleDoubleClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      setEditing(true);
      setTimeout(() => textareaRef.current?.focus(), 0);
    },
    [],
  );

  const handleBlur = useCallback(
    (e: React.FocusEvent<HTMLTextAreaElement>) => {
      setEditing(false);
      updateItem(item.id, { content: e.target.value });
    },
    [item.id, updateItem],
  );

  return (
    <ItemWrapper item={item}>
      <div
        style={{
          width: "100%",
          height: "100%",
          background: item.color,
          boxShadow:
            "2px 3px 8px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.3)",
          borderRadius: "2px",
          padding: "8px 10px",
          display: "flex",
          flexDirection: "column",
          position: "relative",
          fontFamily: "'Caveat', cursive",
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
            background: "radial-gradient(circle at 35% 35%, #ff6666, #990000)",
            boxShadow: "0 1px 3px rgba(0,0,0,0.4)",
            zIndex: 2,
          }}
        />

        {/* Color picker dots (show on hover via CSS group) */}
        <div
          className="color-picker"
          style={{
            position: "absolute",
            top: 4,
            right: 4,
            display: "flex",
            gap: 3,
            opacity: 0,
            transition: "opacity 0.15s",
          }}
          onMouseEnter={(e) =>
            ((e.currentTarget as HTMLElement).style.opacity = "1")
          }
          onMouseLeave={(e) =>
            ((e.currentTarget as HTMLElement).style.opacity = "0")
          }
        >
          {NOTE_COLORS.map((c) => (
            <div
              key={c}
              onPointerDown={(e) => {
                e.stopPropagation();
                updateItem(item.id, { color: c });
              }}
              style={{
                width: 10,
                height: 10,
                borderRadius: "50%",
                background: c,
                border: "1px solid rgba(0,0,0,0.2)",
                cursor: "pointer",
              }}
            />
          ))}
        </div>

        {editing ? (
          <textarea
            ref={textareaRef}
            defaultValue={item.content}
            onBlur={handleBlur}
            onPointerDown={(e) => e.stopPropagation()}
            style={{
              flex: 1,
              background: "transparent",
              border: "none",
              outline: "none",
              resize: "none",
              fontFamily: "'Caveat', cursive",
              fontSize: item.fontSize,
              color: "#1a1a1a",
              lineHeight: 1.4,
              width: "100%",
            }}
          />
        ) : (
          <div
            onDoubleClick={handleDoubleClick}
            style={{
              flex: 1,
              fontSize: item.fontSize,
              color: "#1a1a1a",
              lineHeight: 1.4,
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
              overflowY: "auto",
              paddingTop: 8,
            }}
          >
            {item.content || (
              <span style={{ opacity: 0.4, fontStyle: "italic" }}>
                Double-click to edit…
              </span>
            )}
          </div>
        )}

        {item.label && (
          <div
            style={{
              fontSize: 11,
              color: "rgba(0,0,0,0.5)",
              textAlign: "center",
              marginTop: 4,
            }}
          >
            {item.label}
          </div>
        )}
      </div>
    </ItemWrapper>
  );
}
