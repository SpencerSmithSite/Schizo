/** Verlet integration rope simulation */

const GRAVITY = 800; // px/s²
const DAMPING = 0.98;
const CONSTRAINT_ITERATIONS = 5;
const SEGMENT_LENGTH = 18; // world-space px per rope segment
const SLEEP_THRESHOLD = 0.05; // px/frame below which a node is considered still
const SLEEP_FRAMES_REQUIRED = 30; // frames a rope must be still before sleeping

export interface RopeNode {
  x: number;
  y: number;
  prevX: number;
  prevY: number;
}

export interface Rope {
  connectionId: string;
  nodes: RopeNode[];
  restSegmentLength: number;
  awake: boolean;
  sleepCounter: number;
}

function distance(ax: number, ay: number, bx: number, by: number): number {
  const dx = bx - ax;
  const dy = by - ay;
  return Math.sqrt(dx * dx + dy * dy);
}

function makeCatenaryNodes(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  n: number,
  slack: number,
): RopeNode[] {
  const nodes: RopeNode[] = [];
  const sag = Math.min(80, distance(x1, y1, x2, y2) * 0.2 * (1 + slack));
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1);
    const x = x1 + (x2 - x1) * t;
    // Parabolic sag: highest in the middle
    const sagY = sag * 4 * t * (1 - t);
    const y = y1 + (y2 - y1) * t + sagY;
    nodes.push({ x, y, prevX: x, prevY: y });
  }
  return nodes;
}

export function createRope(
  connectionId: string,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  slack: number,
): Rope {
  const dist = Math.max(1, distance(x1, y1, x2, y2));
  const n = Math.max(3, Math.ceil(dist / SEGMENT_LENGTH));
  const restSegmentLength = (dist / n) * (1 + slack * 0.5);
  const nodes = makeCatenaryNodes(x1, y1, x2, y2, n, slack);
  return {
    connectionId,
    nodes,
    restSegmentLength,
    awake: true,
    sleepCounter: 0,
  };
}

export function stepRope(
  rope: Rope,
  anchorX1: number,
  anchorY1: number,
  anchorX2: number,
  anchorY2: number,
  dt: number,
): void {
  const { nodes } = rope;
  const n = nodes.length;
  const dtSq = dt * dt;

  // Check if anchors moved — wake the rope if so
  const firstNode = nodes[0];
  const lastNode = nodes[n - 1];
  const anchorMoved =
    Math.abs(firstNode.x - anchorX1) > 0.5 ||
    Math.abs(firstNode.y - anchorY1) > 0.5 ||
    Math.abs(lastNode.x - anchorX2) > 0.5 ||
    Math.abs(lastNode.y - anchorY2) > 0.5;

  if (anchorMoved) {
    rope.awake = true;
    rope.sleepCounter = 0;
  }

  if (!rope.awake) return;

  // 1. Verlet integration for interior nodes
  for (let i = 1; i < n - 1; i++) {
    const node = nodes[i];
    const vx = (node.x - node.prevX) * DAMPING;
    const vy = (node.y - node.prevY) * DAMPING;
    node.prevX = node.x;
    node.prevY = node.y;
    node.x += vx;
    node.y += vy + GRAVITY * dtSq;
  }

  // 2. Pin endpoints to anchors
  firstNode.x = anchorX1;
  firstNode.y = anchorY1;
  firstNode.prevX = anchorX1;
  firstNode.prevY = anchorY1;
  lastNode.x = anchorX2;
  lastNode.y = anchorY2;
  lastNode.prevX = anchorX2;
  lastNode.prevY = anchorY2;

  // 3. Constraint relaxation
  for (let iter = 0; iter < CONSTRAINT_ITERATIONS; iter++) {
    for (let i = 0; i < n - 1; i++) {
      const a = nodes[i];
      const b = nodes[i + 1];
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 0.001;
      const diff = (dist - rope.restSegmentLength) / dist / 2;
      const offsetX = dx * diff;
      const offsetY = dy * diff;

      if (i !== 0) {
        a.x += offsetX;
        a.y += offsetY;
      }
      if (i + 1 !== n - 1) {
        b.x -= offsetX;
        b.y -= offsetY;
      }
    }
  }

  // 4. Sleep detection
  let maxMotion = 0;
  for (let i = 1; i < n - 1; i++) {
    const node = nodes[i];
    const motion = Math.abs(node.x - node.prevX) + Math.abs(node.y - node.prevY);
    if (motion > maxMotion) maxMotion = motion;
  }

  if (maxMotion < SLEEP_THRESHOLD) {
    rope.sleepCounter++;
    if (rope.sleepCounter >= SLEEP_FRAMES_REQUIRED) {
      rope.awake = false;
    }
  } else {
    rope.sleepCounter = 0;
  }
}

export function wakeRope(rope: Rope): void {
  rope.awake = true;
  rope.sleepCounter = 0;
}
