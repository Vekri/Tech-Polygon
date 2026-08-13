import {
  categories,
  nodes,
  type CategoryId,
  type TechNode,
} from "../data/techWorld";

export interface LaidOutNode extends TechNode {
  x: number;
  y: number;
  /** Stable phase for gentle float animation */
  phase: number;
  /** Radius offset within cluster */
  orbit: number;
}

const N = 25;
const CATEGORY_ANGLES: Record<CategoryId, number> = {
  ai: -Math.PI / 2,
  llm: -Math.PI / 2 + (2 * Math.PI) / N,
  codingai: -Math.PI / 2 + (4 * Math.PI) / N,
  agentic: -Math.PI / 2 + (6 * Math.PI) / N,
  frontier: -Math.PI / 2 + (8 * Math.PI) / N,
  stats: -Math.PI / 2 + (10 * Math.PI) / N,
  stattools: -Math.PI / 2 + (12 * Math.PI) / N,
  etl: -Math.PI / 2 + (14 * Math.PI) / N,
  algorithms: -Math.PI / 2 + (16 * Math.PI) / N,
  techniques: -Math.PI / 2 + (18 * Math.PI) / N,
  data: -Math.PI / 2 + (20 * Math.PI) / N,
  cloud: -Math.PI / 2 + (22 * Math.PI) / N,
  hardware: -Math.PI / 2 + (24 * Math.PI) / N,
  vlsi: -Math.PI / 2 + (26 * Math.PI) / N,
  space: -Math.PI / 2 + (28 * Math.PI) / N,
  banking: -Math.PI / 2 + (30 * Math.PI) / N,
  healthcare: -Math.PI / 2 + (32 * Math.PI) / N,
  energy: -Math.PI / 2 + (34 * Math.PI) / N,
  retail: -Math.PI / 2 + (36 * Math.PI) / N,
  industry: -Math.PI / 2 + (38 * Math.PI) / N,
  enterprise: -Math.PI / 2 + (40 * Math.PI) / N,
  web: -Math.PI / 2 + (42 * Math.PI) / N,
  languages: -Math.PI / 2 + (44 * Math.PI) / N,
  security: -Math.PI / 2 + (46 * Math.PI) / N,
  devtools: -Math.PI / 2 + (48 * Math.PI) / N,
};

function hashPhase(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0;
  return (Math.abs(h) % 1000) / 1000;
}

/** Deterministic clustered polar layout in normalized [-1, 1] space. */
export function layoutNodes(): LaidOutNode[] {
  const byCategory = new Map<CategoryId, TechNode[]>();
  for (const cat of categories) byCategory.set(cat.id, []);
  for (const node of nodes) {
    byCategory.get(node.category)!.push(node);
  }

  const result: LaidOutNode[] = [];
  const clusterRadius = 0.68;

  for (const cat of categories) {
    const group = byCategory.get(cat.id)!;
    const cx = Math.cos(CATEGORY_ANGLES[cat.id]) * clusterRadius;
    const cy = Math.sin(CATEGORY_ANGLES[cat.id]) * clusterRadius;
    const n = group.length;
    const ring = Math.min(0.42, Math.max(0.14, 0.07 + n * 0.012));

    group.forEach((node, i) => {
      const rings = Math.max(2, Math.ceil(Math.sqrt(n)));
      const ringIndex = i % rings;
      const onRing = Math.floor(i / rings);
      const countOnRing = Math.ceil(n / rings);
      const t =
        (onRing / Math.max(countOnRing, 1)) * Math.PI * 2 +
        CATEGORY_ANGLES[cat.id] +
        ringIndex * 0.35;
      const spiral = 0.42 + (ringIndex / rings) * 0.58;
      const r = ring * spiral;
      const phase = hashPhase(node.id);
      result.push({
        ...node,
        x: cx + Math.cos(t) * r,
        y: cy + Math.sin(t) * r * 0.9,
        phase,
        orbit: r,
      });
    });
  }

  return result;
}

export function hullForCategory(
  laid: LaidOutNode[],
  category: CategoryId,
  padding = 0.08,
): { x: number; y: number }[] {
  const pts = laid.filter((n) => n.category === category);
  const points = pts.map((p) => ({ x: p.x, y: p.y }));
  if (points.length === 0) return [];
  if (points.length === 1) {
    const p = points[0];
    const a = padding;
    return [
      { x: p.x - a, y: p.y - a },
      { x: p.x + a, y: p.y - a },
      { x: p.x + a, y: p.y + a },
      { x: p.x - a, y: p.y + a },
    ];
  }
  if (points.length === 2) {
    const [a, b] = points;
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const len = Math.hypot(dx, dy) || 1;
    const nx = (-dy / len) * padding;
    const ny = (dx / len) * padding;
    return [
      { x: a.x + nx, y: a.y + ny },
      { x: b.x + nx, y: b.y + ny },
      { x: b.x - nx, y: b.y - ny },
      { x: a.x - nx, y: a.y - ny },
    ];
  }

  const sorted = [...points].sort((a, b) => a.x - b.x || a.y - b.y);

  const cross = (
    o: { x: number; y: number },
    a: { x: number; y: number },
    b: { x: number; y: number },
  ) => (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);

  const lower: { x: number; y: number }[] = [];
  for (const p of sorted) {
    while (
      lower.length >= 2 &&
      cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0
    ) {
      lower.pop();
    }
    lower.push(p);
  }

  const upper: { x: number; y: number }[] = [];
  for (let i = sorted.length - 1; i >= 0; i--) {
    const p = sorted[i];
    while (
      upper.length >= 2 &&
      cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0
    ) {
      upper.pop();
    }
    upper.push(p);
  }

  lower.pop();
  upper.pop();
  const hull = lower.concat(upper);

  // Expand slightly from centroid
  const cx = hull.reduce((s, p) => s + p.x, 0) / hull.length;
  const cy = hull.reduce((s, p) => s + p.y, 0) / hull.length;
  return hull.map((p) => {
    const dx = p.x - cx;
    const dy = p.y - cy;
    const len = Math.hypot(dx, dy) || 1;
    return {
      x: cx + dx + (dx / len) * padding,
      y: cy + dy + (dy / len) * padding,
    };
  });
}

export function clusterCenter(
  laid: LaidOutNode[],
  category: CategoryId,
): { x: number; y: number } | null {
  const pts = laid.filter((n) => n.category === category);
  if (pts.length === 0) return null;
  const x = pts.reduce((s, p) => s + p.x, 0) / pts.length;
  const y = pts.reduce((s, p) => s + p.y, 0) / pts.length;
  // Push label slightly outward so it sits on the polygon rim
  const len = Math.hypot(x, y) || 1;
  return {
    x: x + (x / len) * 0.14,
    y: y + (y / len) * 0.14,
  };
}

export function toScreen(
  x: number,
  y: number,
  w: number,
  h: number,
  drift = 0,
  scale = 0.38,
  zoom = 1,
  panX = 0,
  panY = 0,
): { sx: number; sy: number } {
  const cos = Math.cos(drift);
  const sin = Math.sin(drift);
  const rx = x * cos - y * sin;
  const ry = x * sin + y * cos;
  const m = Math.min(w, h) * scale * zoom;
  return {
    sx: w / 2 + rx * m + panX,
    sy: h / 2 + ry * m + panY,
  };
}
