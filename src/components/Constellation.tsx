import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  nodes,
  type CategoryId,
  type Pricing,
  type TechNode,
} from "../data/techWorld";
import { MeshCanvas } from "./MeshCanvas";
import { CategoryFilter } from "./CategoryFilter";
import { NodeDetail } from "./NodeDetail";
import { TechSearch } from "./TechSearch";
import { Starfield } from "./Starfield";
import "./Constellation.css";

export function Constellation() {
  const [filter, setFilter] = useState<CategoryId | null>(null);
  const [pricing, setPricing] = useState<Pricing | null>(null);
  const [hoverId, setHoverId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [matchIds, setMatchIds] = useState<Set<string> | null>(null);
  const [zoom, setZoom] = useState(1);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const [compact, setCompact] = useState(
    () => typeof window !== "undefined" && window.innerWidth < 720,
  );

  useEffect(() => {
    const onResize = () => setCompact(window.innerWidth < 720);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const visibleCount = useMemo(
    () =>
      nodes.filter((n) => {
        const catOk = filter === null || n.category === filter;
        const priceOk = pricing === null || n.pricing === pricing;
        const searchOk = !matchIds || matchIds.has(n.id);
        return catOk && priceOk && searchOk;
      }).length,
    [filter, pricing, matchIds],
  );

  const focusNode = (node: TechNode) => {
    setSelectedId(node.id);
    setFilter(node.category);
    setMatchIds(new Set([node.id]));
    setZoom(1.55);
    setPanX(0);
    setPanY(0);
  };

  const resetView = () => {
    setZoom(1);
    setPanX(0);
    setPanY(0);
    setMatchIds(null);
  };

  return (
    <section
      id="mesh"
      className="constellation"
      aria-label="Technology constellation"
    >
      <div className="atmosphere constellation__atmosphere" aria-hidden="true" />

      <div className="constellation__main">
        <div className="constellation__header">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.6 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          >
            <p className="constellation__sub">
              Domain titles sit on the mesh — Banking, Healthcare, Energy,
              Retail, and every cluster.
              <span className="constellation__count">
                {" "}
                Showing {visibleCount}
              </span>
            </p>
          </motion.div>

          <div className="constellation__tools">
            <TechSearch
              onPick={focusNode}
              onQueryChange={(_q, matches) => {
                setMatchIds(
                  matches.length > 0
                    ? new Set(matches.map((m) => m.id))
                    : null,
                );
              }}
            />
            <div
              className="mesh-controls"
              role="group"
              aria-label="Map controls"
            >
              <button
                type="button"
                onClick={() => setZoom((z) => Math.min(3.2, z * 1.15))}
                aria-label="Zoom in"
              >
                +
              </button>
              <button
                type="button"
                onClick={() => setZoom((z) => Math.max(0.55, z / 1.15))}
                aria-label="Zoom out"
              >
                −
              </button>
              <button
                type="button"
                onClick={resetView}
                aria-label="Reset view"
              >
                Reset
              </button>
              <span className="mesh-controls__zoom">
                {Math.round(zoom * 100)}%
              </span>
            </div>
          </div>

          <CategoryFilter
            active={filter}
            pricing={pricing}
            onChange={setFilter}
            onPricingChange={setPricing}
          />
        </div>

        <div className="constellation__stage">
          <div className="constellation__cosmos" aria-hidden="true">
            <Starfield />
          </div>
          <p className="constellation__brand">
            <span className="brand__tech">Tech</span>
            <span className="brand__polygon">Polygon</span>
          </p>
          <p className="constellation__line">
            Every technology. One polygon.
          </p>
          <p className="constellation__hint">
            Scroll to zoom · Drag to pan · Click a node
          </p>
          <MeshCanvas
            interactive
            showLabels
            showCategoryTitles
            compact={compact}
            filter={filter}
            pricingFilter={pricing}
            hoverId={hoverId}
            selectedId={selectedId}
            matchIds={matchIds}
            scale={compact ? 0.62 : 0.56}
            zoom={zoom}
            panX={panX}
            panY={panY}
            onHover={setHoverId}
            onSelect={(id) => setSelectedId(id)}
            onViewChange={({ zoom: z, panX: x, panY: y }) => {
              setZoom(z);
              setPanX(x);
              setPanY(y);
            }}
          />
          <NodeDetail
            nodeId={selectedId}
            onClose={() => setSelectedId(null)}
            onSelectRelated={setSelectedId}
          />
        </div>
      </div>
    </section>
  );
}
