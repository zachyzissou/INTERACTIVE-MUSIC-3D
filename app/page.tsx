"use client";
import dynamic from "next/dynamic";
import ZoomHUD from "@/components/ZoomHUD";
import { useAudioSettings } from "@/store/useAudioSettings";
import { useObjects } from "@/store/useObjects";
import { assertPrimitives } from "@/lib/assertPrimitives";

const SceneCanvas = dynamic(() => import("@/components/SceneCanvas"), {
  ssr: false,
});

const Home = () => {
  const key = useAudioSettings((s) => s.key);
  const scale = useAudioSettings((s) => s.scale);
  const objects = useObjects((s) => s.objects);

  assertPrimitives({ key, scale, objects }, 'pageData');

  return (
    <div style={{ height: '100vh', width: '100vw', position: 'relative' }}>
      <SceneCanvas />
      <ZoomHUD />
    </div>
  );
};

export default Home;
