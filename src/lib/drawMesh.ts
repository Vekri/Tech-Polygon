import {
  categories,
  graphEdges,
  categoryById,
  type CategoryId,
  type Pricing,
  type TechEdge,
} from "../data/techWorld";
import {
  clusterCenter,
  regularPolygon,
  toScreen,
  type LaidOutNode,
} from "./layout";

export interface MeshFrameState {
  time: number;
  width: number;
  height: number;
  drift: number;
  scale: number;
  zoom: number;
  panX: number;
  panY: number;
  filter: CategoryId | null;
  pricingFilter: Pricing | null;
  hoverId: string | null;
  selectedId: string | null;
  /** Soften density / labels for hero or mobile */
  compact: boolean;
  showLabels: boolean;
  /** Draw domain/vertical titles on the mesh image */
  showCategoryTitles: boolean;
  /** When set, only these ids stay fully lit */
  matchIds: Set<string> | null;
}

function animatedPos(
  node: LaidOutNode,
  time: number,
  w: number,
  h: number,
  drift: number,
  scale: number,
  zoom: number,
  panX: number,
  panY: number,
) {
  const floatX = Math.sin(time * 0.0006 + node.phase * Math.PI * 2) * 0.012;
  const floatY = Math.cos(time * 0.0005 + node.phase * Math.PI * 2) * 0.01;
  return toScreen(
    node.x + floatX,
    node.y + floatY,
    w,
    h,
    drift,
    scale,
    zoom,
    panX,
    panY,
  );
}

function isActiveNode(
  node: LaidOutNode,
  state: Pick<MeshFrameState, "filter" | "pricingFilter" | "matchIds">,
): boolean {
  const catOk = state.filter === null || node.category === state.filter;
  const priceOk =
    state.pricingFilter === null || node.pricing === state.pricingFilter;
  const searchOk = !state.matchIds || state.matchIds.has(node.id);
  return catOk && priceOk && searchOk;
}

function edgeAlpha(
  edge: TechEdge,
  byId: Map<string, LaidOutNode>,
  state: MeshFrameState,
): number {
  const a = byId.get(edge.from);
  const b = byId.get(edge.to);
  if (!a || !b) return 0;

  const aOn = isActiveNode(a, state);
  const bOn = isActiveNode(b, state);
  const filtering =
    state.filter !== null ||
    state.pricingFilter !== null ||
    state.matchIds !== null;
  if (!aOn && !bOn) return 0.03;
  if (filtering && (!aOn || !bOn)) return 0.06;

  const focus =
    state.hoverId === a.id ||
    state.hoverId === b.id ||
    state.selectedId === a.id ||
    state.selectedId === b.id;

  if (focus) return 0.95;
  if (edge.leading) return filtering ? 0.78 : 0.4;
  return filtering ? 0.4 : 0.14;
}

export function drawMesh(
  ctx: CanvasRenderingContext2D,
  laid: LaidOutNode[],
  state: MeshFrameState,
) {
  const { width: w, height: h, time, drift, scale, zoom, panX, panY } = state;
  ctx.clearRect(0, 0, w, h);

  const byId = new Map(laid.map((n) => [n.id, n]));
  const screen = new Map<string, { sx: number; sy: number }>();
  for (const n of laid) {
    screen.set(
      n.id,
      animatedPos(n, time, w, h, drift, scale, zoom, panX, panY),
    );
  }

  const filtering =
    state.filter !== null ||
    state.pricingFilter !== null ||
    state.matchIds !== null;

  // One clear polygon frame (hexagon) — no per-cluster hull clutter
  const frame = regularPolygon(6, state.compact ? 0.88 : 0.94, -Math.PI / 2);
  ctx.beginPath();
  frame.forEach((p, i) => {
    const s = toScreen(p.x, p.y, w, h, drift, scale, zoom, panX, panY);
    if (i === 0) ctx.moveTo(s.sx, s.sy);
    else ctx.lineTo(s.sx, s.sy);
  });
  ctx.closePath();
  ctx.fillStyle = "rgba(42, 235, 200, 0.03)";
  ctx.fill();
  ctx.strokeStyle = hexAlpha("#2aebc8", 0.55 + 0.15 * Math.sin(time * 0.0015));
  ctx.lineWidth = state.compact ? 1.4 : 1.85;
  ctx.setLineDash([]);
  ctx.stroke();

  // Inner accent rim
  const inner = regularPolygon(6, state.compact ? 0.82 : 0.88, -Math.PI / 2);
  ctx.beginPath();
  inner.forEach((p, i) => {
    const s = toScreen(p.x, p.y, w, h, drift, scale, zoom, panX, panY);
    if (i === 0) ctx.moveTo(s.sx, s.sy);
    else ctx.lineTo(s.sx, s.sy);
  });
  ctx.closePath();
  ctx.strokeStyle = hexAlpha("#3d9eff", 0.22);
  ctx.lineWidth = 1;
  ctx.setLineDash([5, 10]);
  ctx.lineDashOffset = -time * 0.025;
  ctx.stroke();
  ctx.setLineDash([]);

  for (const edge of graphEdges) {
    const a = screen.get(edge.from);
    const b = screen.get(edge.to);
    const na = byId.get(edge.from);
    const nb = byId.get(edge.to);
    if (!a || !b || !na || !nb) continue;

    const alpha = edgeAlpha(edge, byId, state);
    const color = categoryById(na.category).color;

    ctx.beginPath();
    ctx.moveTo(a.sx, a.sy);
    ctx.lineTo(b.sx, b.sy);
    ctx.strokeStyle = hexAlpha(color, alpha * 0.55);
    ctx.lineWidth = edge.leading ? 1.45 : 0.85;
    ctx.stroke();

    if (edge.leading && alpha > 0.2) {
      const speed = 0.00035 + (hash(edge.from + edge.to) % 100) / 400000;
      const t = (time * speed + hash(edge.from) / 1000) % 1;
      const px = a.sx + (b.sx - a.sx) * t;
      const py = a.sy + (b.sy - a.sy) * t;
      const grad = ctx.createRadialGradient(px, py, 0, px, py, 10);
      grad.addColorStop(0, hexAlpha("#2aebc8", 0.95));
      grad.addColorStop(1, hexAlpha("#2aebc8", 0));
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(px, py, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#e8eef5";
      ctx.beginPath();
      ctx.arc(px, py, 2.2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  for (const n of laid) {
    const s = screen.get(n.id)!;
    const active = isActiveNode(n, state);
    const focused =
      state.hoverId === n.id || state.selectedId === n.id;
    const searched = state.matchIds?.has(n.id) ?? false;
    const color = categoryById(n.category).color;
    const r = focused ? 7.5 : searched ? 5.5 : active ? 4.4 : 2.4;

    ctx.beginPath();
    ctx.arc(s.sx, s.sy, r + (focused || searched ? 6 : 2.5), 0, Math.PI * 2);
    ctx.fillStyle = hexAlpha(
      color,
      focused ? 0.25 : searched ? 0.18 : active ? 0.09 : 0.02,
    );
    ctx.fill();

    ctx.beginPath();
    ctx.arc(s.sx, s.sy, r, 0, Math.PI * 2);
    ctx.fillStyle = active ? color : hexAlpha(color, 0.2);
    ctx.fill();
    ctx.strokeStyle = hexAlpha(
      searched ? "#2aebc8" : "#e8eef5",
      focused ? 0.95 : active ? 0.4 : 0.18,
    );
    ctx.lineWidth = focused ? 1.6 : searched ? 1.3 : n.pricing === "paid" ? 1.1 : 0.7;
    ctx.stroke();

    const showLabel =
      state.showLabels &&
      active &&
      (focused ||
        searched ||
        filtering ||
        (!state.compact && hash(n.id) % 4 === 0) ||
        (state.compact && hash(n.id) % 6 === 0));

    if (showLabel) {
      ctx.font = `${focused || searched ? 600 : 500} ${focused ? 14 : 12}px "DM Sans", sans-serif`;
      ctx.fillStyle = hexAlpha(
        "#e8eef5",
        focused ? 0.95 : searched ? 0.9 : filtering ? 0.75 : 0.48,
      );
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      ctx.fillText(n.name, s.sx, s.sy + r + 5);
    }
  }

  // Domain titles on top of nodes so names stay readable
  if (state.showCategoryTitles) {
    for (const cat of categories) {
      const catActive = state.filter === null || state.filter === cat.id;
      if (state.filter && !catActive) continue;
      const center = clusterCenter(laid, cat.id);
      if (!center) continue;
      const s = toScreen(
        center.x,
        center.y,
        w,
        h,
        drift,
        scale,
        zoom,
        panX,
        panY,
      );
      const title = shortCategoryLabel(cat.label);
      const fontPx = state.compact
        ? 14
        : Math.max(16, Math.min(22, 17 * zoom));
      ctx.font = `700 ${fontPx}px "Syne", "DM Sans", sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      const metrics = ctx.measureText(title);
      const padX = 11;
      const padY = 7;
      const bw = metrics.width + padX * 2;
      const bh = fontPx + padY * 2;
      ctx.fillStyle = hexAlpha("#0b1118", catActive ? 0.82 : 0.4);
      ctx.strokeStyle = hexAlpha(cat.color, catActive ? 0.7 : 0.25);
      ctx.lineWidth = 1.25;
      roundRect(ctx, s.sx - bw / 2, s.sy - bh / 2, bw, bh, 3);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = hexAlpha("#e8eef5", catActive ? 0.98 : 0.45);
      ctx.fillText(title, s.sx, s.sy + 0.5);
    }
  }
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

/** Shorter titles that still read clearly on the mesh */
function shortCategoryLabel(label: string): string {
  const map: Record<string, string> = {
    "AI & ML": "AI & ML",
    LLMs: "LLMs",
    "AI Coding": "AI Coding",
    "Agentic AI": "Agentic AI",
    Frontier: "Frontier",
    Statistics: "Statistics",
    "Statistical Tools": "Stat Tools",
    "ETL Tools": "ETL Tools",
    Algorithms: "Algorithms",
    Techniques: "Techniques",
    Data: "Data",
    "Cloud & Infra": "Cloud",
    Hardware: "Hardware",
    "VLSI / Semicon": "VLSI",
    "Space / Rockets": "Space",
    "Banking / FinTech": "Banking",
    Healthcare: "Healthcare",
    "Energy / Utilities": "Energy",
    "Retail / Commerce": "Retail",
    "Industry Verticals": "Industry",
    "Enterprise / SAP": "Enterprise",
    "Web & Product": "Web",
    Languages: "Languages",
    Security: "Security",
    "Dev Tools": "Dev Tools",
  };
  return map[label] ?? label;
}

function hexAlpha(hex: string, alpha: number): string {
  const h = hex.replace("#", "");
  const full =
    h.length === 3
      ? h
          .split("")
          .map((c) => c + c)
          .join("")
      : h;
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${Math.max(0, Math.min(1, alpha))})`;
}

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 33 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

type CamState = Pick<
  MeshFrameState,
  "time" | "width" | "height" | "drift" | "scale" | "zoom" | "panX" | "panY"
>;

export function hitTestNode(
  laid: LaidOutNode[],
  state: CamState,
  mx: number,
  my: number,
  radius = 14,
): string | null {
  let best: string | null = null;
  let bestD = radius;
  for (const n of laid) {
    const s = animatedPos(
      n,
      state.time,
      state.width,
      state.height,
      state.drift,
      state.scale,
      state.zoom,
      state.panX,
      state.panY,
    );
    const d = Math.hypot(s.sx - mx, s.sy - my);
    if (d < bestD) {
      bestD = d;
      best = n.id;
    }
  }
  return best;
}

export function nodeScreenPos(
  node: LaidOutNode,
  state: CamState,
): { sx: number; sy: number } {
  return animatedPos(
    node,
    state.time,
    state.width,
    state.height,
    state.drift,
    state.scale,
    state.zoom,
    state.panX,
    state.panY,
  );
}
