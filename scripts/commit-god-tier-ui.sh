#!/bin/bash

# Script to stage all files related to the God-Tier UI upgrade PR

# Add modified files
git add app/page.tsx
git add src/components/AudioReactiveShaderBackground.tsx

# Add new files
git add PR_DESCRIPTION_GOD_TIER_UI.md
git add docs/GOD_TIER_UI_GUIDE.md

# Add shader files
git add src/shaders/metaball.frag.ts
git add src/shaders/proceduralEffects.frag.ts
git add src/shaders/waterRipple.frag.ts
git add src/shaders/webgpu.wgsl.ts
git add src/shaders/advancedEffects.frag.ts

# Add UI components
git add src/components/ui/GodTierUI.tsx
git add src/components/ui/AudioVisualizer.tsx
git add src/components/ui/ShaderControls.tsx
git add src/components/ui/ShaderSelector.tsx
git add src/config/shaderConfigs.ts
git add src/styles/god-tier-ui.css

# Add demo files
git add public/demos/
git add public/screenshots/

# Add package.json changes
git add package.json
git add package-lock.json

# Commit with the PR message
git commit -m "✨ Implement God-Tier UI/UX & Aesthetic Upgrade

This PR implements a comprehensive UI/UX upgrade for Oscillo:
- Advanced shader collection (metaballs, noise, water ripple, voronoi)
- Unified God-Tier UI with audio visualization
- WebGPU/WGSL support with WebGL fallback
- Full accessibility improvements
- Extensive documentation

See PR_DESCRIPTION_GOD_TIER_UI.md for full details."

echo "Changes committed to feature/god-tier-ui-upgrade branch"
echo "Ready for PR review!"
