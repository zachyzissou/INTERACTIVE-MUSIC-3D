'use client'
import React from 'react';
import * as mm from '@magenta/music';
import { generateMelody } from '../lib/ai';
import { useObjects } from '../store/useObjects';
import { playNote } from '../lib/audio';

export default function MagicMelodyButton() {
  const spawn = useObjects(s => s.spawn);
  const handle = async () => {
    const seq = await generateMelody();
    const id = spawn('note');
    const Tone = await import('tone');
    seq.notes?.forEach((n, i) => {
      if (typeof n.pitch === 'number') {
        const note = Tone.Frequency(n.pitch, 'midi').toNote();
        setTimeout(() => playNote(id, note), i * 500);
      }
    });
  };
  return (
    <button onClick={handle} className="px-2 py-1 bg-purple-500 text-white rounded text-xs">Magic Melody</button>
  );
}
