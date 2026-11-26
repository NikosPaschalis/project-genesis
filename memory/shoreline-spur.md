# Inland spur · v0.3.0

## Decision

The [v0.2.0 playtest](playtest-2026-11-26.md) established that the lake and monument make a strong destination. The stretch after the landing had few decisions or changes in foreground. This version tests a short detour on existing terrain, with an authored gravel line, a raised shelf and one new observation. It retains the lower shore route and rejoins it before the headland. The fork uses terrain contrast and silhouettes without extra interface instructions.

The new trace extends the existing motif of three marks and an anomalous relation to water. It keeps the text tied to a physical object while leaving the event unexplained. The optional trace uses the same journal as prior observations, including the same storage key and IDs for older entries.

## Verification

- Height and footprint checks sampled both routes. Both stayed above the walking cutoff and outside the observation blockers. The sampled paths bottomed out at −0.26 m for the lower route and −0.33 m for the spur. Water level is −0.55 m.
- The browser smoke suite recorded all four observations by desktop input, verified the journal after reload, and covered the first mobile interaction.
- Chromium ran with software WebGL. A guided route can verify physical access and provide reproducible frames for visibility review. It provides no evidence that a new player will choose the spur or notice its observation.
- The extracted production archive rendered and recorded the first observation. A fresh Chromium run then walked from the overlook to the fork, climbed the inland spur, and rejoined the shore route at the headland without retracing its steps. The replay read camera coordinates to stop at chosen viewpoints and used game input for movement.
- At the fork, the strip of bare gravel and the two rising slabs made the inland option visually distinct from the water's edge. A dark boulder filled much of the inland view on approach, so the pale route is clearer at the split than between the slabs. The surroundings open up again at the headland. These are observations from a guided replay.

## Next question

Give a new observer the previous and current build without route instructions. Capture the first turn after the landing, whether they notice both ways forward, and whether the stones prompt them to pause. The baseline and current branch should be judged before introducing any extra cue. A lower viewing angle or narrower contrast band may be preferable to a marker if the boulder proves to obscure the continuation.
