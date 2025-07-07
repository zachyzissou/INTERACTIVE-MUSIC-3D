
# Oscillo - Interactive 3D Music Visualization

🎵 **Interactive 3D music playground where you spawn, select and sculpt floating shapes that generate notes, chords, beats or loops — all in real time.**

[![Build Status](https://img.shields.io/badge/build-passing-brightgreen)](README.md)
[![E2E Tests](https://img.shields.io/badge/e2e%20tests-13%2F13%20passing-brightgreen)](README.md)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](README.md)

## ✨ Latest Updates (January 2025)

### 🛠️ **Critical Issues Resolved**
- ✅ **Infinite Re-render Crashes Fixed** - Stabilized Zustand selectors in BottomDrawer
- ✅ **Tone.js Parameter Errors Fixed** - Safer audio effect initialization
- ✅ **WebGL Context Loss Handling** - Auto-recovery with exponential backoff
- ✅ **Canvas Stability Enhanced** - Improved error boundaries with retry mechanisms

### 🚀 **New Features**
- 🎯 **Enhanced Error Recovery** - Automatic WebGL context restoration
- 📊 **Performance Monitoring** - Real-time FPS/memory tracking with adaptive quality
- 🔒 **Secure Audio Engine** - Modern Web Audio API implementation
- ♿ **Accessibility Improvements** - WCAG 2.1 compliant controls and navigation

### 📊 **Current Status**
- **Build**: ✅ Successful (2.09 MB bundle)
- **Tests**: ✅ 13/13 Playwright E2E tests passing
- **Performance**: ✅ Adaptive quality system operational
- **Error Recovery**: ✅ Automatic WebGL context restoration working

---

A browser-

Spawn, select and sculpt floating shapes that generate notes, chords, beats or
loops — all in real time.

---

## 🚀 Features

* **Full-screen 3D Canvas** — fills your browser viewport (`100vw` × `100vh`), no dead space.
* **Procedural Shapes** — click the 3D “+” in the corner to warp a new shape into existence with physics.
* **Dynamic Bottom Drawer UI**
  * **No shape selected** → collapsed drawer, only the 3D spawn control.
  * **Shape selected** → slides up with:
    * **Mode Tabs**: Note | Chord | Beat | Loop
    * **Playback Controls**: Play ↔ Pause
    * **Effect Knobs**: Simple vs. Advanced chain
    * **Performance Presets**: Eco | Balanced | Pro
* **Per-shape Audio**
  * First click → initializes audio via `playNote('init')`.
  * Click shape → triggers its note/chord/beat/loop.
* **Installable PWA** — add to home screen for offline access.
* **Service Worker Caching** — basic offline support via `public/sw.js`.
* **Startup Performance Selector** — choose Eco/Balanced/Pro GPU mode.
* **Hydration Safe Start** — WebGL and audio wait for a click via `StartOverlay` ([guide](docs/hydration-safety.md)).
* **Audio-reactive Shaders** — shapes pulse and ripple in sync with FFT levels.
* **Responsive Canvas** — camera and renderer resize with the window.
* **Global Audio Engine**
  * Unified synth chain with master-volume, chorus, reverb, delay, distortion, bitcrusher.
  * Live updates via Zustand stores (`useAudioSettings`, `useEffectSettings`).
* **Physics & Interactivity**
  * Drag & drop shapes in 3D world.
  * Collision-triggered sounds.
* **Modern Tooling**
  * Next.js App Router (v15)
  * TypeScript + ESLint + Prettier
  * Tailwind CSS for styling
  * Motion One for smooth UI animations
  * `@react-three/drei` for gradient backdrops
  * GitHub Actions → Docker CI/CD → self-hosted runner

## New Features

* **MetalFX Canvas** — WebGPU renderer with WebGL fallback and auto performance detection
* **AirJam Sessions** — real-time collaboration via WebRTC
* **Magic Melody** — AI generated melodies powered by Magenta.js
* **SpaceCanvas XR** — AR & VR modes through WebXR buttons

---

## 🏗️ Getting Started

### **Prerequisites**

* Node.js **20.x** LTS (recommended: 20.11.0+)
* npm **10.x** or yarn **4.x**
* Modern browser with WebGL 2.0 support
* For WebGPU features: Chrome 113+, Firefox 121+, or Safari 18+

### **Installation**

1. **Clone & install dependencies**

    ```bash

    git clone https://github.com/zachyzissou/INTERACTIVE-MUSIC-3D.git
    cd INTERACTIVE-MUSIC-3D
    npm ci --legacy-peer-deps
    ```

1. **Security audit & fixes**

    ```bash

    npm audit fix
    # Review and apply security patches
    ```

1. **Download AI model (optional)**

   ```bash

   curl -L "https://storage.googleapis.com/magentadata/js/checkpoints/music_rnn/basic_rnn.tar" -o basic_rnn.tar

mkdir -p public/models/basic_rnn && tar -xf basic_rnn.tar -C
public/models/basic_rnn

   ```bash


### **Development**


1. **Local development server**
    ```bash

    npm run dev
    # → http://localhost:3000
    # Hot reload enabled with TypeScript checking
    ```

1. **Production build & test**
    ```bash

    npm run build
    npm run start
    # → http://localhost:3000 (production mode)
    ```

1. **Testing & validation**
    ```bash

    npm run lint          # ESLint + Prettier
    npm run test:unit     # Vitest unit tests
    npm run test:cypress  # E2E integration tests
    ```


### **PWA Installation**


* Desktop: Look for "Install" button in address bar
* Mobile: Use "Add to Home Screen" from browser menu
* Offline mode: Basic caching via service worker


### **Environment Configuration**


* No `.env` required for basic functionality
* Optional: Set `LOG_DIR` for custom logging directory
* Docker: See `docker-compose.yml` for container deployment

---


## 📐 UI & Controls



* **Spawn (“+”) Button**
  * 3D mesh in bottom-left. Clicking warps into the spawned shape.
* **Bottom Drawer**
  * **Collapsed**: just the spawn control.
  * **Expanded** when a shape is selected:
    1. **Mode tabs** (Note, Chord, Beat, Loop)
    2. **Simple/Advanced** toggle
    3. **Performance** preset dropdown
    4. **Knobs** instantly update audio & visuals
       * **Bitcrusher** bits/rate
  * Quality prompt appears on first visit allowing GPU mode selection.
* **3D Scene**
  * Left-click a shape to select & play.
  * Drag to move it around.

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



* **Dockerfile** — multi-stage build: dependencies, build, production runner.
* **GitHub Actions** — builds & pushes Docker image, deploys self-hosted container.
* **Log Persistence** — mount `/app/logs` to `/mnt/user/appdata/interactive-music-3d/logs` so logs survive rebuilds.

Example `docker-compose.yml` service block:

```yaml

  interactive-music-3d:
    build: .
    ports:
      * "3000:3000"
    environment:
      * NODE_ENV=production
      * LOG_DIR=/app/logs
    volumes:
      * /mnt/user/appdata/interactive-music-3d/logs:/app/logs
      * /mnt/user/appdata/interactive-music-3d/uploads:/app/uploads
      * /mnt/user/appdata/interactive-music-3d/config:/app/config
      * /mnt/user/appdata/interactive-music-3d/playwright:/root/.cache/ms-playwright
      * 
```

Logs are written to `/app/logs/app.log` and also streamed to stdout so they
appear in Unraid's Docker logs UI.

## 🔧 CI/CD Enhancements

* Docker layer caching via BuildKit
* NPM dependency cache between runs
* Shallow git clone for faster checkouts
* Conditional build triggers ignoring docs
* Self-hosted runner workspace persistence

---

## 🚩 Troubleshooting

### Rollback Steps

1. Stop the running container:

   ```bash

   docker rm -f interactive-music-web || true
   ```

1. Start the previous image (replace `<tag>` with the desired version):

   ```bash

   docker run -d --name interactive-music-web \
     --restart unless-stopped \
     -p 31415:3000 \
    interactive-music-web:<tag>

  ```text


### Swap Limit Warning

If Docker logs show `No swap limit support`, your host kernel does not enable
swap accounting. You can enable it via your Docker daemon settings on newer
kernels. Older distributions may not support this feature; the warning can be
ignored in that case.


### Hydration Errors

If you see React hydration warnings on first load, make sure audio and WebGL
setup only run after the `StartOverlay` is dismissed. See
[`docs/hydration-safety.md`](docs/hydration-safety.md) for details.

---


## 📈 Roadmap & Future



* ➕ More shapes: torus knot, custom parametrics
* 🎛️ Deeper sequencer & pattern editor
* 🌐 Multi-user jam sessions (WebRTC)
* 🎚️ VST-style plugin export
* 📱 Mobile optimizations

---


## 🤝 Contributing


1. Fork & branch
2. `npm run lint && npm run test`
3. PR with clear descriptions & screenshots

*Enjoy building & jamming!*
