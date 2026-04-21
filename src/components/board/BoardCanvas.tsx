import { useCallback, useRef, useState } from "react";
import { useBoardStore } from "../../store/boardStore";
import PixiBoard, { ropeManager } from "../../canvas/PixiBoard";
import NoteItem from "../items/NoteItem";
import ImageItem from "../items/ImageItem";
import LinkItem from "../items/LinkItem";
import VideoItem from "../items/VideoItem";
import type { ImageItem as ImageItemType, VideoItem as VideoItemType, Item } from "../../types/items";
import { nanoid } from "../../utils/nanoid";

function renderItem(item: Item) {
  switch (item.type) {
    case "note":
      return <NoteItem key={item.id} item={item} />;
    case "image":
    case "screenshot":
      return <ImageItem key={item.id} item={item as import("../../types/items").ImageItem} />;
    case "link":
      return <LinkItem key={item.id} item={item} />;
    case "video":
      return <VideoItem key={item.id} item={item as VideoItemType} />;
    default:
      return null;
  }
}

// Screen-space marquee rect (client coords)
interface MarqueeRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

const DRAG_THRESHOLD = 5; // px before marquee activates

export default function BoardCanvas() {
  const viewport = useBoardStore((s) => s.viewport);
  const panBy = useBoardStore((s) => s.panBy);
  const zoomTo = useBoardStore((s) => s.zoomTo);
  const items = useBoardStore((s) => s.items);
  const mode = useBoardStore((s) => s.mode);
  const clearSelection = useBoardStore((s) => s.clearSelection);
  const selectItemsInRect = useBoardStore((s) => s.selectItemsInRect);
  const setPendingFromPin = useBoardStore((s) => s.setPendingFromPin);
  const setSelectedConnection = useBoardStore((s) => s.setSelectedConnection);
  const addItem = useBoardStore((s) => s.addItem);
  const board = useBoardStore((s) => s.board);

  // Pan state (used in pan mode)
  const panState = useRef<{
    startX: number;
    startY: number;
    vpX: number;
    vpY: number;
  } | null>(null);

  // Marquee state (used in select mode drag)
  const marqueeStart = useRef<{ x: number; y: number } | null>(null);
  const [marquee, setMarquee] = useState<MarqueeRect | null>(null);

  // Ref to the canvas root so we can subtract its rect during pointerup
  const canvasRef = useRef<HTMLDivElement>(null);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      // Only react to clicks directly on the canvas background (not on items)
      if (e.target !== e.currentTarget) return;

      setPendingFromPin(null);

      if (mode === "select") {
        if (!e.shiftKey) clearSelection();
        e.currentTarget.setPointerCapture(e.pointerId);
        marqueeStart.current = { x: e.clientX, y: e.clientY };
        setMarquee(null);
      } else if (mode === "pan") {
        clearSelection();
        setSelectedConnection(null);
        e.currentTarget.setPointerCapture(e.pointerId);
        panState.current = {
          startX: e.clientX,
          startY: e.clientY,
          vpX: viewport.x,
          vpY: viewport.y,
        };
      }
    },
    [clearSelection, mode, setPendingFromPin, setSelectedConnection, viewport.x, viewport.y],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      // Pan mode
      if (panState.current) {
        const dx = e.clientX - panState.current.startX;
        const dy = e.clientY - panState.current.startY;
        panBy(
          dx - (viewport.x - panState.current.vpX),
          dy - (viewport.y - panState.current.vpY),
        );
        return;
      }

      // Select mode — draw marquee once past threshold
      if (marqueeStart.current) {
        const dx = e.clientX - marqueeStart.current.x;
        const dy = e.clientY - marqueeStart.current.y;
        if (Math.abs(dx) > DRAG_THRESHOLD || Math.abs(dy) > DRAG_THRESHOLD) {
          setMarquee({
            x: Math.min(e.clientX, marqueeStart.current.x),
            y: Math.min(e.clientY, marqueeStart.current.y),
            w: Math.abs(dx),
            h: Math.abs(dy),
          });
        }
      }
    },
    [panBy, viewport.x, viewport.y],
  );

  const handlePointerUp = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      // Pan — just clear
      if (panState.current) {
        panState.current = null;
        return;
      }

      // Select — commit marquee if active, or hit-test ropes on click
      if (marqueeStart.current) {
        const start = marqueeStart.current;
        marqueeStart.current = null;

        const dx = e.clientX - start.x;
        const dy = e.clientY - start.y;
        const active =
          Math.abs(dx) > DRAG_THRESHOLD || Math.abs(dy) > DRAG_THRESHOLD;

        setMarquee(null);

        if (active) {
          // Convert screen-space marquee → world space
          const canvasRect = canvasRef.current?.getBoundingClientRect() ?? {
            left: 0,
            top: 0,
          };
          const sx = Math.min(start.x, e.clientX) - canvasRect.left;
          const sy = Math.min(start.y, e.clientY) - canvasRect.top;
          const sw = Math.abs(dx);
          const sh = Math.abs(dy);
          const wx = (sx - viewport.x) / viewport.scale;
          const wy = (sy - viewport.y) / viewport.scale;
          const ww = sw / viewport.scale;
          const wh = sh / viewport.scale;
          selectItemsInRect({ x: wx, y: wy, w: ww, h: wh }, e.shiftKey);
          setSelectedConnection(null);
        } else {
          // Simple click on canvas background — hit-test ropes
          const canvasRect = canvasRef.current?.getBoundingClientRect() ?? {
            left: 0,
            top: 0,
          };
          const cx = e.clientX - canvasRect.left;
          const cy = e.clientY - canvasRect.top;
          const wx = (cx - viewport.x) / viewport.scale;
          const wy = (cy - viewport.y) / viewport.scale;
          const threshold = 8 / viewport.scale;
          const hitId = ropeManager.hitTest(wx, wy, threshold);
          setSelectedConnection(hitId);
        }
      }
    },
    [selectItemsInRect, setSelectedConnection, viewport.scale, viewport.x, viewport.y],
  );

  const handleWheel = useCallback(
    (e: React.WheelEvent<HTMLDivElement>) => {
      e.preventDefault();
      const rect = e.currentTarget.getBoundingClientRect();
      const cx = e.clientX - rect.left;
      const cy = e.clientY - rect.top;

      if (e.ctrlKey || e.metaKey) {
        const delta = e.deltaY > 0 ? 0.9 : 1.1;
        zoomTo(viewport.scale * delta, cx, cy);
      } else {
        panBy(-e.deltaX, -e.deltaY);
      }
    },
    [panBy, viewport.scale, zoomTo],
  );

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    if (Array.from(e.dataTransfer.items).some((it) => it.type.startsWith("image/"))) {
      e.preventDefault();
      e.dataTransfer.dropEffect = "copy";
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      if (!board) return;

      const files = Array.from(e.dataTransfer.files).filter((f) =>
        f.type.startsWith("image/"),
      );
      if (files.length === 0) return;

      const rect = e.currentTarget.getBoundingClientRect();
      const dropX = e.clientX - rect.left;
      const dropY = e.clientY - rect.top;
      const worldX = (dropX - viewport.x) / viewport.scale;
      const worldY = (dropY - viewport.y) / viewport.scale;

      files.forEach((file, i) => {
        const reader = new FileReader();
        reader.onload = () => {
          const src = reader.result as string;
          const maxZ = Math.max(
            ...useBoardStore.getState().items.map((it) => it.zIndex),
            0,
          );
          const id = nanoid();
          const W = 200;
          const H = 160;
          const newItem: ImageItemType = {
            id,
            boardId: board.id,
            type: "image",
            src,
            x: worldX - W / 2 + i * 20,
            y: worldY - H / 2 + i * 20,
            width: W,
            height: H,
            rotation: (Math.random() - 0.5) * 4,
            zIndex: maxZ + 1 + i,
            createdAt: Date.now(),
            pins: [
              { id: nanoid(), itemId: id, offsetX: 0, offsetY: -0.5 },
              { id: nanoid(), itemId: id, offsetX: 0, offsetY: 0.5 },
              { id: nanoid(), itemId: id, offsetX: -0.5, offsetY: 0 },
              { id: nanoid(), itemId: id, offsetX: 0.5, offsetY: 0 },
            ],
          };
          addItem(newItem);
        };
        reader.readAsDataURL(file);
      });
    },
    [addItem, board, viewport.scale, viewport.x, viewport.y],
  );

  return (
    <div
      id="board-canvas-root"
      ref={canvasRef}
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        overflow: "hidden",
        cursor: mode === "pan" ? "grab" : "default",
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onWheel={handleWheel}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {/* Cork board background */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: `
            radial-gradient(ellipse at 20% 30%, rgba(180,140,80,0.15) 0%, transparent 50%),
            radial-gradient(ellipse at 80% 70%, rgba(140,100,60,0.1) 0%, transparent 40%)
          `,
          backgroundColor: "#c8a96e",
          backgroundSize: "auto",
        }}
      >
        {/* Cork texture via CSS noise pattern */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23noise)' opacity='0.15'/%3E%3C/svg%3E")`,
            opacity: 0.6,
          }}
        />
      </div>

      {/* PixiJS rope overlay */}
      <PixiBoard />

      {/* DOM items layer */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.scale})`,
          transformOrigin: "0 0",
          zIndex: 2,
        }}
      >
        {items.map(renderItem)}
      </div>

      {/* Marquee selection rectangle (screen space, pointer-events: none) */}
      {marquee && mode === "select" && (
        <div
          style={{
            position: "fixed",
            left: marquee.x,
            top: marquee.y,
            width: marquee.w,
            height: marquee.h,
            background: "rgba(59, 130, 246, 0.08)",
            border: "1px solid rgba(59, 130, 246, 0.55)",
            borderRadius: 2,
            pointerEvents: "none",
            zIndex: 50,
          }}
        />
      )}
    </div>
  );
}
