"use client";
import { motion } from '@motionone/react';
import { KnobHeadless as Knob } from 'react-knob-headless';
import { useAudioSettings } from '../store/useAudioSettings';

export function EffectsPanel() {
  const {
    chorusDepth,
    setChorusDepth,
    reverbWet,
    setReverbWet,
    delayFeedback,
    setDelayFeedback,
    bitcrusherBits,
    setBitcrusherBits,
    filterFrequency,
    setFilterFrequency,
  } = useAudioSettings();

  const presets = {
    "Dream Pop": {
      chorusDepth: 0.8,
      reverbWet: 0.7,
      delayFeedback: 0.3,
      bitcrusherBits: 8,
      filterFrequency: 400,
    },
    "Lo-Fi": {
      chorusDepth: 0.4,
      reverbWet: 0.3,
      delayFeedback: 0.2,
      bitcrusherBits: 4,
      filterFrequency: 200,
    },
    "Space FX": {
      chorusDepth: 1,
      reverbWet: 0.9,
      delayFeedback: 0.7,
      bitcrusherBits: 6,
      filterFrequency: 600,
    },
  } as const;

  const applyPreset = (name: keyof typeof presets) => {
    const p = presets[name];
    setChorusDepth(p.chorusDepth);
    setReverbWet(p.reverbWet);
    setDelayFeedback(p.delayFeedback);
    setBitcrusherBits(p.bitcrusherBits);
    setFilterFrequency(p.filterFrequency);
  };

  const randomize = () => {
    setChorusDepth(Math.random());
    setReverbWet(Math.random());
    setDelayFeedback(Math.random() * 0.9);
    setBitcrusherBits(Math.floor(Math.random() * 15) + 1);
    setFilterFrequency(20 + Math.random() * 980);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 50 }}
      transition={{ duration: 0.5 }}
      className="effects-panel flex gap-4 p-4 bg-black/50 rounded-md"
    >
      <Knob aria-label="Chorus Depth" className="w-20 h-20" valueRaw={chorusDepth} valueMin={0} valueMax={1} dragSensitivity={0.005} valueRawRoundFn={(v)=>v} valueRawDisplayFn={(v)=>v.toFixed(2)} onValueRawChange={(v:number)=>setChorusDepth(v)} />
      <Knob aria-label="Reverb Wet" className="w-20 h-20" valueRaw={reverbWet} valueMin={0} valueMax={1} dragSensitivity={0.005} valueRawRoundFn={(v)=>v} valueRawDisplayFn={(v)=>v.toFixed(2)} onValueRawChange={(v:number)=>setReverbWet(v)} />
      <Knob aria-label="Delay Feedback" className="w-20 h-20" valueRaw={delayFeedback} valueMin={0} valueMax={0.9} dragSensitivity={0.005} valueRawRoundFn={(v)=>v} valueRawDisplayFn={(v)=>v.toFixed(2)} onValueRawChange={(v:number)=>setDelayFeedback(v)} />
      <Knob aria-label="Bit Depth" className="w-20 h-20" valueRaw={bitcrusherBits} valueMin={1} valueMax={16} dragSensitivity={0.005} valueRawRoundFn={(v)=>v} valueRawDisplayFn={(v)=>v.toFixed(0)} onValueRawChange={(v:number)=>setBitcrusherBits(v)} />
      <Knob aria-label="Filter Freq" className="w-20 h-20" valueRaw={filterFrequency} valueMin={20} valueMax={1000} dragSensitivity={0.005} valueRawRoundFn={(v)=>v} valueRawDisplayFn={(v)=>v.toFixed(0)} onValueRawChange={(v:number)=>setFilterFrequency(v)} />
      <div className="flex flex-col items-center gap-2">
        <select onChange={e => applyPreset(e.target.value as keyof typeof presets)} className="text-black rounded px-1 py-0.5">
          <option value="">Preset</option>
          {Object.keys(presets).map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
        <button onClick={randomize} className="bg-white/70 text-black px-2 py-1 rounded">Randomize</button>
      </div>
    </motion.div>
  );
}
