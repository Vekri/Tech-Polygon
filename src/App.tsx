import { useCallback } from "react";
import { Hero } from "./components/Hero";
import { Constellation } from "./components/Constellation";
import "./styles/global.css";
import "./App.css";

function App() {
  const enterMesh = useCallback(() => {
    document.getElementById("mesh")?.scrollIntoView({ behavior: "smooth" });
  }, []);

  return (
    <div className="app">
      <Hero onEnter={enterMesh} />
      <Constellation />
      <footer className="app__footer">
        <span>Tech Polygon</span>
        <span className="app__footer-sep" aria-hidden="true">
          ·
        </span>
        <span>IT world as a living mesh</span>
      </footer>
    </div>
  );
}

export default App;
