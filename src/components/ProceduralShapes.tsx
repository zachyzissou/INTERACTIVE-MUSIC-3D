"use client";
import React, { useEffect, useRef, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { getAnalyser } from "@/lib/analyser";
import { useObjects } from "@/store/useObjects";
import { useEffectSettings } from "@/store/useEffectSettings";

const tempObject = new THREE.Object3D();

const ProceduralShapes: React.FC = () => {
  const objects = useObjects((s) => s.objects);
  const select = useEffectSettings((s) => s.select);
  const instRef = useRef<THREE.InstancedMesh>(null!);
  const dataRef = useRef<Uint8Array | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const positions = useRef<THREE.Vector3[]>([]);
  const { raycaster, mouse, camera } = useThree();
  const plane = useRef(new THREE.Plane(new THREE.Vector3(0, 1, 0), 0));
  const hit = useRef(new THREE.Vector3());
  const prevLevel = useRef(0);

  useEffect(() => {
    analyserRef.current = getAnalyser();
    dataRef.current = new Uint8Array(analyserRef.current.frequencyBinCount);
  }, []);

  useEffect(() => {
    positions.current = objects.map((o) => new THREE.Vector3(...o.position));
    if (instRef.current) instRef.current.count = objects.length;
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
      const scale = 0.8 + level * 1.2;
      tempObject.position.copy(pos);
      tempObject.scale.setScalar(scale);
      tempObject.updateMatrix();
      instRef.current.setMatrixAt(i, tempObject.matrix);
    }
    instRef.current.instanceMatrix.needsUpdate = true;
  });

  const handlePointerDown = (e: any) => {
    e.stopPropagation();
    setDragIndex(e.instanceId);
  };

  const handlePointerUp = (e: any) => {
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
