"use client";
import React, { useState } from 'react';
import scenes from "@/config/exampleScenes.json";
import { useObjects } from "@/store/useObjects";
import type { ObjectType } from "@/store/useObjects";

const ExampleModal: React.FC = () => {
  const [open, setOpen] = useState(false);
  const spawn = useObjects((s) => s.spawn);

  const load = (scene: (typeof scenes)[0]) => {
    scene.objects.forEach(obj =>
      spawn(obj.type as ObjectType, obj.position as [number, number, number])
    );
    setOpen(false);
  };

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-10"
        >
          <div className="bg-white p-4 rounded">
            <h2 className="mb-2 font-bold">Load Example Scene</h2>
            {scenes.map(scene => (
              <button key={scene.name} className="block w-full text-left mb-1 p-1 bg-gray-200" onClick={() => load(scene)}>
                {scene.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  );
};

export default ExampleModal;
