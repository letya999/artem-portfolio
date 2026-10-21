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
