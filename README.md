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

The hero uses Three.js and 64 individually closed horizontal plates. A baked mesh contains 49,601 contour vertices derived from 478 MediaPipe landmarks on the supplied portrait, with a rounded cranium and neck. The face has geometric nose, cheek and mouth depth. The unseen back of the head and scalp depth are approximations, not a photogrammetry scan. `public/portrait.png` is an AI-assisted monochrome cutout of the owner's photograph; its UV mapping preserves facial texture. `public/artem-books.jpg` is the second supplied photo.

Each plate completes a staggered 360-degree turn during a repeating 12-second cycle. Short aligned intervals preserve recognition. Pointer movement anywhere in the viewport turns the head; a local eye shader moves iris sampling within the photographed eyelids. This is a textured gaze effect, not separately rigged eyeballs. Pause freezes both animation and gaze. Reduced motion shows the assembled model; failed geometry loading keeps the photograph visible.

`public/head-contours.bin` is a checked-in little-endian Float32 asset (992,020 bytes). No inference, camera access, remote API or Python dependency runs in the visitor's browser. To regenerate it, use `scripts/bake-head.py <model-path>` in an isolated Python environment with mediapipe 1.1.1, scipy 1.18.1, numpy 2.5.4 and pillow 13.0.0. Download the Face Landmarker model from the [official MediaPipe guide](https://ai.google.dev/edge/mediapipe/solutions/vision/face_landmarker). The script updates both the binary and `src/head-data.json`; keep them together. The downloaded model and temporary environment are not distributed.

Run geometry and animation checks with `node --test src/motion.test.js src/sculpture.test.js`. Run the browser scenario with `npx playwright test` (installed Google Chrome required).

## Verified locally

Production build, six geometry/motion tests and two Chrome browser scenarios passed. Checks cover watertight plate geometry, head depth, cyclic motion, viewport pointer mapping, pause/resume, disassembly, replay, missing-asset fallback, experience disclosures, PDF delivery and a 390px reduced-motion viewport. Desktop and mobile were visually inspected. Physical iOS/Android devices and public hosting have not been tested. The Three.js application chunk is approximately 210 KB gzip; Vite reports its uncompressed size above 500 KB. The contour asset adds about 1 MB before HTTP compression.
