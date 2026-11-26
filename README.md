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
| Drag | Look |
| Left / Right arrow | Turn |
| Page Up / Page Down | Look up or down |
| Shift | Move faster |
| E or tap the prompt | Examine a nearby site you are facing |
| J or Journal | Open field journal |
| Esc | Dismiss the field note or close the journal |
| Touch directional pad | Walk on a touch screen |

Sound is opt-in. The journal stays in the current browser profile when storage is available. Use **Return to overlook** in the journal to reset your position.

## Verify the expedition

```sh
npm run test:world
npm run build
CHROMIUM_PATH=/path/to/chromium npm run test:browser
CHROMIUM_PATH=/path/to/chromium npm run test:east-bank
```

The world checks exercise traversal, geometry, sound parameters, and journal visibility without a browser. The browser suites start their own local servers. The first exercises the original route, keyboard and touch input, and journal persistence. The east-bank replay crosses in both directions and checks the expanded journal with an older save. Set `GENESIS_CAPTURE_DIR` to save browser frames.

## 0.4.0

The inland route is easier to follow through the standing stones. Page Up and Page Down let keyboard players look vertically, and the Examine prompt responds to vertical aim. Existing journal entries remain available.

## 0.3.0

The basin now has a short inland route that splits off from the shore and rejoins at the headland. It adds a change in elevation, a new view across the water, and an optional field observation. The original shore route remains available. Observation props block movement. Other scenery, including trees and larger ruins, can still be walked through. Device performance varies with WebGL support and graphics acceleration.

## 0.2.0

Field observations first appeared alongside the landscape, with the full journal available separately. Look toward a nearby trace to examine it. The revision replaces floating markers with details on the objects themselves and adds physical cues along the shore. The three original observation props gained collision.

Version 0.1.0 is the original expedition checkpoint.

## Package a playable release

With `zip` and `unzip` installed, run `npm run release -- /path/to/output`. This builds the expedition and creates a validated ZIP with local launch instructions and third-party notices.

Read [the constitution](CONSTITUTION.md) and [founder amendments](CONSTITUTION-AMENDMENTS.md) for the governing principles. Read [the memory index](memory/index.md) for project continuity and evidence.
