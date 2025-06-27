# Audio Initialization Guide

This project defers loading and starting Tone.js until the user interacts with the page.

1. `startAudio()` lives in `src/lib/audio/startAudio.ts` and is triggered by clicking the plus button.
2. The function lazily imports Tone.js and calls `Tone.start()` after user input.
3. `initAudioEngine()` sets up synths and effects only once, guarded by a flag.
4. Components must avoid touching Tone.js or `AudioContext` at module scope. Import audio helpers dynamically or inside callbacks.
5. Call `startAudio()` from user gesture handlers to ensure browsers allow audio playback.
