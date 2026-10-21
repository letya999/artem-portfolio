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
