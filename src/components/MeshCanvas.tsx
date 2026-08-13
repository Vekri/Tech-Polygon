import { useEffect, useMemo, useRef } from "react";
import { layoutNodes } from "../lib/layout";
import { drawMesh, hitTestNode } from "../lib/drawMesh";
import type { CategoryId, Pricing } from "../data/techWorld";
import "./MeshCanvas.css";

interface MeshCanvasProps {
  compact?: boolean;
  showLabels?: boolean;
  showCategoryTitles?: boolean;
  interactive?: boolean;
  filter?: CategoryId | null;
  pricingFilter?: Pricing | null;
  hoverId?: string | null;
  selectedId?: string | null;
  matchIds?: Set<string> | null;
  scale?: number;
  zoom?: number;
  panX?: number;
  panY?: number;
  className?: string;
  onHover?: (id: string | null) => void;
  onSelect?: (id: string | null) => void;
  onViewChange?: (view: { zoom: number; panX: number; panY: number }) => void;
}

export function MeshCanvas({
  compact = false,
  showLabels = false,
  showCategoryTitles = true,
  interactive = false,
  filter = null,
  pricingFilter = null,
  hoverId = null,
  selectedId = null,
  matchIds = null,
  scale = 0.38,
  zoom = 1,
  panX = 0,
  panY = 0,
  className = "",
  onHover,
  onSelect,
  onViewChange,
}: MeshCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const laid = useMemo(() => layoutNodes(), []);
  const dragRef = useRef<{
    active: boolean;
    moved: boolean;
    x: number;
    y: number;
    panX: number;
    panY: number;
  } | null>(null);

  const stateRef = useRef({
    time: 0,
    filter,
    pricingFilter,
    hoverId,
    selectedId,
    matchIds,
    compact,
    showLabels,
    showCategoryTitles,
    scale,
    zoom,
    panX,
    panY,
  });

  stateRef.current = {
    time: stateRef.current.time,
    filter,
    pricingFilter,
    hoverId,
    selectedId,
    matchIds,
    compact,
    showLabels,
    showCategoryTitles,
    scale,
    zoom,
    panX,
    panY,
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    let running = true;
    const start = performance.now();

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const { clientWidth: w, clientHeight: h } = wrap;
      canvas.width = Math.max(1, Math.floor(w * dpr));
      canvas.height = Math.max(1, Math.floor(h * dpr));
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(wrap);

    const loop = (now: number) => {
      if (!running) return;
      const { clientWidth: w, clientHeight: h } = wrap;
      const s = stateRef.current;
      s.time = now - start;
      drawMesh(ctx, laid, {
        time: s.time,
        width: w,
        height: h,
        drift: s.time * 0.00004,
        scale: s.scale,
        zoom: s.zoom,
        panX: s.panX,
        panY: s.panY,
        filter: s.filter,
        pricingFilter: s.pricingFilter,
        hoverId: s.hoverId,
        selectedId: s.selectedId,
        compact: s.compact,
        showLabels: s.showLabels,
        showCategoryTitles: s.showCategoryTitles,
        matchIds: s.matchIds,
      });
      raf = requestAnimationFrame(loop);
    };

    raf = requestAnimationFrame(loop);

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [laid]);

  const cam = () => {
    const s = stateRef.current;
    const wrap = wrapRef.current!;
    const rect = wrap.getBoundingClientRect();
    return {
      time: s.time,
      width: rect.width,
      height: rect.height,
      drift: s.time * 0.00004,
      scale: s.scale,
      zoom: s.zoom,
      panX: s.panX,
      panY: s.panY,
    };
  };

  const resolveHit = (clientX: number, clientY: number) => {
    const wrap = wrapRef.current;
    if (!wrap) return null;
    const rect = wrap.getBoundingClientRect();
    return hitTestNode(
      laid,
      cam(),
      clientX - rect.left,
      clientY - rect.top,
      Math.max(12, 14 * stateRef.current.zoom),
    );
  };

  return (
    <div
      ref={wrapRef}
      className={`mesh-canvas ${interactive ? "mesh-canvas--interactive" : ""} ${className}`}
      onWheel={
        interactive && onViewChange
          ? (e) => {
              e.preventDefault();
              const s = stateRef.current;
              const next = Math.min(
                3.2,
                Math.max(0.55, s.zoom * (e.deltaY < 0 ? 1.1 : 0.9)),
              );
              onViewChange({ zoom: next, panX: s.panX, panY: s.panY });
            }
          : undefined
      }
      onPointerDown={
        interactive
          ? (e) => {
              (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
              dragRef.current = {
                active: true,
                moved: false,
                x: e.clientX,
                y: e.clientY,
                panX: stateRef.current.panX,
                panY: stateRef.current.panY,
              };
            }
          : undefined
      }
      onPointerMove={
        interactive
          ? (e) => {
              const drag = dragRef.current;
              if (drag?.active && onViewChange) {
                const dx = e.clientX - drag.x;
                const dy = e.clientY - drag.y;
                if (Math.hypot(dx, dy) > 4) drag.moved = true;
                if (drag.moved) {
                  onViewChange({
                    zoom: stateRef.current.zoom,
                    panX: drag.panX + dx,
                    panY: drag.panY + dy,
                  });
                  onHover?.(null);
                  return;
                }
              }
              onHover?.(resolveHit(e.clientX, e.clientY));
            }
          : undefined
      }
      onPointerUp={
        interactive
          ? (e) => {
              const drag = dragRef.current;
              dragRef.current = null;
              if (!drag?.moved) {
                onSelect?.(resolveHit(e.clientX, e.clientY));
              }
            }
          : undefined
      }
      onPointerLeave={
        interactive
          ? () => {
              dragRef.current = null;
              onHover?.(null);
            }
          : undefined
      }
      role={interactive ? "application" : undefined}
      aria-label={
        interactive
          ? "Interactive technology constellation. Scroll to zoom, drag to pan."
          : undefined
      }
    >
      <canvas ref={canvasRef} />
    </div>
  );
}
