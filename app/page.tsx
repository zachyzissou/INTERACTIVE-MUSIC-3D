"use client";
import { Canvas } from "@react-three/fiber";
import { Physics } from "@react-three/rapier";
import { PerspectiveCamera, AdaptiveDpr } from "@react-three/drei";
import MusicalObject from "@/components/MusicalObject";
import SpawnMenu from "@/components/SpawnMenu";
import SoundPortals from "@/components/SoundPortals";
import { EffectsPanel } from "@/components/EffectsPanel";
import SoundInspector from "@/components/SoundInspector";
import { useEffectSettings } from "@/store/useEffectSettings";
import { useObjects } from "@/store/useObjects";
import ExampleModal from "@/components/ExampleModal";

export default function Home() {
  const selected = useEffectSettings((s) => s.selected);
  const objects = useObjects((s) => s.objects);
  const objType = objects.find((o) => o.id === selected)?.type;

  return (
    <>
      <Canvas className="fixed inset-0" shadows>
        <AdaptiveDpr pixelated />
        <Physics>
          <PerspectiveCamera makeDefault fov={50} position={[0, 5, 10]} />
          <ambientLight intensity={0.4} />
          <directionalLight position={[5, 10, 5]} intensity={0.8} castShadow />
          <pointLight position={[0, 5, -5]} intensity={0.5} />
          <MusicalObject />
          <SoundPortals />
        </Physics>
      </Canvas>
      <SpawnMenu />
      <ExampleModal />
      {selected && objType && (
        <SoundInspector objectId={selected} type={objType} />
      )}
      <div className="fixed bottom-4 right-4">
        <EffectsPanel />
      </div>
    </>
  );
}
