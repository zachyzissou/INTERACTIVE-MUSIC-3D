# AI Agent Guide for Interactive Music 3D

## Table of Contents

1. [Project Overview](#project-overview)
2. [Agent Responsibilities](#agent-responsibilities)
3. [Prompt Engineering](#prompt-engineering)

   * Master Prompt Template
   * Task Decomposition Guidelines
4. [Module-Specific Prompt Examples](#module-specific-prompt-examples)

   * UI / Procedural Components
   * UI Fusion
   * Audio / Visualizers
   * Physics / Interaction
   * Performance / Mobile
   * PWA Support
   * GPU Modes
   * CI/CD / Validation
5. [Workflow & Branching Strategy](#workflow--branching-strategy)
6. [File & Directory Conventions](#file--directory-conventions)
7. [Testing & QA](#testing--qa)
8. [Extending / Adding New Tasks](#extending--adding-new-tasks)
9. [Document Versioning & Updates](#document-versioning--updates)

---

## Project Overview

**Interactive Music 3D** is a Next.js and React Three Fiber application where users compose music by interacting with 3D shapes. It integrates Tone.js for audio synthesis, Rapier for physics-based interactions, and custom GLSL shaders for a fluid, audio-reactive interface. The platform targets high performance and mobile compatibility without relying on paid assets.

---

## Agent Responsibilities

Our single AI agent serves as a **full-stack pair programmer**, capable of:

* **Design & UI**: Creating procedural 3D UI elements (SDF shaders, Text3D icons, HUD panels).
* **Audio & Visual**: Implementing audio-reactive shaders, FFT-driven visuals, particle simulations.
* **Shape System**: Managing scalable, instanced meshes, base scaling, interactive feedback.
* **Physics & Input**: Integrating Rapier physics, drag controls, spring interactions, spatial audio panning.
* **Performance & Mobile**: Applying adaptive DPR, LOD, merging, conditional features for mobile.
* **Progressive Enhancement**: Detect hardware and scale visuals accordingly.
* **PWA Integration**: Handle offline manifest, install flow, localStorage.
* **GPU Modes**: Manage shader complexity via startup performance selector.
* **CI/CD & Validation**: Maintaining Dockerfile, GitHub Actions workflows, and build/test pipelines.
* **Documentation**: Updating README, AGENTS.md, and inline code comments.

---

## Prompt Engineering

### Master Prompt Template

Use this boilerplate to engage the AI agent. Fill in the bracketed sections as needed.

```
You are my AI pair-programmer with full access to the `interactive-music-3d` codebase.
Goal: [One-sentence description of the feature or improvement].

Context:
- Frameworks: Next.js, React Three Fiber, Tone.js, Rapier, GLSL, Zustand
- Constraints: No paid/licensed assets; code-driven geometry and shaders only.

Tasks:
1. **[Module 1 Title]**: [Brief description of work]
2. **[Module 2 Title]**: [Brief description]
... etc.

Delivery:
- After implementation, output the full source of each updated or newly created file.
- Ensure all components using hooks begin with `'use client'`.
- Include any new shader, config, or style files.
- Update README.md, agents.md, and inline comments to reflect changes.
```

### Task Decomposition Guidelines

* Keep each numbered task self-contained and focused.
* Order tasks logically: foundational elements (config, shaders) first, then components, then integration (physics, audio), then validation.
* When tasks overlap on the same files, merge them into a single combined task to avoid merge conflicts.

---

## Module-Specific Prompt Examples

### UI / Procedural Components

```
Task: Procedural 3D Button and HUD Panel

1. Create `src/components/ProceduralButton.tsx`:
   - SDF-based fragment shader for custom shape.
   - Uniforms: uTime, uHover, uActive, uColor, uPulse.
   - Hover and click animations via uniform transitions.

2. Build HUD in `src/components/HUD.tsx`:
   - OrthographicCamera for pixel-perfect UI.
   - Use `<Html>` from drei for sliders and selectors.

3. Update `src/styles/hud.module.css` with minimalist glassmorphic styling.
```

### UI Fusion

```
Task: Shape spawn from button, morph-on-click
```

### Audio Shapes

```
Task: Shape sound synthesis + visual attributes
```

### PWA Support

```
Task: Manifest, meta, install logic
```
Service worker registration lives in `src/lib/registerServiceWorker.ts` and the
worker script is `public/sw.js` for offline caching.

### GPU Modes

```
Task: Startup selector for shader complexity
```

### Audio / Visualizers

```
Task: Audio-Driven Visual Effects

1. Setup audio analyser in `src/lib/audio.ts`:
   - Connect Tone.js FFT and Waveform to master output.
   - Export functions to retrieve low/mid/high values.

2. Create `ProceduralShape.tsx`:
   - Raymarch SDF shader for different ObjectTypes.
   - Pass audio values as uniforms each frame.

3. Implement `ParticleBurst.tsx`:
   - GPU-based offscreen simulation.
   - Trigger bursts on beat detection.

4. Add postprocessing in `app/page.tsx`:
   - `<EffectComposer>` with `<Bloom>` intensity bound to bass.
```

### Physics / Interaction

```
Task: Physics & Spatial Audio

1. Initialize Rapier in `src/lib/physics.ts` and wrap `<Canvas>` with `<Physics>`.
2. Convert musical shapes to `<RigidBody>` with mass and damping.
3. Attach spring joints for UI elements in `HUD.tsx` and `ProceduralButton.tsx`.
4. Link mesh position to Tone.js PannerNode for 3D panning.
```

### Performance / Mobile

```
Task: Performance Optimization

1. Add `<AdaptiveDpr pixelated/>` to `app/page.tsx` canvas.
2. Use `<Detailed>` or merge static meshes in `src/components/Scene.tsx`.
3. Detect mobile devices (via UA or `detect-gpu`) and toggle heavy effects off.
```

### CI/CD / Validation

```
Task: CI/CD & Build Validation

1. Update Dockerfile to pin npm and Node versions.
2. Add GitHub Actions step: `npx tsc --noEmit && npm run lint && npm run build`.
3. Document rollback steps in README under “Troubleshooting”.
```

---

## Workflow & Branching Strategy

* **One Task, One Branch**: Create branch from `main` named `feature/<task>`. Merge when PR is green.
* **Update Main Frequently**: Before starting a new branch, `git pull origin main` to minimize conflicts.
* **Sequential Merges**: Merge tasks in priority order. If conflicts occur, rebase or merge `main` into your branch first.
* **Pull Request Checklist**:

  * PR description references this agent.md section and includes the task snippet.
  * CI passes all checks.
  * Changes are scoped and documented.

---

## File & Directory Conventions

* **Components**: `src/components/` for UI, visual, and physics components.
* **Lib**: `src/lib/` for audio, physics, and shared utilities.
* **Config**: `src/config/` for `objectTypes.ts`, theme, and constants.
* **Styles**: `src/styles/` for CSS modules; keep styles co-located with components when possible.
* **Shaders**: `src/shaders/` for GLSL or TSL files, named by purpose (e.g., `sdfButton.frag`, `audioVisual.vert`).

---

## Testing & QA

* **Type Safety**: `npx tsc --noEmit` must error-free.
* **Linting**: `npm run lint` passes (use ESLint and Prettier).
* **Build**: `npm run build && next start` runs without runtime errors.
* **Manual Verification**:

  * UI elements respond to pointer/touch.
  * Audio-reactive visuals sync to music.
  * Physics feels natural.
  * Mobile performance is acceptable (>= 30 FPS on mid-range devices).

---

## Extending / Adding New Tasks

1. Copy the Master Prompt Template from section 3.
2. Define your new feature or bug fix in a clear, numbered task list.
3. Add module-specific examples if applicable.
4. Create a branch and PR referencing this agent.md.

---

## Document Versioning & Updates

* Update this file whenever agent responsibilities or workflows change.
* Record the date and summary of changes under a “Changelog” section at the bottom.
* For major revisions, increment the document version (e.g., v1.0 → v2.0).

---

*Last updated: 2025-06-25*

## Agent: Audio Init & Render Safety Agent

### Responsibilities:
- Ensure Tone.js audio is initialized **only after user interaction**
- Refactor any `AudioContext` or Tone.js logic out of SSR scope
- Audit React hook usage for hydration safety (no conditional hooks or SSR-incompatible patterns)
- Guarantee compatibility with both `npm run dev` and `npm run build`
- Wrap all browser-dependent components with dynamic import or `"use client"` guard
- Delay Three.js renderer and other side-effects until a user gesture dismisses `StartOverlay`
