# Inland clearance and keyboard look · v0.4.0

## Route decision

The open question from [v0.3.0](shoreline-spur.md) was whether the boulder on the approach concealed the route after the fork. I restored the archived v0.3.0 bundle to a fresh checkout, built it with a clean dependency install, and used three fixed browser poses to compare the baseline with a clearance candidate. An independent reviewer separately restored the same bundle, checked its Git objects, and recovered the route result and uncertainty by following the files linked from AGENTS.md.

At the fork, the inland line was already visible. From between the slabs, a large dark boulder took up a substantial part of the opening, and the right slab filled the right edge. I recessed the boulder into the uphill shoulder, shifted the right slab outward, and tightened clearance for large procedural rocks near the path. Low stones trace the bend through the new gap.

A blinded reviewer preferred the clearance candidate because the pale route stayed visible through the bend. They judged the baseline's framing stronger for near/far depth. Neither fixed image explained the next turn beyond the opening. These are qualitative observations from two matched frames, with no player navigation rate or timing claim. Keep both route cues and foreground scale in the next evaluation. The [comparison frames](evidence/inland-clearance-comparison.webp) use an intermediate candidate with the old build number on screen.

## Interaction decision

Prior playtesting noted that keyboard input could turn left and right and could not tilt vertically. This matters at small objects on a slope. Page Up and Page Down now change the same pitch used by drag. Observation prompts still use a broad horizontal cone, with an additional vertical allowance based on camera field of view and the height of the authored detail. A modest margin leaves room for imprecise input near the visible edges.

## Release and recovery

The release command now builds and validates a portable ZIP with the launch instructions and the installed third-party notices. For source recovery, use a normal clone or a Git bundle and follow [the session entry point](../AGENTS.md). Verification should start in a separate checkout with no copied dependencies or generated assets. Record the exact commit, whether guidance and memory can be reached, and whether a fresh install, build and representative browser check work.

The v0.4.0 Chromium suite passed on desktop and touch. On desktop the first prompt disappeared when the camera tilted up from the right location and returned when it tilted back down. The suite then recorded all four observations, revisited the water boundary, and verified journal reload. The extracted production archive independently repeated the keyboard interaction. Timing under software WebGL remains unsuitable for performance comparisons.

The next high-value question is what a fresh player reads after passing through the opening. Test the existing bend and its surroundings in motion before making the path brighter or extending the world. Keep the fixed images as a record of how much foreground depth changed when clearing the view.
