# Interactive Music 3D

This project is an experimental interactive music website built using Next.js, React, and React Three Fiber. It features a 3D scene with a floating sphere and demonstrates basic note generation using Tone.js.

## Project Structure

```
interactive-music-3d
├── src
│   ├── pages
│   │   ├── _app.tsx        # Custom App component for Next.js
│   │   └── index.tsx       # Landing page with 3D scene
│   ├── components
│   │   └── FloatingSphere.tsx # Component for the floating sphere
│   ├── lib
│   │   └── tone.ts         # Tone.js setup and note generation
│   └── styles
│       └── globals.css     # Global CSS styles
├── package.json             # npm configuration and dependencies
├── tsconfig.json            # TypeScript configuration
├── next.config.js           # Next.js configuration
└── README.md                # Project documentation
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
   ```
   npm install
   ```

3. **Run the development server:**
   ```
   npm run dev
   ```

4. **Open your browser:**
   Navigate to `http://localhost:3000` to view the application.

## Features

- A 3D scene rendered with React Three Fiber.
- A floating sphere that demonstrates basic animation.
- Basic note generation using Tone.js, showcasing sound synthesis capabilities.

## Future Enhancements

- Add more interactive elements to the 3D scene.
- Implement user controls for sound manipulation.
- Explore additional sound synthesis techniques with Tone.js.

## License

This project is licensed under the MIT License.