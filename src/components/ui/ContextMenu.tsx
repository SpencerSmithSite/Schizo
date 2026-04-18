import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";

export interface ContextMenuAction {
  label: string;
  icon?: string;
  onClick: () => void;
  danger?: boolean;
}

interface Props {
  x: number;
  y: number;
  actions: ContextMenuAction[];
  onClose: () => void;
}

const MENU_WIDTH = 164;
const ITEM_HEIGHT = 34;

export default function ContextMenu({ x, y, actions, onClose }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("mousedown", handleDown, true);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleDown, true);
      document.removeEventListener("keydown", handleKey);
    };
  }, [onClose]);

  const clampedX = Math.min(x, window.innerWidth - MENU_WIDTH - 8);
  const clampedY = Math.min(y, window.innerHeight - actions.length * ITEM_HEIGHT - 16);

  return createPortal(
    <div
      ref={ref}
      onContextMenu={(e) => e.preventDefault()}
      style={{
        position: "fixed",
        left: clampedX,
        top: clampedY,
        zIndex: 9999,
        background: "rgba(18, 12, 4, 0.96)",
        backdropFilter: "blur(12px)",
        border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: 8,
        padding: "4px 0",
        minWidth: MENU_WIDTH,
        boxShadow: "0 8px 32px rgba(0,0,0,0.45)",
        fontFamily: "system-ui, sans-serif",
        fontSize: 13,
      }}
    >
      {actions.map((action, i) => (
        <button
          key={i}
          onClick={() => {
            action.onClick();
            onClose();
          }}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            width: "100%",
            background: "none",
            border: "none",
            padding: "8px 14px",
            textAlign: "left",
            color: action.danger ? "#ff6b6b" : "rgba(255,255,255,0.85)",
            cursor: "pointer",
            fontSize: 13,
            lineHeight: 1,
          }}
          onMouseEnter={(e) =>
            ((e.currentTarget as HTMLButtonElement).style.background =
              "rgba(255,255,255,0.08)")
          }
          onMouseLeave={(e) =>
            ((e.currentTarget as HTMLButtonElement).style.background = "none")
          }
        >
          {action.icon && (
            <span style={{ fontSize: 14, width: 16, textAlign: "center" }}>
              {action.icon}
            </span>
          )}
          {action.label}
        </button>
      ))}
    </div>,
    document.body,
  );
}
