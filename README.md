# Interactive Music 3D

A browser-based, procedural 3D music sandbox built with Next.js, React Three Fiber, Tone.js, Cannon-ES physics, and Zustand.  
Spawn, select and sculpt floating shapes that generate notes, chords, beats or loops — all in real time.

---

## 🚀 Features

- **Full-screen 3D Canvas** — fills your browser viewport (`100vw` × `100vh`), no dead space.  
- **Procedural Shapes** — click “+” to spawn spheres, cubes, torii, prisms, etc., with physics.  
- **Dynamic Bottom Drawer UI**  
  - **No shape selected** → only “+” button in bottom-left.  
  - **Shape selected** → slides up with:  
    - **Mode Tabs**: Note | Chord | Beat | Loop  
    - **Playback Controls**: Play ↔ Pause  
    - **Effect Knobs**: Volume, Chorus, Delay, Reverb, Filter, Bitcrusher  
- **Per-shape Audio**  
  - First click → `Tone.start()` (user gesture handshake) + confirmation ping.  
  - Click shape → triggers its note/chord/beat/loop.  
- **Global Audio Engine**  
  - Unified synth chain with master-volume, chorus, reverb, delay, distortion, bitcrusher.  
  - Live updates via Zustand stores (`useAudioSettings`, `useEffectSettings`).  
- **Physics & Interactivity**  
  - Drag & drop shapes in 3D world.  
  - Collision-triggered sounds.  
- **Modern Tooling**  
  - Next.js App Router (v15)  
  - TypeScript + ESLint + Prettier  
  - Tailwind CSS for styling  
  - Motion One for smooth UI animations  
  - `@react-three/drei` for gradient backdrops  
  - GitHub Actions → Docker CI/CD → self-hosted runner

---

## 🏗️ Getting Started

1. **Clone & install**  
    ```bash
    git clone https://github.com/zachyzissou/INTERACTIVE-MUSIC-3D.git
    cd INTERACTIVE-MUSIC-3D
    npm ci
    npm install @motionone/react @react-three/drei tailwindcss
    ```
2. **Environment**  
   - Node.js **18.x** LTS  
   - No extra `.env` required out of the box  
3. **Local development**  
    ```bash
    npm run dev
    # → http://localhost:3000
    ```
4. **Production build**  
    ```bash
    npm run build
    npm run start
    ```

---

## 📐 UI & Controls

- **Spawn (“+”) Button**  
  - Always in bottom-left corner.  
  - Click to add a new shape and select it.  
- **Bottom Drawer**  
  - **Collapsed**: only shows “+”.  
  - **Expanded** when a shape is selected:  
    1. **Mode tabs** (Note, Chord, Beat, Loop)  
    2. **Play/Pause** toggle  
    3. **Sliders/Knobs** for:  
       - Master **Volume**  
       - **Chorus** wet/dry  
       - **Delay** time/feedback  
       - **Reverb** room/decay  
       - **Filter** cutoff/Q  
       - **Bitcrusher** bits/rate  
- **3D Scene**  
  - Left-click a shape to select & play.  
  - Drag to move it around.

---

## 🧩 Architecture

app/
├─ layout.tsx # Global layout + <ErrorBoundary>
├─ page.tsx # Full-screen <Canvas> + <BottomDrawer>
src/
├─ components/
│ ├─ BottomDrawer.tsx # Drawer UI with Motion One
│ ├─ MusicalObject.tsx # Shape rendering + onClick trigger
│ └─ …
├─ lib/
│ ├─ audio.ts # Tone.js engine & effect chain
│ ├─ safeStringify.ts # (dev only) prevent circular JSON errors
│ └─ …
├─ store/
│ ├─ useAudioSettings.ts # Global audio params
│ ├─ useEffectSettings.ts # Per-shape effect state
│ ├─ useObjects.ts # All spawned shapes
│ └─ useSelectedShape.ts # Currently selected shape
└─ styles/…

---

## 🔧 Deployment

- **Dockerfile** — multi-stage build: dependencies, build, production runner.  
- **GitHub Actions** — builds & pushes Docker image, deploys self-hosted container.

## 🔧 CI/CD Enhancements

- Docker layer caching via BuildKit
- NPM dependency cache between runs
- Shallow git clone for faster checkouts
- Conditional build triggers ignoring docs
- Self-hosted runner workspace persistence

---

## 📈 Roadmap & Future

- ➕ More shapes: torus knot, custom parametrics  
- 🎛️ Deeper sequencer & pattern editor  
- 🌐 Multi-user jam sessions (WebRTC)  
- 🎚️ VST-style plugin export  
- 📱 Mobile optimizations

---

## 🤝 Contributing

1. Fork & branch  
2. `npm run lint && npm run test`  
3. PR with clear descriptions & screenshots

*Enjoy building & jamming!*
