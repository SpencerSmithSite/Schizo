import { useCallback, useRef, useState } from "react";
import type { Item } from "../../types/items";
import { useBoardStore } from "../../store/boardStore";
import PinHandle from "./PinHandle";
import ContextMenu from "../ui/ContextMenu";
import { nanoid } from "../../utils/nanoid";

interface Props {
  item: Item;
  children: React.ReactNode;
}

export default function ItemWrapper({ item, children }: Props) {
  const viewport = useBoardStore((s) => s.viewport);
  const selectedIds = useBoardStore((s) => s.selectedIds);
  const selectItem = useBoardStore((s) => s.selectItem);
  const updateItem = useBoardStore((s) => s.updateItem);
  const removeItem = useBoardStore((s) => s.removeItem);
  const addItem = useBoardStore((s) => s.addItem);
  const bringToFront = useBoardStore((s) => s.bringToFront);
  const clearSelection = useBoardStore((s) => s.clearSelection);
  const mode = useBoardStore((s) => s.mode);

  const isSelected = selectedIds.has(item.id);
  const [hovered, setHovered] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
  const [labelEditing, setLabelEditing] = useState(false);
  const [labelValue, setLabelValue] = useState(item.label ?? "");

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

  const handleContextMenu = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      if (!isSelected) selectItem(item.id, false);
      setContextMenu({ x: e.clientX, y: e.clientY });
    },
    [isSelected, item.id, selectItem],
  );

  const handleDelete = useCallback(() => {
    // Delete all selected items if this one is selected, otherwise just this one
    if (selectedIds.has(item.id) && selectedIds.size > 1) {
      selectedIds.forEach((id) => removeItem(id));
      clearSelection();
    } else {
      removeItem(item.id);
      clearSelection();
    }
  }, [item.id, selectedIds, removeItem, clearSelection]);

  const handleDuplicate = useCallback(() => {
    const OFFSET = 24;
    const newItem = {
      ...item,
      id: nanoid(),
      x: item.x + OFFSET,
      y: item.y + OFFSET,
      zIndex: item.zIndex + 1,
      createdAt: Date.now(),
      pins: item.pins.map((p) => ({ ...p, id: nanoid(), itemId: "" as string })),
    };
    // Fix pin itemIds after we have the new id
    const newId = newItem.id;
    newItem.pins = newItem.pins.map((p) => ({ ...p, itemId: newId }));
    addItem(newItem as Item);
    selectItem(newId, false);
  }, [item, addItem, selectItem]);

  const commitLabel = useCallback(() => {
    updateItem(item.id, { label: labelValue.trim() || undefined });
    setLabelEditing(false);
  }, [item.id, labelValue, updateItem]);

  const handleLabelKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") commitLabel();
      if (e.key === "Escape") setLabelEditing(false);
    },
    [commitLabel],
  );

  return (
    <div
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onContextMenu={handleContextMenu}
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

      {/* Inline label editor */}
      {labelEditing && (
        <div
          onPointerDown={(e) => e.stopPropagation()}
          style={{
            position: "absolute",
            bottom: -38,
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 9998,
          }}
        >
          <input
            autoFocus
            value={labelValue}
            onChange={(e) => setLabelValue(e.target.value)}
            onBlur={commitLabel}
            onKeyDown={handleLabelKeyDown}
            placeholder="Add label…"
            style={{
              background: "rgba(18,12,4,0.92)",
              border: "1px solid rgba(255,255,255,0.2)",
              borderRadius: 5,
              padding: "4px 10px",
              color: "rgba(255,255,255,0.9)",
              fontSize: 12,
              width: 150,
              textAlign: "center",
              outline: "none",
              fontFamily: "system-ui, sans-serif",
              boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
            }}
          />
        </div>
      )}

      {/* Context menu */}
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          onClose={() => setContextMenu(null)}
          actions={[
            {
              icon: "✏️",
              label: "Edit Label",
              onClick: () => {
                setLabelValue(item.label ?? "");
                setLabelEditing(true);
              },
            },
            {
              icon: "⧉",
              label: selectedIds.has(item.id) && selectedIds.size > 1
                ? `Duplicate ${selectedIds.size} items`
                : "Duplicate",
              onClick: () => {
                if (selectedIds.has(item.id) && selectedIds.size > 1) {
                  // Duplicate all selected
                  const OFFSET = 24;
                  const newIds: string[] = [];
                  selectedIds.forEach((sid) => {
                    const src = useBoardStore.getState().items.find((it) => it.id === sid);
                    if (!src) return;
                    const newId = nanoid();
                    newIds.push(newId);
                    addItem({
                      ...src,
                      id: newId,
                      x: src.x + OFFSET,
                      y: src.y + OFFSET,
                      zIndex: src.zIndex + 1,
                      createdAt: Date.now(),
                      pins: src.pins.map((p) => ({ ...p, id: nanoid(), itemId: newId })),
                    } as Item);
                  });
                  clearSelection();
                  newIds.forEach((id, i) => selectItem(id, i > 0));
                } else {
                  handleDuplicate();
                }
              },
            },
            {
              icon: "🗑",
              label: selectedIds.has(item.id) && selectedIds.size > 1
                ? `Delete ${selectedIds.size} items`
                : "Delete",
              onClick: handleDelete,
              danger: true,
            },
          ]}
        />
      )}
    </div>
  );
}
