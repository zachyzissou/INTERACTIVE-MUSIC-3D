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
   Navigate to `http://localhost:3000` to view the application.

5. **Build for production:**
   Use the following command to create an optimized build and start it:
   ```bash
   npm run build && npm start
   ```

## Features

- A 3D scene rendered with React Three Fiber.
- A floating sphere that demonstrates basic animation.
- Basic note generation using Tone.js, showcasing sound synthesis capabilities.
- Scroll or pinch to zoom the camera.
- Loop objects trigger repeating beats with a progress ring.
- Spatial audio positions each sound in 3D space.
- Selecting an object reveals an effect panel for reverb, delay, and filters.
- Dynamic bloom lighting responds to the music's bass frequencies and is
  automatically disabled on low-power devices.

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

Before merging changes, ensure the project builds and passes type checking:

```bash
npx tsc --noEmit
npm run build
```

Afterward, test the production build on both desktop and mobile devices to verify everything works as expected.

