"use client";
import { Canvas } from "@react-three/fiber";
import ProceduralShapes from "@/components/ProceduralShapes";
import SoundInspector from "@/components/SoundInspector";
import { useObjects } from "@/store/useObjects";
import { useEffectSettings } from "@/store/useEffectSettings";

const Home = () => {
  const spawn = useObjects((s) => s.spawn);

  const handleAdd = () => {
    spawn("note");
  };

  const selected = useEffectSettings((s) => s.selected);
  const objects = useObjects((s) => s.objects);
  const selObj = objects.find((o) => o.id === selected);

  return (
    <>
      <Canvas className="fixed inset-0" shadows>
        <ambientLight intensity={0.5} />
        <ProceduralShapes />
      </Canvas>
      {selObj && <SoundInspector objectId={selObj.id} type={selObj.type} />}
      <button
        className="add-sound fixed bottom-4 right-4 bg-white/80 text-black rounded-full w-12 h-12 md:w-14 md:h-14 flex items-center justify-center text-2xl"
        onClick={handleAdd}
      >
        +
      </button>
    </>
  );
};

export default Home;
