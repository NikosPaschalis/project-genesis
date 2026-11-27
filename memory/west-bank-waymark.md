# West-bank waymark · 28 November 2026

The v0.5.0 west descent gives a clear view of the Crown and timber crossing. The split itself depends mostly on gravel color. I tested a low, distinctive silhouette between the two paths to see whether it gave the crossing a clearer local reference without competing with the Crown.

## Asset and placement

The waymark is an asymmetric pair of faceted slate fins, set on a buried footing and joined by a tarnished bronze brace. I made it with Blender 4.3.2 in the project workspace. The personal-PC Blender connector was unavailable in this session. The [editable Blender source](../assets/source/west-bank-waymark.blend) holds nine separate meshes. Join the meshes in a disposable copy before re-exporting as glTF Binary to regenerate the [runtime asset](../src/assets/west-bank-waymark.glb).

The runtime GLB is 27.1 kB with 254 triangles, six material primitives, and no textures. Three.js places it just north of the west approach. The first rendered candidate overlapped a procedural rock at the footing from the deck view. The final placement clears the nearby rock scatter and retains the existing walking rules.

## Decision

**Keep.** In matched player-height frames, the shape separates from the reflective water as the gravel path splits. The rail and the distant Crown remain legible. The view down the deck changes very little after turning toward it. The waymark also gives the return approach a distinct reference on the shore. [Baseline fork, final fork, return view, and near view](evidence/west-bank-waymark-comparison.webp)

A separate fresh-profile Chromium walk used normal keys and mouse drag without reading camera state. The waymark first appeared partly behind the Leaning Stone, then read clearly beside the bridge as I moved around it. On the first turn I approached the deck at a shallow angle on the water side and needed to correct. The asset helps identify the turn. It leaves open how a first-time player finds the flat entrance. This was a creator playtest with prior route knowledge.

At the matched fork and return poses, Chromium submitted six additional draw calls and 234 additional triangles after the nearby rock was removed. The build reports a 176.15 kB gzip entry script with the GLTF loader, compared with 151.11 kB for v0.5.0. These are renderer counts and build sizes.

The original Blender source reopened successfully. The world checks, the normal-input east-bank replay in both directions, and the extracted production smoke test all passed. The Vite chunk-size warning remains. To reproduce the comparison, run `node tools/capture-views.mjs <checkout> <output-directory> crossing` against v0.5.0 and this checkpoint.
