/**
 * RopeManager: creates, updates, and removes ropes for all connections
 * on the active board. Called every animation frame.
 */

/** Point-to-segment distance (world space). */
function ptSegDist(
  px: number, py: number,
  ax: number, ay: number,
  bx: number, by: number,
): number {
  const dx = bx - ax, dy = by - ay;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) return Math.hypot(px - ax, py - ay);
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / lenSq));
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}
import type { Connection } from "../types/connections";
import type { Item } from "../types/items";
import { createRope, stepRope, wakeRope, type Rope } from "./RopeSimulation";

export interface PinWorldPos {
  x: number;
  y: number;
}

function getPinWorldPos(items: Item[], pinId: string): PinWorldPos | null {
  for (const item of items) {
    const pin = item.pins.find((p) => p.id === pinId);
    if (pin) {
      // Convert normalized offset to world position
      const rad = (item.rotation * Math.PI) / 180;
      const localX = pin.offsetX * item.width;
      const localY = pin.offsetY * item.height;
      const cosR = Math.cos(rad);
      const sinR = Math.sin(rad);
      const centerX = item.x + item.width / 2;
      const centerY = item.y + item.height / 2;
      return {
        x: centerX + localX * cosR - localY * sinR,
        y: centerY + localX * sinR + localY * cosR,
      };
    }
  }
  return null;
}

export class RopeManager {
  private ropes: Map<string, Rope> = new Map();

  sync(connections: Connection[], items: Item[]): void {
    const connectionIds = new Set(connections.map((c) => c.id));

    // Remove ropes for deleted connections
    for (const id of this.ropes.keys()) {
      if (!connectionIds.has(id)) {
        this.ropes.delete(id);
      }
    }

    // Create ropes for new connections
    for (const conn of connections) {
      if (!this.ropes.has(conn.id)) {
        const from = getPinWorldPos(items, conn.fromPinId);
        const to = getPinWorldPos(items, conn.toPinId);
        if (from && to) {
          this.ropes.set(
            conn.id,
            createRope(conn.id, from.x, from.y, to.x, to.y, conn.style.slack),
          );
        }
      }
    }
  }

  step(connections: Connection[], items: Item[], dt: number): void {
    for (const conn of connections) {
      const rope = this.ropes.get(conn.id);
      if (!rope) continue;
      const from = getPinWorldPos(items, conn.fromPinId);
      const to = getPinWorldPos(items, conn.toPinId);
      if (from && to) {
        stepRope(rope, from.x, from.y, to.x, to.y, dt);
      }
    }
  }

  wakeConnectedToItem(_itemId: string, connections: Connection[]): void {
    for (const conn of connections) {
      const rope = this.ropes.get(conn.id);
      if (!rope) continue;
      // We need to check if any pin belongs to this item
      // The store has this info, but here we just wake all (cheap)
      // A more precise impl would track which connections use which item's pins
      wakeRope(rope);
    }
  }

  getRopes(): Map<string, Rope> {
    return this.ropes;
  }

  getRope(connectionId: string): Rope | undefined {
    return this.ropes.get(connectionId);
  }

  /**
   * Return the connection ID of the rope closest to (worldX, worldY),
   * or null if nothing is within `threshold` world-space pixels.
   */
  hitTest(worldX: number, worldY: number, threshold: number): string | null {
    let bestId: string | null = null;
    let bestDist = threshold;

    for (const [connId, rope] of this.ropes) {
      const { nodes } = rope;
      for (let i = 0; i < nodes.length - 1; i++) {
        const d = ptSegDist(
          worldX, worldY,
          nodes[i].x, nodes[i].y,
          nodes[i + 1].x, nodes[i + 1].y,
        );
        if (d < bestDist) {
          bestDist = d;
          bestId = connId;
        }
      }
    }
    return bestId;
  }
}
