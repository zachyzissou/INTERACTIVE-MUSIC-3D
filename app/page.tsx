"use client";
import dynamic from "next/dynamic";
import ZoomHUD from "@/components/ZoomHUD";

const SceneCanvas = dynamic(() => import("@/components/SceneCanvas"), {
  ssr: false,
});

const Home = () => {
  return (
    <div style={{ height: '100vh', width: '100vw', position: 'relative' }}>
      <SceneCanvas />
      <ZoomHUD />
    </div>
  );
};

export default Home;
