import { useEffect, useRef } from "react";
import "./Starfield.css";

type Star = {
  x: number;
  y: number;
  z: number;
  r: number;
  tw: number;
  sp: number;
};

export function Starfield() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    let w = 0;
    let h = 0;
    let stars: Star[] = [];
    const start = performance.now();

    const resize = () => {
      const parent = canvas.parentElement;
      w = parent?.clientWidth || window.innerWidth;
      h = parent?.clientHeight || window.innerHeight;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const count = Math.min(220, Math.floor((w * h) / 9000));
      stars = Array.from({ length: count }, (_, i) => ({
        x: Math.random() * w,
        y: Math.random() * h,
        z: 0.25 + Math.random() * 0.75,
        r: 0.4 + Math.random() * 1.6,
        tw: Math.random() * Math.PI * 2,
        sp: 0.015 + Math.random() * 0.04 + (i % 7 === 0 ? 0.05 : 0),
      }));
    };

    const draw = (now: number) => {
      const t = (now - start) / 1000;
      ctx.clearRect(0, 0, w, h);

      // Deep space base
      const g1 = ctx.createRadialGradient(
        w * 0.62,
        h * 0.38,
        0,
        w * 0.55,
        h * 0.45,
        Math.max(w, h) * 0.7,
      );
      g1.addColorStop(0, "rgba(28, 58, 98, 0.35)");
      g1.addColorStop(0.45, "rgba(14, 28, 48, 0.22)");
      g1.addColorStop(1, "rgba(8, 12, 20, 0)");
      ctx.fillStyle = g1;
      ctx.fillRect(0, 0, w, h);

      // Nebula wash
      const g2 = ctx.createRadialGradient(
        w * 0.78,
        h * 0.72,
        0,
        w * 0.75,
        h * 0.7,
        Math.max(w, h) * 0.45,
      );
      g2.addColorStop(0, "rgba(42, 235, 200, 0.08)");
      g2.addColorStop(0.55, "rgba(61, 158, 255, 0.05)");
      g2.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = g2;
      ctx.fillRect(0, 0, w, h);

      const g3 = ctx.createRadialGradient(
        w * 0.2,
        h * 0.25,
        0,
        w * 0.22,
        h * 0.28,
        Math.max(w, h) * 0.35,
      );
      g3.addColorStop(0, "rgba(90, 70, 180, 0.07)");
      g3.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = g3;
      ctx.fillRect(0, 0, w, h);

      for (const s of stars) {
        // Drift toward viewer (space travel feel)
        s.y += s.sp * s.z * 18;
        s.x += Math.sin(t * 0.15 + s.tw) * 0.08 * s.z;
        if (s.y > h + 4) {
          s.y = -4;
          s.x = Math.random() * w;
        }

        const twinkle =
          0.45 + 0.55 * (0.5 + 0.5 * Math.sin(t * (1.2 + s.z) + s.tw));
        const alpha = (0.25 + 0.75 * s.z) * twinkle;
        const radius = s.r * (0.7 + s.z * 0.9);

        ctx.beginPath();
        ctx.arc(s.x, s.y, radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(220, 235, 255, ${alpha})`;
        ctx.fill();

        if (s.z > 0.7) {
          ctx.beginPath();
          ctx.arc(s.x, s.y, radius * 2.4, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(61, 158, 255, ${alpha * 0.18})`;
          ctx.fill();
        }

        // Motion streak for nearer stars
        if (s.z > 0.85) {
          ctx.strokeStyle = `rgba(180, 220, 255, ${alpha * 0.35})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(s.x, s.y);
          ctx.lineTo(s.x, s.y - s.sp * 28);
          ctx.stroke();
        }
      }

      raf = requestAnimationFrame(draw);
    };

    resize();
    raf = requestAnimationFrame(draw);
    window.addEventListener("resize", resize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas className="starfield" ref={canvasRef} aria-hidden="true" />
  );
}
