# First expedition · 0.1.0

## Creative intent

The opening composition frames a small footpath, the lake, a broken monument, and ridges beyond it. The player can walk the space shown at arrival. Three observations echo a motif without stating a canonical explanation. Keep the mythology ambiguous to the player as it grows. Track future story commitments here if they constrain subsequent content.

## Implementation

The Three.js WebGL scene lives in `src/landscape.js`. Terrain, mountains, flora and ruins use deterministic geometry. The landscape and walking system share the same ground height function. Plants use instancing. Sky and water use GLSL shaders. This release uses the widely available WebGL renderer. A TSL comparison is an open experiment when a specific effect or renderer change justifies the cost. The soundscape uses local Web Audio synthesis. Fonts ship with the app.

`src/main.js` owns the game loop, movement, pointer and keyboard input, accessibility announcements, and the journal. The journal stores IDs in a versioned local-storage key and uses an in-memory fallback. The source of truth for release numbers is `package.json`; update the landing label and player guide with each playable release.

## Evidence

- Independent critic observed the opening at 1440×900, reviewed movement and terrain code, and reached the first observation in Chromium with software WebGL. The critic flagged an ambiguous water stop and a missing-glyph icon in the opening capture.
- After critique, cairns and a short text cue provide the landward route. The opening arrow uses a vector icon. The compass now calculates both adjacent headings from the same bearing as its center label.
- The browser smoke test passed on Chromium with software WebGL. Desktop automation used a 640×430 viewport and exercised all three observations, water boundary feedback, sound controls, return to the overlook and journal reload. The 390×844 touch run entered the world, held the movement control, and recorded the first observation. The test reads camera position only through an intercepted development response. It does not measure rendering performance or first-time navigation. An initial run was invalidated by Vite reloading mid-test after a source edit. Keep the source and installed modules fixed during navigation checks.
- The production build succeeded with a Vite chunk-size warning. The main compressed JS payload was about 146 kB. No comparative performance claim has been made.

## Next questions

- Can first-time players find the headland route using the terrain cues? Use the criteria in [the comparison protocol](evaluation.md), and keep both blocked-water encounters and eventual completion in the record.
- Can another route teach a different way to notice environmental clues? Test with a small addition before extending the playable bounds.
- Can high occupancy scenery use a minimal shared collision representation that preserves the ability to reach each marked site? Measure blocked paths, position jitter, and frame time before adding full mesh collision.

## Release packaging

Archive the contents of `dist` as a `dist/` directory along with local launch instructions and the Three.js, DM Sans, and Instrument Serif licenses from their installed packages. Serve an extracted copy over HTTP to verify launch. Preserve the tagged source in Git or a Git bundle alongside the playable archive.
