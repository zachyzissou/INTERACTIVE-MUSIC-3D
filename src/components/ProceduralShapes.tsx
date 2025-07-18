"use client";
import React, { useEffect, useRef, useState } from "react";
import { useFrame, useThree, ThreeEvent } from "@react-three/fiber";
import * as THREE from "three";
import { getAnalyser } from "@/lib/analyser";
import { useObjects } from "@/store/useObjects";
import { useSelectedShape } from "@/store/useSelectedShape";
import { useAudioSettings } from "@/store/useAudioSettings";

type EffectSnapshot = {
  chorusDepth: number;
  reverbWet: number;
  delayFeedback: number;
  bitcrusherBits: number;
  filterFrequency: number;
};

const tempObject = new THREE.Object3D();

const ProceduralShapes: React.FC = () => {
  const objects = useObjects((s) => s.objects);
  const select = useSelectedShape((s) => s.selectShape);
  const instRef = useRef<THREE.InstancedMesh>(null!);
  const dataRef = useRef<Uint8Array | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const positions = useRef<THREE.Vector3[]>([]);
  const effectsMap = useRef<Map<string, EffectSnapshot>>(new Map());
  const { raycaster, mouse, camera } = useThree();
  const plane = useRef(new THREE.Plane(new THREE.Vector3(0, 1, 0), 0));
  const hit = useRef(new THREE.Vector3());
  const prevLevel = useRef(0);

  useEffect(() => {
    const analyser = getAnalyser();
    if (analyser) {
      analyserRef.current = analyser;
      dataRef.current = new Uint8Array(analyser.frequencyBinCount);
    }
  }, []);

  useEffect(() => {
    positions.current = objects.map((o) => new THREE.Vector3(...o.position));
    if (instRef.current) instRef.current.count = objects.length;
    objects.forEach((o) => {
      if (!effectsMap.current.has(o.id)) {
        const {
          chorusDepth,
          reverbWet,
          delayFeedback,
          bitcrusherBits,
          filterFrequency,
        } = useAudioSettings.getState();
        effectsMap.current.set(o.id, {
          chorusDepth,
          reverbWet,
          delayFeedback,
          bitcrusherBits,
          filterFrequency,
        });
      }
    });
  }, [objects]);

  useFrame(() => {
    if (!instRef.current || !analyserRef.current || !dataRef.current) return;
    analyserRef.current.getByteFrequencyData(dataRef.current);
    const len = dataRef.current.length;
    let low = 0,
      mid = 0,
      high = 0;
    for (let i = 0; i < len; i++) {
      if (i < len / 3) low += dataRef.current[i];
      else if (i < (2 * len) / 3) mid += dataRef.current[i];
      else high += dataRef.current[i];
    }
    low /= len / 3;
    mid /= len / 3;
    high /= len / 3;
    const level = (low + mid + high) / 3 / 255;
    if (Math.abs(level - prevLevel.current) < 0.02 && dragIndex === null) return;
    prevLevel.current = level;

    if (dragIndex !== null) {
      raycaster.setFromCamera(mouse, camera);
      raycaster.ray.intersectPlane(plane.current, hit.current);
      positions.current[dragIndex].copy(hit.current);
    }

    for (let i = 0; i < objects.length; i++) {
      const pos = positions.current[i];
      const effect = effectsMap.current.get(objects[i].id);
      const intensity = effect
        ?
            effect.reverbWet +
            effect.chorusDepth +
            effect.delayFeedback +
            (16 - effect.bitcrusherBits) / 16 +
            effect.filterFrequency / 1000
        : 0;
      const scale = 0.8 + level * 1.2 + intensity * 0.2;
      tempObject.position.copy(pos);
      tempObject.scale.setScalar(scale);
      tempObject.updateMatrix();
      instRef.current.setMatrixAt(i, tempObject.matrix);
      const color = new THREE.Color("hotpink").offsetHSL(0, 0, intensity * 0.2);
      instRef.current.setColorAt(i, color);
    }
    instRef.current.instanceMatrix.needsUpdate = true;
    if (instRef.current.instanceColor) instRef.current.instanceColor.needsUpdate = true;
  });

  const handlePointerDown = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    setDragIndex(e.instanceId ?? null);
  };

  const handlePointerUp = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    if (dragIndex === e.instanceId) select(objects[e.instanceId].id);
    setDragIndex(null);
  };

  return (
    <instancedMesh
      ref={instRef}
      args={[new THREE.BoxGeometry(1, 1, 1), new THREE.MeshStandardMaterial({ color: "hotpink" }), objects.length]}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerMissed={() => setDragIndex(null)}
    />
  );
};

export default ProceduralShapes;
