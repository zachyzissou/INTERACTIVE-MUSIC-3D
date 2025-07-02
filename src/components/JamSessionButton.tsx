'use client'
import React from 'react';
import { useJam } from '../lib/jamSession';

export default function JamSessionButton() {
  const start = useJam(s => s.start);
  return (
    <button onClick={start} className="px-2 py-1 bg-blue-600 text-white rounded text-xs">
      Start Jam Session
    </button>
  );
}
