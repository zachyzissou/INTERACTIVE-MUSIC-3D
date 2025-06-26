"use client";
import React, { useEffect, useRef, useState } from "react";
import { motion } from "@motionone/react";
import Knob from "./JSAudioKnobs";
import type * as ToneType from "tone";
import { getTone, playNote, playChord, playBeat, isAudioInitialized, onAudioInit } from "@/lib/audio";
import { useEffectSettings, defaultEffectParams } from "@/store/useEffectSettings";
import { ObjectType } from "@/store/useObjects";
import { useAudioSettings } from "@/store/useAudioSettings";

interface Props { objectId: string; type: ObjectType; }

const stepsArray = new Array(16).fill(false);

function chordNotes(root: string, type: string) {
  const Tone = getTone() as typeof ToneType | null
  if (!Tone) return [root]
  const base = Tone.Frequency(root);
  const intervals = type === "minor" ? [0, 3, 7] : type === "dim" ? [0, 3, 6] : [0, 4, 7];
  return intervals.map((i) => base.transpose(i).toNote());
}

const SoundInspector: React.FC<Props> = ({ objectId, type }) => {
  const params = useEffectSettings((s) => s.effects[objectId] || defaultEffectParams);
  const setEffect = useEffectSettings((s) => s.setEffect);
  const [steps, setSteps] = useState<boolean[]>(stepsArray);
  const seqRef = useRef<ToneType.Sequence | null>(null);
  const [pitch, setPitch] = useState("C4");
  const [chordType, setChordType] = useState("major");
  const bpm = useAudioSettings((s) => s.bpm);
  const [audioReady, setAudioReady] = useState(isAudioInitialized());

  useEffect(() => onAudioInit(() => setAudioReady(true)), []);

  useEffect(() => {
    if (audioReady) {
      const Tone = getTone()!
      Tone.Transport.bpm.value = bpm
    }
  }, [bpm, audioReady])

  useEffect(() => {
    if (!audioReady) return;
    const Tone = getTone()!

    seqRef.current?.dispose();
    const callback = (_time: number, step: boolean) => {
      if (!step) return;
      if (type === "note") playNote(objectId, pitch);
      else if (type === "chord") playChord(objectId, chordNotes(pitch, chordType));
      else if (type === "beat") playBeat(objectId);
    };
    const seq = new Tone.Sequence(callback, steps, "16n");
    seq.start(0);
    if (Tone.Transport.state !== "started") Tone.Transport.start();
    seqRef.current = seq;
    return () => {
      seq.dispose();
    };
  }, [steps, pitch, chordType, type, objectId, audioReady]);

  const toggleStep = (i: number) => {
    const arr = [...steps];
    arr[i] = !arr[i];
    setSteps(arr);
  };

  return (
    <motion.div
      key="panel"
      className="fixed top-2 right-2 bg-black/60 text-white p-4 rounded-lg flex flex-col gap-2 w-56 md:w-72"
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 50 }}
    >
      <div className="flex gap-2">
        <Knob label="Reverb" min={0} max={1} step={0.01} value={params.reverb} onChange={(e)=>setEffect(objectId,{reverb:parseFloat(e.target.value)})} />
        <Knob label="Delay" min={0} max={1} step={0.01} value={params.delay} onChange={(e)=>setEffect(objectId,{delay:parseFloat(e.target.value)})} />
        <Knob label="Lowpass" min={100} max={20000} step={100} value={params.lowpass} onChange={(e)=>setEffect(objectId,{lowpass:parseFloat(e.target.value)})} />
      </div>
      {type === "note" && (
        <div className="grid grid-cols-8 gap-1 mt-2">
          {steps.map((s,i)=> (
            <input key={i} type="checkbox" checked={s} onChange={()=>toggleStep(i)} />
          ))}
          <select value={pitch} onChange={(e)=>setPitch(e.target.value)} className="col-span-8 text-black p-1 rounded mt-1">
            {['C4','D4','E4','F4','G4','A4','B4'].map(p=>(<option key={p}>{p}</option>))}
          </select>
        </div>
      )}
      {type === "chord" && (
        <div className="grid grid-cols-8 gap-1 mt-2">
          {steps.map((s,i)=> (
            <input key={i} type="checkbox" checked={s} onChange={()=>toggleStep(i)} />
          ))}
          <select value={pitch} onChange={(e)=>setPitch(e.target.value)} className="col-span-4 text-black p-1 rounded mt-1">
            {['C4','D4','E4','F4','G4','A4','B4'].map(p=>(<option key={p}>{p}</option>))}
          </select>
          <select value={chordType} onChange={(e)=>setChordType(e.target.value)} className="col-span-4 text-black p-1 rounded mt-1">
            <option value="major">major</option>
            <option value="minor">minor</option>
            <option value="dim">dim</option>
          </select>
        </div>
      )}
      {type === "beat" && (
        <div className="grid grid-cols-8 gap-1 mt-2">
          {steps.map((s,i)=> (
            <input key={i} type="checkbox" checked={s} onChange={()=>toggleStep(i)} />
          ))}
        </div>
      )}
    </motion.div>
  );
};

export default SoundInspector;
