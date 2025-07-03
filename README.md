# Interactive Music 3D

A browser-based, procedural 3D music studio built with Next.js, React Three Fiber, Tone.js and Rapier physics.
Spawn, select and sculpt floating shapes that generate notes, chords, beats or loops — all in real time.

---

## 🚀 Features

- **Full-screen 3D Canvas** — fills your browser viewport (`100vw` × `100vh`), no dead space.  
- **Procedural Shapes** — click the 3D “+” in the corner to warp a new shape into existence with physics.
- **Dynamic Bottom Drawer UI**  
  - **No shape selected** → collapsed drawer, only the 3D spawn control.
  - **Shape selected** → slides up with:  
    - **Mode Tabs**: Note | Chord | Beat | Loop  
    - **Playback Controls**: Play ↔ Pause
    - **Effect Knobs**: Simple vs. Advanced chain
    - **Performance Presets**: Eco | Balanced | Pro
- **Per-shape Audio**
  - First click → initializes audio via `playNote('init')`.
  - Click shape → triggers its note/chord/beat/loop.
- **Installable PWA** — add to home screen for offline access.
- **Service Worker Caching** — basic offline support via `public/sw.js`.
- **Startup Performance Selector** — choose Eco/Balanced/Pro GPU mode.
- **Audio-reactive Shaders** — shapes pulse and ripple in sync with FFT levels.
- **Responsive Canvas** — camera and renderer resize with the window.
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

## New Features

- **MetalFX Canvas** — WebGPU renderer with WebGL fallback and auto performance detection
- **AirJam Sessions** — real-time collaboration via WebRTC
- **Magic Melody** — AI generated melodies powered by Magenta.js
- **SpaceCanvas XR** — AR & VR modes through WebXR buttons

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
   - PWA manifest located in `public/manifest.json`
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
5. **Install as PWA**
    - Open the site and choose "Add to Home Screen" when prompted.
    - Offline assets are cached via a service worker.

---

## 📐 UI & Controls

- **Spawn (“+”) Button**
  - 3D mesh in bottom-left. Clicking warps into the spawned shape.
- **Bottom Drawer**
  - **Collapsed**: just the spawn control.
  - **Expanded** when a shape is selected:
    1. **Mode tabs** (Note, Chord, Beat, Loop)
    2. **Simple/Advanced** toggle
    3. **Performance** preset dropdown
    4. **Knobs** instantly update audio & visuals
       - **Bitcrusher** bits/rate
  - Quality prompt appears on first visit allowing GPU mode selection.
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
- **Log Persistence** — mount `/app/logs` to `/mnt/user/appdata/interactive-music-3d/logs` so logs survive rebuilds.

Example `docker-compose.yml` service block:

```yaml
  interactive-music-3d:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - LOG_DIR=/app/logs
    volumes:
      - /mnt/user/appdata/interactive-music-3d/logs:/app/logs
      - /mnt/user/appdata/interactive-music-3d/uploads:/app/uploads
      - /mnt/user/appdata/interactive-music-3d/config:/app/config
      - /mnt/user/appdata/interactive-music-3d/playwright:/root/.cache/ms-playwright
      - /mnt/user/appdata/interactive-music-3d/.next-cache:/app/.next/cache
```

## 🔧 CI/CD Enhancements

- Docker layer caching via BuildKit
- NPM dependency cache between runs
- Shallow git clone for faster checkouts
- Conditional build triggers ignoring docs
- Self-hosted runner workspace persistence

---

## 🚩 Troubleshooting

### Rollback Steps
1. Stop the running container:
   ```bash
   docker rm -f interactive-music-web || true
   ```
2. Start the previous image (replace `<tag>` with the desired version):
   ```bash
   docker run -d --name interactive-music-web \
     --restart unless-stopped \
     -p 31415:3000 \
     interactive-music-web:<tag>
   ```

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
