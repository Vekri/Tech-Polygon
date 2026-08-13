import { useEffect, useRef, useState } from "react";
import "./AmbientToggle.css";

const TRACK = "/galaxy-ambient.mp3";

export function AmbientToggle() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [on, setOn] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    const audio = new Audio(TRACK);
    audio.loop = true;
    audio.preload = "auto";
    audio.volume = 0.55;
    audioRef.current = audio;

    return () => {
      audio.pause();
      audio.src = "";
      audioRef.current = null;
    };
  }, []);

  const toggle = async () => {
    const audio = audioRef.current;
    if (!audio) return;
    setError(false);

    try {
      if (!on) {
        audio.currentTime = 0;
        await audio.play();
        setOn(true);
        return;
      }
      audio.pause();
      setOn(false);
    } catch {
      setError(true);
      setOn(false);
    }
  };

  return (
    <button
      type="button"
      className={`ambient-toggle${on ? " ambient-toggle--on" : ""}${error ? " ambient-toggle--error" : ""}`}
      onClick={() => void toggle()}
      aria-pressed={on}
      aria-label={on ? "Mute galaxy ambient" : "Play galaxy ambient"}
      title={
        error
          ? "Could not play audio — click again"
          : on
            ? "Mute ambient"
            : "Play galaxy ambient"
      }
    >
      <span className="ambient-toggle__icon" aria-hidden="true">
        {on ? "♪" : "♫"}
      </span>
      <span className="ambient-toggle__label">
        {error ? "Retry sound" : on ? "Sound on" : "Sound"}
      </span>
    </button>
  );
}
