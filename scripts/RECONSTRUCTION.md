# Dense facial reconstruction experiment

This is a local evaluation, not a finished portrait or a full-head scan. It does not replace the portfolio hero. Generated face geometry and source photographs remain in ignored `qa/`.

## Method

1. Detect 478 image landmarks in each of five owner-supplied photographs with MediaPipe.
2. Use the official 3DDFA V2 MobileNet checkpoint to estimate pose, identity and expression, with a second crop refinement pass.
3. Reconstruct 38,365 vertices and 76,073 triangles from its supplied BFM basis.
4. Fit one shared 40-coefficient identity to 68 corresponding landmarks in three unoccluded views. Optimize rigid pose, orthographic scale, translation and ten expression coefficients independently per view. Use robust residuals and regularization around the neural initialization.
5. Export neutral and smiling surfaces as OBJ and indexed JSON. Inspect without a photo texture before applying any metal material.

Glasses and hand-occluded photographs are inferred individually but excluded from the shared fit. The correspondence between MediaPipe and 68-point BFM landmarks is approximate. The contour receives lower weight because visible silhouettes move with pose.

## Reproduce

Python 3.11 with torch, numpy, scipy and opencv-python-headless. Obtain the official repository separately; model files are not redistributed here.

```text
python scripts/reconstruct-dense.py --model-root qa/3ddfa --manifest qa/photo-boxes.json --output qa/reconstruction
```

The private JSON manifest contains an array of records with `name`, local image `path`, `bbox: [left, top, right, bottom]` and `points: [[pixelX, pixelY], ...]` (478 entries). Shared fitting requires the labels `smile`, `neutral`, and `outdoor`. Additional labels are exported individually. Keep manifests and photographs out of Git.

Outputs include per-view meshes, `fitted.obj`, `fitted-smile.obj`, and `fit-report.json`. Assertions check finite geometry, valid topology indices, landmark shape and reduced fitting residual. The checkpoint loads through PyTorch weights-only mode; pickle loading allows only the NumPy array constructors required by the upstream assets.

## Observed result

Mean 2D landmark residual decreased from 0.03107 to 0.01849 of face height on the three fitted views. This is an in-sample fit, not a held-out validation or a percentage of portrait likeness. Visual inspection still shows imperfect identity. The surface has no upper scalp, ears, back of head, eyeballs or teeth. No invisible anatomy is recovered by this procedure.

The two OBJ variants and interactive evaluation viewer are kept locally under `qa/reconstruction/`. The existing site's previously rejected head remains unchanged pending a usable replacement.

## Sources and restrictions

- [3DDFA V2, official implementation](https://github.com/cleardusk/3DDFA_V2): neural inference, preprocessing and BFM representation. Its source is MIT; model data has separate restrictions.
- [Multi-view 3DMM fitting](https://github.com/Yinghao-Li/3DMM-fitting): shared shape fitting across front and side photographs.
- [NextFace](https://github.com/abdallahdib/NextFace): an alternative inverse-rendering pipeline; not executed in this experiment.
- [Basel Face Model terms](https://www.faces.cs.unibas.ch/bfm/main.php?id=downloads&nav=1-2): internal, non-commercial research/evaluation/testing. Do not copy these assets or resulting experiment into a published portfolio without resolving the applicable model license.

Do not present this experiment as a successful identity reconstruction. More landmarks alone do not resolve missing depth, occlusions, camera differences or the limitations of the statistical identity basis.


## Estimated full-head completion

`python scripts/complete-research-head.py qa/reconstruction` extends the fitted face boundary into a smoothed bald cranium and adds estimated ear shells and a neck. It exports `fitted-head.obj` and `fitted-smile-head.obj`, each with 73,453 vertices and 145,673 triangles, plus a Three.js inspection page. The viewer adds separate cursor-responsive iris/pupil meshes; these are not included in the OBJ exports. Put the locally supplied neutral portrait at `qa/reconstruction/neutral-reference.png` for side-by-side inspection.

The face remains the multi-view fit. Skull, ears and neck are artistic estimates, not a scan of unseen anatomy. The neck and ear surfaces intersect the head and are not a watertight fabrication mesh. Eye interiors and teeth remain incomplete. Model-data license restrictions still apply. No claim of verified portrait similarity is made.


## Four-photo revision (current)

The active fitting manifest now requires `smile`, `outdoor`, `glasses`, and `occluded`; the older hair/boat photo is no longer part of the fit. Only smile and outdoor estimates initialize shared identity. Glasses mask eye, brow and upper nose points. The hand-occluded view contributes only the visible right jaw, eyebrow and eye; masks are manually selected approximate correspondences, not automated occlusion confidence. Reattached copies depict the same photographs, so existing pixel landmarks were reused.

The weighted in-sample residual changed from 0.03182 to 0.01636 face heights. This metric differs from the previous unweighted three-view metric and cannot be compared as a likeness improvement. The preview defaults to the facial surface again; rejected estimated skull/ears/iris overlays are removed. A toggle compares the saved previous fit under identical lighting. Old head exports remain available locally but are not the default. Completer no longer replaces the viewer.

Before a new reconstruction, preserve the current `fitted.json` and `fitted-smile.json` as `fitted-previous.json` and `fitted-smile-previous.json` for the comparison viewer. The browser checks cover neutral/expression/material controls; visual inspection still finds incomplete likeness.

## Bust on a plinth

The current preview loads the four-photo fitted face completed with skull, ears, a shortened flared neck and a bevelled two-step plinth. Each export has 73,835 vertices and 146,822 triangles. Completion asserts that every original face vertex is unchanged. The rear cap uses one pole vertex, and the outer patch winding is matched to the source boundary. `plinthStart` separates the base material in the indexed JSON; OBJ exports contain the geometry without viewer materials.

The viewer offers full-bust/face-only comparison, neutral/smile, matte/metal and pointer rotation. Desktop controls and a 390px mobile viewport were checked; horizontal overflow was fixed. Scalp/ear joins remain approximate, and the separate neck/ear components are not a watertight print mesh. No portrait accuracy claim or publication clearance is implied.


## Metal tile transfer

`python scripts/tile-research-bust.py qa/reconstruction/fitted-head.json qa/reconstruction/portrait-tiles.json` intersects the actual fitted bust mesh with 73 horizontal planes. For each plane, ray/segment intersection selects the outer contour, avoiding inner neck and face intersections. Adjacent contours form planar, inset quadrilateral tiles consumed by the existing closed/bevelled tile renderer. The current output has 5,872 tiles in 72 animated bands. Tile projection approximates the source mesh; undercuts and cavities cannot all survive a radial contour representation.

The portfolio dev server loads this ignored research asset. Production builds continue using the previous distributable asset, because BFM-derived geometry has not been cleared for publication. No photo texture is applied to the tiles. Desktop/mobile browser rendering reported no console errors; existing motion, validation and browser interaction tests were rerun. The full smooth bust remains available in the research viewer.


## Owner GLB scan (current production asset)

Checkpoint `9f99ade` preserves the approved pre-scan code; the corresponding ignored research geometry is backed up at `qa/scan-2026-10-21/approved-portrait-tiles.json`.

The user supplied `21.10.2026.glb` in a ZIP. SHA-256: `f0c6fd938a5f190045087c013cba1f37f080f33a3678ceb3dd0d34bfa84a7442`. The source has 221,422 vertices and 390,900 triangles, with a photo texture, background and shoulders. It is a front-facing scan with an open rear, not a complete watertight head.

Run `python scripts/prepare-owner-scan.py INPUT.glb OUTPUT_DIRECTORY`, then `python scripts/tile-research-bust.py OUTPUT_DIRECTORY/scan-bust.json OUTPUT_DIRECTORY/portrait-tiles.json`. Preparation validates this GLB's simple untransformed triangle layout, welds texture-seam duplicates, removes background and lower-neck fragments with scan-specific bounds, keeps the largest connected component, and applies two light Taubin denoising passes. It retains 32,016 measured vertices. The open rear is closed approximately; the neck and pedestal are procedural. Ear anatomy comes from the scan, not the previous synthetic ear shells.

The resulting distributable `public/portrait-tiles.json` contains 4,239 closed tile elements in 60 bands. It replaces the BFM-derived local-only experiment in both dev and production. No BFM mesh, basis, or photo texture is used in this new asset. Source GLB and personal photographs remain ignored; only the derived display geometry is committed. This does not constitute a general licensing review of the user's scanner application.

Radial slicing interpolates small contour gaps and simplifies ear cavities and other undercuts. The preview is an artistic metal bust, not a fabrication-ready scan. Tiles have more visible bevels and reduced random shade variation. Original landmark-fit assertions were replaced by volumetric-depth and full-height assertions, since this asset is measured scan geometry rather than a 468-landmark reconstruction.

## Bust refinement and 360 controls

Removed the pedestal and added a shallow shoulder termination. The unmeasured back now uses a smooth rounded contour with a crown blend, rather than inheriting the scan's torn posterior boundary. Ear-angle contours receive localized smoothing to suppress folded tile fans; deep concha/helix undercuts remain simplified by radial tiling. The current asset contains 4,671 elements in 60 bands.

Cursor yaw range increased to +/-1.05 radians and pitch to +/-0.38. Per-tile eye/brow weights drive small shader offsets (0.012/0.016 model units); this is subtle mechanical expression, not an anatomical eyeball or facial-muscle rig. Reduced-motion disables automatic following/expression. The explicit 360-degree overview button starts/stops rotation; pause freezes it, and reset returns to the default controls. Tests cover feature-weight bounds, rotation changes, pause stability, reset state and mobile overflow.

## Regression repair after cd99ba5

The user rejected the full-bust refinement. Diff inspection located the geometry regression in `tile-research-bust.py`: an analytic posterior profile replaced samples at and behind the ear seam, and also replaced the crown. It used a different origin from each measured slice and changed the contour after arc-length spacing had already been computed. This expanded the silhouette, suppressed ear geometry and produced uneven tile widths. The angular ear blur compounded that loss. These overrides were removed; tiles again follow the same mesh contour used for spacing. Mild one-bin noise filtering remains.

The rear mesh depth was restored to 0.92, shoulder width reduced, and excessive tracking pitch reduced from 0.38 to 0.18 radians. Yaw remains wider than the pre-control version at +/-0.70 radians. The 360 overview, pause, reset, no-pedestal bust and small expression offsets remain. New asset: 4,551 tiles, 60 layers. This repairs the identified regression; the incomplete scanned back and radial ear undercuts are still approximate, not certified anatomical reconstruction.

## Original complete cube model with scanned face (current)

At the owner's explicit request, the hero now uses `makeVoxelPortrait` and `public/voxel-portrait.json`, starting from the unmodified `portrait-detail.json` inside the supplied voxel archive (verified byte-for-byte). `scripts/fit-original-cubes.py BASE SCAN_FACE OUTPUT` aligns the cleaned owner scan to the original head coordinates and changes only face-region cube depth with a feathered transition. 279 original cubes move; 558 internal cubes support the relief; total 2,852. Original skull, forehead, ears, rear and neck cubes keep their exact positions and orientations, checked during generation. This prevents incomplete scan topology from determining the rest of the head.

This is depth transfer onto the original XY cube layout, not full nonrigid anatomical registration. Original proportions and stylized ear shapes remain. Existing 360 overview, cursor-driven head rotation, horizontal layer animation and pause/reset are retained. The previous per-tile expression shader does not apply to the instanced cube renderer; no independent eye/brow animation is claimed for this version. The previous scan tile asset remains on disk for comparison but is not displayed by the hero. The archive's MIT notice is retained at `public/voxel-LICENSE.txt`.

## Dense closed scan-driven cube volume (current)

The previous 2,852-cube depth transfer left disconnected steps and retained the template's facial arrangement. The replacement `scripts/build-dense-scan-cubes.py` resamples a connected volume rather than displacing isolated surface cubes.

Inputs are the original archive's analytic `tools/build_model.py`, the measured world-space triangle mesh emitted by `prepare-owner-scan.py`, and an ignored local scan-frame JSON. The frame is computed from 3D eye/mouth anchors recovered from an orthographic textured scan view: X follows the eye line, Y follows the eye-to-mouth direction orthogonal to X, and Z is their cross product. The original scan has a lateral offset, roll and pitch; all three are removed before rasterization. Landmark detections and source images stay in ignored `qa/`.

Reproduce with:

```text
python scripts/build-dense-scan-cubes.py --template-code qa/voxel-portrait-preview/voxel-portrait/tools/build_model.py --scan qa/scan-2026-10-21/scan-measured-world.json --frame qa/scan-2026-10-21/scan-frame.json --output public/voxel-portrait.json --aligned-scan qa/scan-2026-10-21/aligned-scan.json
```

The current model has 15,269 unique cubes, including 8,108 on its outer skin, versus 2,852 in the rejected model. Pitch is 0.04 and cube side 0.0418 (42.3% smaller than the archive's 0.07245). A two-course shell overlaps slightly on a regular unrotated lattice, shielding the interior at recesses and depth transitions. Generation verifies one solid component, no enclosed voids in the solid, and that filling the hollow render shell recovers exactly that solid. A separate JavaScript flood-fill test verifies that exterior air cannot reach the left temple or head core in the committed display asset.

The front is rasterized from actual scan triangles over 1,416 XY columns. Head width and chin height are fitted to the measured footprint. The 95th percentile frontal quantization error is 0.03827 design units, within one 0.04 voxel. This measures rasterization accuracy in the fitted region, not portrait similarity or unseen anatomy. The original complete template supplies the unmeasured rear, neck and stylized ears. No BFM model or photo texture is used.

The instanced renderer combines square/bevel geometry normals with continuous surface normals for facial lighting; geometry remains discrete and closed. Frame-only shader attributes are validated, and per-band cloned geometries are disposed by the portrait's existing traversal cleanup. The 360, cursor response, pause, reset and reduced-motion behavior remain available.

The final build, 12 unit checks and 3 browser tests pass. A separate live-browser check verified left/back views, mobile overflow, pause/reset and no page/network errors. A local desktop requestAnimationFrame sample was about 6.9 ms median; this is local cadence, not a mobile GPU benchmark. The ignored `qa/scan-2026-10-21/compare-dense.html` shows the aligned scan and cube head at matching angles and lighting. The scan's holes at the rear are intentionally visible only in that comparison's source panels; they are not copied into the complete cube model.


## Follow-up: remove inherited jaw and replace oversized ears (current final geometry)

The user correctly identified a second defect during the dense rebuild: the measured face was still merged into the template's lower jaw, leaving a visible outer arc. The retained procedural ears were oversized and too circular. The current builder discards that template jaw/ear volume entirely. Per-height head widths now come from the measured scan silhouette. Measured triangle depths supply the full facial surface; only unseen side strips blend into the template-derived rear depth. A narrower neck attaches behind the measured chin and cannot project through its front.

The ear surface is reconstructed by rasterizing the well-preserved right scan ear in the YZ plane and filling its lateral relief into the skull. The other ear is mirrored because the scan's left side is incomplete. This is measured ear relief with a shallow backing, not an independently captured left ear. Its exposed voxel height is checked against the captured position. The jaw regression test rejects an oversized frontal arc below the scanned chin.

Final asset: 13,144 unique cubes, 6,902 outer-skin cubes, side 0.0418 and pitch 0.04. The older 15,269 count above describes the rejected intermediate candidate. It is superseded by this jaw/ear correction. The current quantization residual is 0.03781 design units at the 95th percentile over 1,446 scanned face columns. One connected solid and a closed two-course render shell remain enforced; no face texture or BFM geometry is used. Rear geometry is estimated, not scanned. Final validation is 13 unit checks, 3 browser tests, build, and a live browser inspection of front/profile/back/mobile plus rotation/pause/reset.


## Scalp, eyes, lips and shorter-neck shoulder bust

Checkpoint `88071e3` preserves the approved measured-jaw version before this refinement. Eight static views were captured before and after: front, three-quarter, both profiles, rear, top, underside and perspective. Review images use a matte material to distinguish real geometry from metal reflections; the product retains its studio steel lighting. Files remain locally under ignored `qa/bust-refinement/`, including `before-gallery.png`, `after-gallery.png`, `main-desktop.png` and `main-mobile.png`.

Upper-head depth uses a median filter followed by smooth Gaussian blending above the brows, and the upper solid receives a small morphological opening to remove isolated scanner spikes. Width samples are also filtered. The eyes, nasal area and measured jaw contour are excluded from that scalp smoothing. A small measured-anchor lip relief increases the upper/lower lip planes and mouth seam; 50 front cubes carry lip/seam shading. Two dark front cubes form pupils at the scanned iris centers, with adjacent iris cubes and small cursor-driven translation. No photo texture is applied.

A curved shoulder cap rises to Y=0.50 below the measured chin at Y=0.72, shortening the visible front neck from about 0.72 to 0.22 design units. The lower-neck core is narrowed and remains sealed. The shoulders are an added external shell, so their deliberate porosity cannot expose the head's inner core. About 12.1% of the dense lower outer shoulder candidates remain, with a stable deterministic pattern rather than frame-by-frame disappearance. Only shoulder instances receive 0.008-0.026-unit oscillation and a small scale pulse. Time, pause, reset and reduced motion share the portrait's existing clock/control flow. Pupils have their own small gaze offset; scalp/face cubes receive no shoulder drift.

Current asset: 14,543 cubes, including 2,079 shoulder cubes, 2 pupil cubes and 50 lip/seam cubes. Head/neck outer shell: 6,527 cubes; pitch and side remain 0.04 and 0.0418. The core remains one connected closed solid. The incomplete left ear remains mirrored from the scanned right ear, and the rear is completed rather than scanned. The artistic mouth/scalp edits are excluded from the unchanged-face quantization check.

Validation: 14 unit checks, 3 browser tests, production build, 360/pause/reset/mobile checks, and a pixel comparison confirming that shoulder animation changes the lower bust while leaving the head image unchanged. Reduced motion freezes the entire local effect. The viewport now fits the wider bust on mobile instead of clipping the shoulders. Real mobile hardware was not tested. The build still has the pre-existing large JavaScript chunk warning.

## Head with an oblique neck cut (supersedes the shoulder bust)

The owner requested removal of the entire shoulder shell. The narrow neck now ends at an inclined plane, with a closed two-course cap. A separate one-course fringe extends at most 0.06 units below that cap: 52 of 75 candidate cubes remain (69.3%), with only 0.004-unit drift. This provides a slightly sparse edge without opening the head/neck shell. Total display geometry is 11,351 cubes; pitch and cube size remain 0.04 and 0.0418. The measured face, jaw and ear geometry is retained.

Pupils, iris and lip cubes now use the same light steel shade range as every other cube; the feature-specific dark inserts were removed. The resting head pitch is -0.10 radians (about 5.7 degrees chin-up), giving a calmer neutral presentation. The animation spring and reduced-motion reset both preserve that rest pitch. Cursor tracking and the existing 360/pause/reset controls remain available.

Local before/after screenshots cover eight projections under ignored `qa/neck-cut/`. A pixel check confirms that only the cut fringe drifts while the head stays rigid, and that reduced motion freezes the effect. Validation includes 16 unit checks, four browser scenarios and the production build. The rear remains estimated and the incomplete left ear mirrored; real mobile hardware was not tested.

## Stronger neck, visible cube bevels and cursor-relative turning

Checkpoint `182a242` preserves the preceding oblique-cut head. The neck's midsection is roughly 18% wider and 11% deeper, tapering into its previous upper attachment. It retains the oblique closed cap without shoulders or a pedestal. The regenerated asset has 11,659 cubes, including 64 sparse edge cubes (75.3% of candidates). The measured face-depth residual remains unchanged.

Cube bevel ratio increased from 0.018 to 0.04, narrowing each flat square face from 96.4% to 92% of cube width and making its rim visible. Cube centers, overlap, lattice pitch and the shared steel palette remain intact. Model scale increased from 1.12 to 1.40. The orthographic height was slightly relaxed from 4.0 to 4.1 units and vertically recentered to keep the enlarged head inside the frame during full turns; the resulting screen enlargement is about 22%.

Cursor targeting now computes yaw/pitch angles from the portrait stage's actual center and height, including pointer positions outside the canvas. The head can turn up to 1.35 radians each way and tilt up/down by 0.60 radians around its raised rest pitch. YXZ rotation order keeps vertical gaze intact during a lateral turn. Leaving the document returns to the default pose; explicit 360 rotation, pause, reset and reduced-motion behavior retain control over automatic following.

Validation: 18 unit checks, four browser scenarios and a production build. Browser assertions inspect real rendered object rotations and project every cube's bounds through the active camera at four cursor extremes. Local QA under ignored `qa/strong-neck/` includes eight static projections, six cursor directions including diagonals, and desktop/mobile screenshots without page errors or horizontal overflow. Real mobile hardware was not tested.
