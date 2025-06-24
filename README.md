# Interactive Music 3D

This project is an experimental interactive music website built using Next.js, React, and React Three Fiber. It features a 3D scene with a floating sphere and demonstrates basic note generation using Tone.js.

## Project Structure

```
interactive-music-3d
├── app
│   ├── layout.tsx          # Global layout for the App Router
│   └── page.tsx            # Main 3D scene
├── src
│   ├── components          # Reusable React Three Fiber components
│   ├── lib                 # Shared utilities (audio helpers, stores)
│   └── styles              # CSS modules
├── package.json            # npm configuration and dependencies
├── tsconfig.json           # TypeScript configuration
├── next.config.js          # Next.js configuration
└── README.md               # Project documentation
```

## Prerequisites

- Node.js >=14.x is required. If you don't have `node` or `npm` installed, you can install it using [nvm](https://github.com/nvm-sh/nvm):

  ```zsh
  # Install nvm
  curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.3/install.sh | zsh
  # Restart your shell or source nvm
  source ~/.zshrc
  # Install the latest LTS version of Node.js
  nvm install --lts
  # Verify installation
  node -v
  npm -v
  ```

## Getting Started

To get started with the project, follow these steps:

1. **Clone the repository:**
   ```
   git clone <repository-url>
   cd interactive-music-3d
   ```

2. **Install dependencies:**
   Run the following command from the project root to install all required packages:
   ```bash
   npm install
   ```
   The repository includes an `.npmrc` file that enables `legacy-peer-deps` to
   avoid peer dependency conflicts during installation.

3. **Run the development server:**
   ```
 npm run dev
  ```

4. **Open your browser:**
   Navigate to `http://localhost:3000` to view the application. On first load you can choose an example scene to start from.

5. **Build for production:**
   Use the following command to create an optimized build and start it:
   ```bash
   npm run build && npm start
   ```

## Features
- Spawn notes, chords, beats and loops from the sidebar or circular sound portals.
- Example scenes can be loaded on first visit to quickly try out the app.
- The SoundInspector provides a 16 step sequencer and per-object effects.
- Instanced ProceduralShapes visualize audio levels in real time.
- Scroll or pinch to zoom the camera, and drag objects to move them in 3D.
- Spatial audio and bloom lighting react to your music.

## Future Enhancements

- Add more interactive elements to the 3D scene.
- Implement user controls for sound manipulation.
- Explore additional sound synthesis techniques with Tone.js.

## License

This project is licensed under the MIT License.


## Plugins

Plugins can extend both audio and visuals. Create a module exporting
`{ name: string, init: (context) => void }` and register it:

```ts
import pluginManager from '@/plugins/PluginManager'
pluginManager.registerPlugin({
  name: 'MyPlugin',
  init() { /* setup */ }
})
```

## Web Worker Setup

Physics simulation runs in a Web Worker. Ensure your bundler supports
worker imports (Next.js does by default). If targeting older browsers,
include a polyfill such as `worker-loader`.
Call `initPhysics()` once on startup to launch the worker. Because module
workers require a secure context, run the site over HTTPS (or localhost)
so the physics worker and spatial audio function correctly.

## Performance

Average FPS on a mid-range laptop:

| Objects | Avg FPS |
|---------|--------|
| 1       | ~120   |
| 25      | ~90    |
| 100     | ~65    |

## Validation

Before merging changes, ensure the project builds, passes type checking, and all tests run:

```bash
npx tsc --noEmit
npm run build
npx playwright install
npm test
```

Afterward, test the production build on both desktop and mobile devices to verify everything works as expected.

## Logging

When printing objects to the console or persisting debugging data, use the helper `safeStringify` found in `src/lib/safeStringify.ts`. It gracefully handles class instances and circular references.

```ts
import { safeStringify } from '@/lib/safeStringify'

console.log(safeStringify(myObject))
```

## Store Usage

State management uses small zustand stores. Refer to [docs/store-guidelines.md](docs/store-guidelines.md) for permitted data types. Avoid storing Three.js, Tone.js or DOM objects in these stores.

