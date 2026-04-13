import { useCallback, useRef } from "react";
import { useBoardStore } from "../../store/boardStore";
import PixiBoard from "../../canvas/PixiBoard";
import NoteItem from "../items/NoteItem";
import ImageItem from "../items/ImageItem";
import LinkItem from "../items/LinkItem";
import type { Item } from "../../types/items";

function renderItem(item: Item) {
  switch (item.type) {
    case "note":
      return <NoteItem key={item.id} item={item} />;
    case "image":
    case "screenshot":
      return <ImageItem key={item.id} item={item as import("../../types/items").ImageItem} />;
    case "link":
      return <LinkItem key={item.id} item={item} />;
    default:
      return null;
  }
}

export default function BoardCanvas() {
  const viewport = useBoardStore((s) => s.viewport);
  const panBy = useBoardStore((s) => s.panBy);
  const zoomTo = useBoardStore((s) => s.zoomTo);
  const items = useBoardStore((s) => s.items);
  const mode = useBoardStore((s) => s.mode);
  const clearSelection = useBoardStore((s) => s.clearSelection);
  const setPendingFromPin = useBoardStore((s) => s.setPendingFromPin);

  const panState = useRef<{
    active: boolean;
    startX: number;
    startY: number;
    vpX: number;
    vpY: number;
  } | null>(null);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (e.target !== e.currentTarget) return;
      clearSelection();
      setPendingFromPin(null);

      if (mode === "select" || mode === "pan") {
        e.currentTarget.setPointerCapture(e.pointerId);
        panState.current = {
          active: true,
          startX: e.clientX,
          startY: e.clientY,
          vpX: viewport.x,
          vpY: viewport.y,
        };
      }
    },
    [clearSelection, mode, setPendingFromPin, viewport.x, viewport.y],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!panState.current?.active) return;
      const dx = e.clientX - panState.current.startX;
      const dy = e.clientY - panState.current.startY;
      panBy(
        dx - (viewport.x - panState.current.vpX),
        dy - (viewport.y - panState.current.vpY),
      );
    },
    [panBy, viewport.x, viewport.y],
  );

  const handlePointerUp = useCallback(() => {
    panState.current = null;
  }, []);

  const handleWheel = useCallback(
    (e: React.WheelEvent<HTMLDivElement>) => {
      e.preventDefault();
      const rect = e.currentTarget.getBoundingClientRect();
      const cx = e.clientX - rect.left;
      const cy = e.clientY - rect.top;

      if (e.ctrlKey || e.metaKey) {
        // Pinch-to-zoom
        const delta = e.deltaY > 0 ? 0.9 : 1.1;
        zoomTo(viewport.scale * delta, cx, cy);
      } else {
        panBy(-e.deltaX, -e.deltaY);
      }
    },
    [panBy, viewport.scale, zoomTo],
  );

  return (
    <div
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
    </div>
  );
}
