import { useCallback } from "react";
import type { Pin } from "../../types/items";
import { useBoardStore } from "../../store/boardStore";

interface Props {
  pin: Pin;
  itemWidth: number;
  itemHeight: number;
}

export default function PinHandle({
  pin,
  itemWidth,
  itemHeight,
}: Props) {
  const mode = useBoardStore((s) => s.mode);
  const pendingFromPin = useBoardStore((s) => s.pendingFromPin);
  const setPendingFromPin = useBoardStore((s) => s.setPendingFromPin);
  const addConnection = useBoardStore((s) => s.addConnection);

  // Position relative to the item's container (accounting for rotation is handled by CSS on the parent)
  const left = (pin.offsetX + 0.5) * itemWidth;
  const top = (pin.offsetY + 0.5) * itemHeight;

  const isPending = pendingFromPin?.id === pin.id;
  const canConnect = mode === "connect";

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.stopPropagation();
      if (!canConnect) return;

      if (pendingFromPin && pendingFromPin.id !== pin.id) {
        // Complete the connection
        addConnection(pendingFromPin.id, pin.id);
        setPendingFromPin(null);
      } else {
        setPendingFromPin(pin);
      }
    },
    [canConnect, pendingFromPin, pin, addConnection, setPendingFromPin],
  );

  if (!canConnect && mode !== "select") return null;

  return (
    <div
      onPointerDown={handlePointerDown}
      style={{
        position: "absolute",
        left: left - 6,
        top: top - 6,
        width: 12,
        height: 12,
        borderRadius: "50%",
        background: isPending ? "#ff6600" : "#cc0000",
        border: "2px solid rgba(255,255,255,0.8)",
        cursor: canConnect ? "crosshair" : "default",
        zIndex: 10,
        boxShadow: isPending
          ? "0 0 0 3px rgba(255,100,0,0.4)"
          : "0 1px 3px rgba(0,0,0,0.5)",
        transition: "transform 0.1s, box-shadow 0.1s",
        transform: isPending ? "scale(1.3)" : "scale(1)",
      }}
      title={canConnect ? "Click to connect" : undefined}
    />
  );
}
