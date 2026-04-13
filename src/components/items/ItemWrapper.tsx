import { useCallback, useRef, useState } from "react";
import type { Item } from "../../types/items";
import { useBoardStore } from "../../store/boardStore";
import PinHandle from "./PinHandle";

interface Props {
  item: Item;
  children: React.ReactNode;
}

export default function ItemWrapper({ item, children }: Props) {
  const viewport = useBoardStore((s) => s.viewport);
  const selectedIds = useBoardStore((s) => s.selectedIds);
  const selectItem = useBoardStore((s) => s.selectItem);
  const updateItem = useBoardStore((s) => s.updateItem);
  const bringToFront = useBoardStore((s) => s.bringToFront);
  const mode = useBoardStore((s) => s.mode);

  const isSelected = selectedIds.has(item.id);
  const [hovered, setHovered] = useState(false);

  const dragStart = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    itemX: number;
    itemY: number;
  } | null>(null);

  const isDragging = useRef(false);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (mode === "connect") return;
      e.stopPropagation();
      e.currentTarget.setPointerCapture(e.pointerId);
      bringToFront(item.id);
      selectItem(item.id, e.shiftKey);
      dragStart.current = {
        pointerId: e.pointerId,
        startX: e.clientX,
        startY: e.clientY,
        itemX: item.x,
        itemY: item.y,
      };
      isDragging.current = false;
    },
    [mode, bringToFront, item.id, item.x, item.y, selectItem],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!dragStart.current) return;
      const dx = (e.clientX - dragStart.current.startX) / viewport.scale;
      const dy = (e.clientY - dragStart.current.startY) / viewport.scale;
      if (Math.abs(dx) > 2 || Math.abs(dy) > 2) isDragging.current = true;
      if (isDragging.current) {
        updateItem(item.id, {
          x: dragStart.current.itemX + dx,
          y: dragStart.current.itemY + dy,
        });
      }
    },
    [item.id, updateItem, viewport.scale],
  );

  const handlePointerUp = useCallback(() => {
    dragStart.current = null;
    isDragging.current = false;
  }, []);

  return (
    <div
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: "absolute",
        left: item.x,
        top: item.y,
        width: item.width,
        height: item.height,
        transform: `rotate(${item.rotation}deg)`,
        zIndex: item.zIndex,
        cursor: mode === "connect" ? "crosshair" : "grab",
        userSelect: "none",
        outline: isSelected
          ? "2px solid rgba(59, 130, 246, 0.8)"
          : "none",
        outlineOffset: "3px",
        borderRadius: "2px",
      }}
    >
      {children}

      {/* Pin handles — shown when hovered or in connect mode */}
      {(hovered || mode === "connect") &&
        item.pins.map((pin) => (
          <PinHandle
            key={pin.id}
            pin={pin}
            itemWidth={item.width}
            itemHeight={item.height}
          />
        ))}
    </div>
  );
}
