"use client";
import dynamic from "next/dynamic";
import { useState } from "react";
import sliderStyles from "@/styles/slider.module.css";

const SceneCanvas = dynamic(() => import("@/components/SceneCanvas"), {
  ssr: false,
});

const Home = () => {
  const [fov, setFov] = useState(50);

  return (
    <div style={{ height: '100vh', width: '100vw', position: 'relative' }}>
      <SceneCanvas fov={fov} />

      <div className={sliderStyles.sliderWrapper}>
        <label style={{ color: '#fff', marginRight: '0.5rem' }}>FOV:</label>
        <input
          type="range"
          min={30}
          max={100}
          step={1}
          value={fov}
          onChange={(e) => setFov(parseFloat(e.target.value))}
        />
      </div>
    </div>
  );
};

export default Home;
