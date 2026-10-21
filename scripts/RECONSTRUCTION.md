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
