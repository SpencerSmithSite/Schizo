import { useEffect, useRef } from "react";
import * as PIXI from "pixi.js";
import { useBoardStore } from "../store/boardStore";
import { RopeManager } from "../physics/RopeManager";
import type { Connection } from "../types/connections";
import type { Item } from "../types/items";
import type { Rope } from "../physics/RopeSimulation";

export const ropeManager = new RopeManager();

/** Build the rope path onto the graphics object (without stroking). */
function buildRopePath(gfx: PIXI.Graphics, nodes: Rope["nodes"]): void {
  if (nodes.length < 2) return;
  gfx.moveTo(nodes[0].x, nodes[0].y);
  if (nodes.length === 2) {
    gfx.lineTo(nodes[1].x, nodes[1].y);
  } else {
    for (let i = 0; i < nodes.length - 1; i++) {
      const curr = nodes[i];
      const next = nodes[i + 1];
      const midX = (curr.x + next.x) / 2;
      const midY = (curr.y + next.y) / 2;
      if (i === 0) {
        gfx.moveTo(curr.x, curr.y);
        gfx.quadraticCurveTo(curr.x, curr.y, midX, midY);
      } else if (i === nodes.length - 2) {
        gfx.quadraticCurveTo(curr.x, curr.y, next.x, next.y);
      } else {
        gfx.quadraticCurveTo(curr.x, curr.y, midX, midY);
      }
    }
  }
}

function drawRope(
  gfx: PIXI.Graphics,
  rope: Rope,
  conn: Connection,
  selected: boolean,
): void {
  const { nodes } = rope;
  if (nodes.length < 2) return;

  const color = parseInt(conn.style.color.replace("#", ""), 16);
  const thickness = conn.style.thickness;

  // ── Selection glow ──────────────────────────────────────────────────────
  if (selected) {
    buildRopePath(gfx, nodes);
    gfx.stroke({ color: 0x3b82f6, width: thickness + 8, alpha: 0.35 });
  }

  // ── Main rope stroke ────────────────────────────────────────────────────
  buildRopePath(gfx, nodes);

  if (conn.style.texture === "yarn") {
    gfx.stroke({ color, width: thickness + 1, alpha: 0.9 });
  } else if (conn.style.texture === "wire") {
    gfx.stroke({ color: 0xaaaaaa, width: 1, alpha: 0.8 });
    gfx.stroke({ color: 0xffffff, width: 0.5, alpha: 0.5 });
  } else if (conn.style.texture === "rope") {
    gfx.stroke({ color, width: thickness + 2, alpha: 1 });
  } else {
    // thread
    gfx.stroke({ color, width: Math.max(1, thickness - 1), alpha: 0.85 });
  }
}

export default function PixiBoard() {
  const canvasRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<PIXI.Application | null>(null);
  const gfxRef = useRef<PIXI.Graphics | null>(null);
  const rafRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(performance.now());

  const viewport = useBoardStore((s) => s.viewport);
  const viewportRef = useRef(viewport);
  viewportRef.current = viewport;

  const connectionsRef = useRef<Connection[]>([]);
  const itemsRef = useRef<Item[]>([]);
  const selectedConnIdRef = useRef<string | null>(null);

  // Keep refs in sync with store without re-running main effect
  useBoardStore.subscribe((s) => {
    connectionsRef.current = s.connections;
    itemsRef.current = s.items;
    selectedConnIdRef.current = s.selectedConnectionId;
  });

  useEffect(() => {
    const container = canvasRef.current;
    if (!container) return;

    const app = new PIXI.Application();

    app
      .init({
        resizeTo: window,
        backgroundAlpha: 0,
        antialias: true,
        resolution: window.devicePixelRatio || 1,
        autoDensity: true,
        preserveDrawingBuffer: true,
      })
      .then(() => {
        container.appendChild(app.canvas);
        app.canvas.style.position = "absolute";
        app.canvas.style.inset = "0";
        app.canvas.style.pointerEvents = "none";

        const gfx = new PIXI.Graphics();
        app.stage.addChild(gfx);
        appRef.current = app;
        gfxRef.current = gfx;

        const tick = () => {
          const now = performance.now();
          const dt = Math.min((now - lastTimeRef.current) / 1000, 0.05);
          lastTimeRef.current = now;

          const vp = viewportRef.current;
          const connections = connectionsRef.current;
          const items = itemsRef.current;
          const selectedId = selectedConnIdRef.current;

          ropeManager.sync(connections, items);
          ropeManager.step(connections, items, dt);

          app.stage.position.set(vp.x, vp.y);
          app.stage.scale.set(vp.scale);

          gfx.clear();
          const ropes = ropeManager.getRopes();
          for (const conn of connections) {
            const rope = ropes.get(conn.id);
            if (rope) {
              drawRope(gfx, rope, conn, conn.id === selectedId);
            }
          }

          rafRef.current = requestAnimationFrame(tick);
        };

        rafRef.current = requestAnimationFrame(tick);
      });

    return () => {
      cancelAnimationFrame(rafRef.current);
      appRef.current?.destroy(true);
      appRef.current = null;
    };
  }, []);

  return (
    <div
      ref={canvasRef}
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        zIndex: 1,
      }}
    />
  );
}
