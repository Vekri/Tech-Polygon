import { useCallback, useState } from "react";
import { Hero } from "./components/Hero";
import { Constellation } from "./components/Constellation";
import { AmbientToggle } from "./components/AmbientToggle";
import "./styles/global.css";
import "./App.css";

function App() {
  const [soundSignal, setSoundSignal] = useState(0);

  const enterMesh = useCallback(() => {
    setSoundSignal((n) => n + 1);
    document.getElementById("mesh")?.scrollIntoView({ behavior: "smooth" });
  }, []);

  return (
    <div className="app">
      <Hero onEnter={enterMesh} />
      <Constellation />
      <AmbientToggle playSignal={soundSignal} />
      <footer className="app__footer">
        <span>Tech Polygon</span>
        <span className="app__footer-sep" aria-hidden="true">
          ·
        </span>
        <span>Every technology. One polygon.</span>
      </footer>
    </div>
  );
}

export default App;
