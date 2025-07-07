
# Store Usage Guidelines

This project uses [Zustand](https://github.com/pmndrs/zustand) for state management. Stores are kept intentionally lightweight so that they can be serialized and replayed easily. **Only plain primitives and arrays should be persisted.** Complex objects such as Three.js meshes, Tone.js classes, or DOM nodes must never be stored directly.

| Store file | Allowed data types |
|-

| `useAudioSettings.ts` | strings, numbers, and functions to update them |
| `useEffectSettings.ts` | nested records of numbers and functions |
| `useLoops.ts` | records of booleans and functions |
| `useObjects.ts` | arrays of objects with primitive fields and functions |
| `usePerformance.ts` | booleans and functions |

When new stores are added, ensure that their state follows the same rule:
primitives or arrays only. Use IDs to reference complex objects managed
elsewhere.
