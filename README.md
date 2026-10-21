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

The hero uses the exact 400×400 reference supplied by the owner (`public/artem-reference.png`). Its face is registered directly onto a closed 3D surface: front geometry coordinates and UVs preserve the source proportions, smile and tilt. Orthographic projection avoids additional perspective distortion. A shader converts the source to monochrome; satin metallic lighting supplies depth without replacing the facial features. The original image resolution limits fine detail. The rounded back is an approximation, not a scan.

The portrait stays assembled most of the time. Every 24 seconds, only three neighbouring plates complete a staggered turn; the selected band alternates between forehead and lower neck. Head rotation and subtle iris displacement follow the cursor across the viewport. Pause and reduced motion are preserved. Scroll no longer disassembles the face. The manual disassembly control remains available.

`public/head-contours.bin` contains 40,723 vertices (814,460 bytes). Regenerate with `python scripts/bake-head.py <face_landmarker.task>` in an isolated environment with mediapipe, numpy, scipy and pillow. The source photo is processed locally. Historical multi-view fitting files are retained for provenance, but are not used by the current bake or browser.

Run geometry and animation checks with `node --test src/motion.test.js src/sculpture.test.js`. Run the browser scenario with `npx playwright test` (installed Google Chrome required).

## Verified locally

Production build, six geometry/motion tests and two Chrome browser scenarios passed. Checks cover watertight plate geometry, head depth, cyclic motion, viewport pointer mapping, pause/resume, disassembly, replay, missing-asset fallback, experience disclosures, PDF delivery and a 390px reduced-motion viewport. Desktop and mobile were visually inspected. Physical iOS/Android devices and public hosting have not been tested. The Three.js application chunk is approximately 210 KB gzip; Vite reports its uncompressed size above 500 KB. The contour asset adds about 815 KB before HTTP compression.
