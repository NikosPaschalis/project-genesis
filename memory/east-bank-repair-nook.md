# East-bank repair nook · 28 November 2026

Baseline was v0.5.0 at `542fbbb`. I started in a fresh Edge profile at 1000 × 620, with software WebGL, reduced motion and sound off. I knew the controls and had read the project memory. Before using Blender or reading the scene code, I walked from the overlook, examined the Leaning Stone, found the west entrance to the bridge, crossed, and tried turning right beside the reeds on the east bank. I used ordinary keys and mouse drag without reading camera state.

## Where the quiet works

From the overlook, the open band of water separates the nearby stone from the Crown and the ridges. On the bridge, the rails and repeating piers give that gap a scale you can feel as you walk. The cove to the south has another useful kind of quiet. Looking across the reeds reveals the shape of the basin without another landmark on the skyline.

The right turn off the east landing felt different. The path toward the Measure House had a clear destination. To the right I saw much the same scattered grass and rock after stepping down as I did from the rail. Looking back restored a strong composition over the water. That made the dry shoulder a good place to try a detail at walking scale.

## What stayed

I kept a low repair trestle and a spare rail with a broken scarf joint. The splayed trestle first appears beside the bridge rail. From close up, its slate shims and the spare rail's pinned cleat suggest work once done here. From uphill the two pieces share a frame with the wooden crossing. They sit off the tread, below eye level, and have simple solid footprints. Grass and rocks are cleared only around the pieces.

The initial placement made the spare rail look perched on the slope. I set it 7.5 cm deeper and checked it from both directions. Its cut end and pegs still show. The deck remains the clearest line straight ahead; the trestle gives a reason to glance right, and the rail rewards the closer look. [Matched deck and turn views, plus joinery and return views](evidence/east-bank-repair-comparison.webp)

A fresh normal-input replay confirmed the two scales of the cue. From the moving deck I saw the top beam on the right past the posts. I walked past it on the higher side and turned back. The trestle and reeds framed the water, with the bridge entrance still in view.

- [Trestle Blender source](../assets/source/east-bank-repair-trestle.blend) · [GLB](../src/assets/east-bank-repair-trestle.glb) · 364 triangles, 4 material primitives.
- [Rail Blender source](../assets/source/east-bank-spare-rail.blend) · [GLB](../src/assets/east-bank-spare-rail.glb) · 208 triangles, 3 material primitives.

Both sources reopened in Blender 5.2 LTS with separate editable pieces. For re-export, join the meshes in a disposable copy and export a Y-up GLB. The two GLBs total 43,452 bytes and use no textures. The production build, world checks and east-bank browser replay passed. An additional sampled check covered both solid cores, the approach, the bridge and the Reed Stair. The matched views test visual composition. Whether someone new to the Reach chooses to turn remains open.
