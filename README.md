# Artem Letyushev portfolio

React and Vite single-page portfolio. Content is based on the supplied CV. Estimates and projections are explicitly labelled.

## Development

Node 22.12+ is required.

```sh
npm ci
npm run dev
npm run build
npm run preview
```

The production site is generated into `dist`. No backend, cookies, analytics or API credentials are required. Contact actions link directly to email, Telegram and LinkedIn. The PDF in `public` is intentionally downloadable and contains the contact information supplied by the owner.

## Design

Monochrome editorial typography with an electric lime interaction accent. References: https://typesafe.ai/ and https://olhalazarieva.com/. Manrope and Oswald are locally bundled under the SIL Open Font License. No third-party photographs or invented portraits are used.

## Accessibility

Semantic landmarks, keyboard-operable disclosure controls, visible focus, native anchors, and reduced-motion support. No scroll hijacking.

## Motion implementation

The hero uses Three.js and 42 individually closed horizontal plates. A baked mesh contains 40,723 contour vertices derived from 468 pose-aligned facial landmarks combined from three supplied photographs, with a rounded cranium and neck. The face has simplified geometric nose, cheek and mouth depth with a smoothed cranial dome. The unseen back of the head and scalp depth are approximations, not a photogrammetry scan. `public/portrait.png` is an AI-assisted monochrome cutout of the owner's photograph; it remains only as a loading/error fallback. No photographic texture is applied to the metal sculpture. `public/artem-books.jpg` is the second supplied photo.

Each plate completes a staggered 360-degree turn during a repeating 18-second cycle. Short aligned intervals preserve recognition. Pointer movement anywhere in the viewport turns the head; a procedural shader draws dark eye slots and small moving pupils for a restrained android impression. Pause freezes both animation and gaze. Reduced motion shows the assembled model; failed geometry loading keeps the photograph visible.

`public/head-contours.bin` is a checked-in little-endian Float32 asset (814,460 bytes). No inference, camera access, remote API or Python dependency runs in the visitor's browser. To regenerate it, run `python scripts/bake-head.py` with numpy and scipy installed. It reads the fitted points in `scripts/face-landmarks.json` and writes both the binary and `src/head-data.json`.

To refit from the original images, run `python scripts/fit-head.py <model.task> <canonical.obj> <frontal-photo> <secondary-frontal-photo> <three-quarter-photo>` in an isolated environment with mediapipe 1.1.1, scipy 1.18.1, numpy 2.5.4 and pillow 13.0.0. The [official Face Landmarker model](https://ai.google.dev/edge/mediapipe/solutions/vision/face_landmarker) and [canonical face coordinates](https://github.com/google-ai-edge/mediapipe/blob/master/mediapipe/modules/face_geometry/data/canonical_face_model.obj) are external offline inputs. The canonical coordinates only align pose; the output shape comes from the supplied images. The frontal photograph receives the largest weight; left/right averaging reduces inferred pose asymmetry. The hand-occluded image is excluded from numerical fitting. Neither the original new photographs nor the downloaded models are included in the website or repository.

Run geometry and animation checks with `node --test src/motion.test.js src/sculpture.test.js`. Run the browser scenario with `npx playwright test` (installed Google Chrome required).

## Verified locally

Production build, six geometry/motion tests and two Chrome browser scenarios passed. Checks cover watertight plate geometry, head depth, cyclic motion, viewport pointer mapping, pause/resume, disassembly, replay, missing-asset fallback, experience disclosures, PDF delivery and a 390px reduced-motion viewport. Desktop and mobile were visually inspected. Physical iOS/Android devices and public hosting have not been tested. The Three.js application chunk is approximately 210 KB gzip; Vite reports its uncompressed size above 500 KB. The contour asset adds about 815 KB before HTTP compression.

The material direction follows the [Kafka sculpture mechanism manufacturer](https://www.thyssenkrupp-rotheerde.com/en/newsroom/press-releases/rothe-erde-ensures-movement-in-franz-kafkas-head): 42 independently rotating mirrored stainless-steel layers. The website uses a condensed 18-second choreography, not a literal reproduction of the monument programme. The current revision uses satin steel with high roughness, subdued environment reflections and a side key light. A regularized surface fit replaces cubic residual interpolation; the jaw outline follows face landmarks rather than the shirt silhouette, and photographed yaw is corrected. The likeness is still an estimate from three views, not a calibrated 3D scan.
