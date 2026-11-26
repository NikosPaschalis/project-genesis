# Project Genesis

**The Quiet Reach** is the first playable expedition. Explore a mountain basin, stop at sites that catch your attention, and record your observations in the field journal.

## Play locally

With Node.js 22.12+ and npm, open this repository and run:

```sh
npm ci
npm run dev
```

Open the local address printed by Vite. For production, run `npm run build` and then `npm run preview`. The game needs WebGL 2. All runtime assets are bundled locally.

| Input | Action |
| --- | --- |
| W A S D | Walk |
| Drag or Left / Right arrow | Look |
| Shift | Move faster |
| E or tap the prompt | Examine a nearby site |
| J or Journal | Open field journal |
| Esc | Close field journal |
| Touch directional pad | Walk on a touch screen |

Sound is opt-in. The journal stays in the current browser profile when storage is available. Use **Return to overlook** in the journal to reset your position.

## Verify the expedition

```sh
npm run build
CHROMIUM_PATH=/path/to/chromium npm run test:browser
```

The browser check starts its own local server, walks the desktop route, verifies journal persistence, and checks the first interaction with touch controls. Set `GENESIS_CAPTURE_DIR` to capture the opening at two viewport sizes.

## 0.1.0

First playable release. It includes a low-poly basin, a single-player route with three inspectable sites, a local field journal, and optional ambient sound. This build supports walking along the terrain. Scenery meshes such as trees and ruin blocks can be walked through. Device performance varies with WebGL support and available graphics acceleration.

Read [the constitution](CONSTITUTION.md) and [founder amendments](CONSTITUTION-AMENDMENTS.md) for the governing principles. Read [the memory index](memory/index.md) for project continuity and evidence.
