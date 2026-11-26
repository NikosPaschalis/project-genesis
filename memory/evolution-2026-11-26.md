# Extended evolution session · 26 November 2026

World baseline is v0.4.0 at `63d2bcf`. The attached checkout was at `57d9319` and fast-forwarded to the public repository's newer state before any edits. Both constitutional files and the independent evaluation protocol govern this session.

## 1. Survey the basin with the runtime walking rules

**Question.** Can a second land connection close the basin into a loop without erasing the water as the central navigation constraint?

**Method and evidence.** Extracted the existing ground, site footprint and bounds checks into the geography module used by movement and by [the route survey](../tools/survey-route.mjs). On the unchanged geometry the half-metre cardinal survey found 56–58 blocked cells on each direct transect. For the 42 m west-to-east transect at z=12, the route around the basin measured 172 m on the grid. Other transects measured 148–164 m. These are sampled connectivity distances. [Baseline data](evidence/basin-survey-v0.4.0.json)

**Evaluation and next choice.** A crossing near z=12 is a useful candidate. It offers a second physical connection while leaving the other three transects closed. First give the eastern bank a legible route from the Crown to that shore so a shortcut has somewhere to lead.

## 2. Give the far shore its own route

**Question.** Can an existing stretch of traversable ground offer a distinct downhill journey without expanding the movement bounds?

**Method and evidence.** Added the Reed Stair, a bent shale trail from the Crown Bank to the southern shore. A raised shoulder and a lower shelf give the route an inland edge and alternating views over water. Terrain coloration and vegetation clearance use the same authored path. Sampling 51 positions on each of the seven center-line segments found no blocked locations. Elevation ranged from 1.59 to 5.87 m and the steepest sampled grade was 0.244 m/m.

**Evaluation and next choice.** The route supplies an east-bank destination and a natural approach to the z=12 transect. Advance the crossing as a raised walking surface so the existing lake and its water boundary remain intact.

## 3. Close the basin loop with a real walking surface

**Question.** Does a single visible crossing change the route network while preserving deep water elsewhere?

**Method and evidence.** Added a 38 m timber crossing on stone piers, with a continuous deck height used for both movement and construction. Its west approach branches off the old descent. The z=12 route changed from 172 m around the basin to 42 m across it in the half-metre cardinal survey. The three other transects still have 55–57 blocked cells. A denser probe checked 915 center and shoulder locations on the deck and 12 locations just outside it over deep water. All supported or rejected movement as intended. [Crossing survey](evidence/basin-survey-crossing.json)

**Evaluation and next choice.** The new route permits both an early excursion and a shorter return after the Crown. A bridge alone could reduce the eastern shore to transit. Give the far bank a substantial spatial discovery that can be approached from either direction.

## 4. Build a landmark at two scales

**Question.** Can a monumental structure draw someone off the new trail and offer an interior route worth inspecting?

**Method and evidence.** The Measure House places three open stone bays on the shoulder above the path. The central aisle is continuous, with open flanks and a separate exterior object. The same wall dimensions drive construction and the walking boundaries. All 459 probes in three lines through the aisle were walkable. Six wall-face probes blocked movement and six exterior probes remained open. In the fixed browser comparison, the low red path remains readable at the bend while the tall bays take over the left-hand silhouette. At the approach, the open bay and paving are visible from the path. [Baseline bend, revised bend, and approach](evidence/east-bank-comparison.webp)

The first candidate visual capture exposed an omitted shore-path import from cycle 1, which passed the build and numerical survey but prevented browser entry. Restored that dependency before retaining any candidate captures. The pinned v0.4.0 browser suite passed after installing dependencies inside its own checkout. An earlier run with symlinked dependencies failed Vite's font serving boundary. Use a local npm cache in this sandbox.

**Evaluation and next choice.** The house offers scale and turns the shore into a choice. Its aisles still lack a reason to study their alignment. Use their existing geometry to make perspective itself an observation.

## 5. Make viewpoint part of discovery

**Question.** Can the same object arrangement tell a different story when approached from another side?

**Method and evidence.** Three pieces of a brass figure sit at different depths along the aisle. Their radius and height scale with distance from a worn footing so that the pieces share a projected center there. Recorded the same westward view from the footing and 1.15 m to one side. The first reads as one shape with seams and the second as several separate shapes. The target rule passed the intended center and a wrapped yaw at both field-of-view values. It rejected five off-axis, reverse-facing or steeply tilted poses at each value. [Matched rendered views](evidence/measure-alignment.webp)

**Evaluation and next choice.** The visible shape provides a payoff before the note. The axial pose should still be tested with actual movement, including overshoot at low frame rates. Add an optional acoustic cue inside the house that changes with position and turn, so the place has another scale of attention.

## 6. Give the path an acoustic gradient

**Question.** Can careful listening distinguish passage over open water from time spent among the stone bays?

**Method and evidence.** Extended the opt-in Web Audio graph. Wind brightens over the crossing. In the ruin it dulls and gives way to a softly varying three-part tone, panned from the middle bay. The same physical locations used for construction determine the transitions. Six numerical poses established 330 Hz wind center at the overlook, 510 Hz on the crossing and 230 Hz in the center bay. Resonance is zero at the overlook and outside the house, and unit strength at the center. A half-turn at the same approach position flipped pan from +1 to −1 at unchanged gain. These are synthesis parameters. Perceived level and quality require listening judgment.

**Evaluation and next choice.** Sound is optional and the visual observation remains sufficient. The image comparisons exposed a different issue: grass crosses flooring and a boulder intrudes into an aisle. Control vegetation around architecture and give the waterline a distinct ecology.

## 7. Let shore ecology explain the waterline

**Question.** Can vegetation distinguish the still-water edge while keeping the trail and interior visual channels open?

**Method and evidence.** Seeded reed colonies by water-relative height and let taller leaf tips respond to wind. The deterministic generator produced 34 tufts and 374 stems. Tuft anchors sit 0.106–0.310 m above the water plane and outside both ends of the crossing. Independently filtered the grass and large rocks that grew into the Measure House aisle. Before-and-after rendered views show the localized reed line and the cleared paving. The reduced-motion browser capture rendered the shader without console errors. [Shoreline comparison and cleared aisle](evidence/reed-beds-and-aisle.webp)

**Evaluation and next choice.** The new reed line reads as a distinct littoral band. The isolated tree at the bend still fills much of the near frame and is worth testing with players before adjusting it. The house and bridge add many repeated meshes, so measure rendering cost before further expansion.

## 8. Measure and reduce rendering submission

**Question.** Can the new geometry and existing foliage share the frame more economically while retaining the same authored world?

**Method and evidence.** Batched the house and bridge meshes by material and divided the existing grass into 18 m patches for frustum culling. Captured renderer counters from identical 880×550, reduced-motion poses on the pre-batch checkout and the candidate. Across six poses, draw calls fell from 863 to 441 and submitted triangles from 638,044 to 434,488. Every measured pose decreased on both counters. The southern view improved least on calls because it looks through many grass patches. These are work-submission counters, with no measured frame-time or hardware-performance claim. [Per-pose data](evidence/east-bank-renderer.json)

**Evaluation and next choice.** The counters support keeping the batches. The new world now provides evidence that can be encountered in either order, yet the previous journal imitates a fixed tour. Make its records reflect the player's own itinerary and let previously seen objects be compared without exposing unseen ones.

## 9. Make the journal reflect the journey

**Question.** Can the journal help players compare evidence from different routes while keeping unseen material hidden?

**Method and evidence.** Entries now follow the order in which they were recorded. Three marginal comparisons become available only after both cited observations are present. The old saved ID array and its storage key still work. Enumerated all 64 subsets of the six observations with a stale ID included. Entry order was preserved, each comparison referenced only known IDs, and the original four-entry result opened without a marginal comparison.

**Evaluation and next choice.** The journal now supports looking back over a player-chosen route. Numerical predicates and rendered stills have covered separate pieces, so the next cycle needs a repeatable input-driven run connecting the crossing, the sighting, and the journal through reload.
