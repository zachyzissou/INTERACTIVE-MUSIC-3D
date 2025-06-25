## [Unreleased] – 2025-06-24

### Added
- Full-screen `<Canvas>` wrapper with animated gradient backdrop
- Corner FAB component for spawning shapes
- `BottomDrawer` component with Motion One slide animations
- `useSelectedShape` and `useEffectSettings` Zustand stores
- Tailwind CSS, Motion One and `@react-three/drei` dependencies documented
- Revised README with new architecture tree
- GitHub Actions caching and BuildKit-based Docker layer cache

### Changed
- Removed legacy `SpawnMenu`, `SoundPortals`, and fixed `EffectsPanel`
- Refactored `app/page.tsx` for drawer integration and responsive styling

### Removed
- Outdated README sections on web workers and performance tables

### Fixed
- AudioContext now starts on first user gesture

## [Unreleased] – 2025-06-25

### Added
- 3D spawn button with GLSL warp
- Audio-reactive shader deformation
- Performance presets (Low/Medium/High)
- Simple vs. Advanced drawer modes
- Responsive canvas resizing

### Changed
- Unified BottomDrawer as sole control surface


