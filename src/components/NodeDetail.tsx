import { AnimatePresence, motion } from "framer-motion";
import {
  categoryById,
  graphEdges,
  nodeById,
  pricingLabels,
  type TechNode,
} from "../data/techWorld";
import "./NodeDetail.css";

interface NodeDetailProps {
  nodeId: string | null;
  onClose: () => void;
  onSelectRelated: (id: string) => void;
}

export function NodeDetail({ nodeId, onClose, onSelectRelated }: NodeDetailProps) {
  const node: TechNode | undefined = nodeId ? nodeById(nodeId) : undefined;
  const related = node
    ? graphEdges
        .filter((e) => e.from === node.id || e.to === node.id)
        .map((e) => (e.from === node.id ? e.to : e.from))
        .filter((id, i, arr) => arr.indexOf(id) === i)
        .slice(0, 10)
        .map((id) => nodeById(id))
        .filter(Boolean) as TechNode[]
    : [];

  return (
    <AnimatePresence>
      {node && (
        <motion.aside
          className="node-detail"
          key={node.id}
          initial={{ opacity: 0, x: 28 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 20 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          aria-label={`${node.name} details`}
        >
          <div className="node-detail__top">
            <span
              className="node-detail__cat"
              style={{ color: categoryById(node.category).color }}
            >
              {categoryById(node.category).label}
            </span>
            <button
              type="button"
              className="node-detail__close"
              onClick={onClose}
              aria-label="Close detail"
            >
              ✕
            </button>
          </div>
          <h3 className="node-detail__title">{node.name}</h3>
          <p
            className={`node-detail__price node-detail__price--${node.pricing}`}
          >
            {pricingLabels[node.pricing]}
          </p>
          <p className="node-detail__blurb">{node.blurb}</p>
          {node.link && (
            <a
              className="node-detail__link"
              href={node.link}
              target="_blank"
              rel="noreferrer"
            >
              Learn more →
            </a>
          )}
          {related.length > 0 && (
            <div className="node-detail__related">
              <p className="node-detail__related-label">Connected edges</p>
              <ul>
                {related.map((r) => (
                  <li key={r.id}>
                    <button
                      type="button"
                      onClick={() => onSelectRelated(r.id)}
                    >
                      {r.name}
                      <span className="node-detail__rel-price">
                        {pricingLabels[r.pricing]}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
