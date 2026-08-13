import { useEffect, useRef, useState } from "react";
import { createGalaxyAmbient } from "../lib/galaxyAmbient";
import "./AmbientToggle.css";

export function AmbientToggle() {
  const ambientRef = useRef(createGalaxyAmbient());
  const [on, setOn] = useState(false);

  useEffect(() => {
    const ambient = ambientRef.current;
    return () => ambient.stop();
  }, []);

  const toggle = async () => {
    const ambient = ambientRef.current;
    if (!on) {
      await ambient.start();
      ambient.setMuted(false);
      setOn(true);
      return;
    }
    ambient.setMuted(true);
    ambient.stop();
    setOn(false);
  };

  return (
    <button
      type="button"
      className={`ambient-toggle${on ? " ambient-toggle--on" : ""}`}
      onClick={() => void toggle()}
      aria-pressed={on}
      aria-label={on ? "Mute galaxy ambient" : "Play galaxy ambient"}
      title={on ? "Mute ambient" : "Play galaxy ambient"}
    >
      <span className="ambient-toggle__icon" aria-hidden="true">
        {on ? "◉" : "◎"}
      </span>
      <span className="ambient-toggle__label">
        {on ? "Ambient on" : "Ambient"}
      </span>
    </button>
  );
}
