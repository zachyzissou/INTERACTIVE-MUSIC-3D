// src/lib/tone.ts
import * as Tone from 'tone';

let synth: Tone.Synth;

export const startNote = async () => {
  await Tone.start();
  if (!synth) {
    // instantiate and configure synth
    synth = new Tone.Synth().toDestination();
    synth.oscillator.type = 'sine';
    synth.envelope.attack = 0.1;
    synth.envelope.release = 1;
  }
  // schedule both attack and release at current audio time, avoiding timing conflicts
  synth.triggerAttackRelease('C4', '1n', Tone.now());
};

export const stopNote = () => {
  if (synth) {
    // schedule release to avoid timing conflicts
    synth.triggerRelease(Tone.now() + 0.01);
  }
};
