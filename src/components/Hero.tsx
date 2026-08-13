import { motion } from "framer-motion";
import { MeshCanvas } from "./MeshCanvas";
import "./Hero.css";

interface HeroProps {
  onEnter: () => void;
}

export function Hero({ onEnter }: HeroProps) {
  return (
    <section className="hero" aria-label="Tech Polygon">
      <div className="atmosphere" aria-hidden="true" />
      <div className="hero__mesh" aria-hidden="true">
        <MeshCanvas compact showLabels={false} showCategoryTitles scale={0.58} />
      </div>
      <div className="hero__veil" aria-hidden="true" />

      <motion.p
        className="hero__brand"
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
      >
        <span className="brand__tech">Tech</span>
        <span className="brand__polygon">Polygon</span>
      </motion.p>

      <div className="hero__content">
        <motion.h1
          className="hero__line"
          initial={{ opacity: 0, x: -28 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.95, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
        >
          Every technology. One polygon.
        </motion.h1>
        <motion.p
          className="hero__sub"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.9, delay: 0.28, ease: [0.22, 1, 0.36, 1] }}
        >
          AI, agents, cloud, hardware, banking, health, energy, retail — mapped
          as one connected mesh.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.85, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
        >
          <button type="button" className="hero__cta" onClick={onEnter}>
            Enter the mesh
            <span className="hero__cta-arrow" aria-hidden="true">
              ↓
            </span>
          </button>
        </motion.div>
      </div>
    </section>
  );
}
