import { useCallback, useEffect, useRef, useState } from "react";
import "./AmbientToggle.css";

const TRACK = `${import.meta.env.BASE_URL}galaxy-ambient.mp3`;

type Props = {
  /** Bumps when parent wants sound started from a user gesture */
  playSignal?: number;
};

export function AmbientToggle({ playSignal = 0 }: Props) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [on, setOn] = useState(false);
  const [error, setError] = useState(false);

  const play = useCallback(async () => {
    const audio = audioRef.current;
    if (!audio) return;
    setError(false);
    try {
      audio.muted = false;
      audio.volume = 0.7;
      await audio.play();
      setOn(true);
    } catch {
      setError(true);
      setOn(false);
    }
  }, []);

  const pause = useCallback(() => {
    const audio = audioRef.current;
    if (audio) audio.pause();
    setOn(false);
  }, []);

  useEffect(() => {
    if (playSignal > 0) void play();
  }, [playSignal, play]);

  return (
    <>
      <audio
        ref={audioRef}
        src={TRACK}
        loop
        preload="auto"
        playsInline
      />
      <button
        type="button"
        className={`ambient-toggle${on ? " ambient-toggle--on" : ""}${error ? " ambient-toggle--error" : ""}`}
        onClick={() => {
          if (on) pause();
          else void play();
        }}
        aria-pressed={on}
        aria-label={on ? "Stop galaxy sound" : "Play galaxy sound"}
      >
        <span className="ambient-toggle__icon" aria-hidden="true">
          {on ? "♪" : "♫"}
        </span>
        <span className="ambient-toggle__label">
          {error ? "Click to retry" : on ? "Sound on" : "Play sound"}
        </span>
      </button>
      {error ? (
        <p className="ambient-toggle__error" role="status">
          Sound blocked — click Play sound again
        </p>
      ) : null}
    </>
  );
}
