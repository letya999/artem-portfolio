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

The hero uses Three.js and a 38-layer photographic relief, inspired by rotating kinetic sculpture. Depth is art-directed, not a scan of the person's head. `public/portrait.png` is an AI-assisted monochrome background-removal edit of the supplied portrait. `public/artem-books.jpg` is the owner's second supplied photo.

Run geometry and animation checks with `node --test src/motion.test.js src/sculpture.test.js`. Run the browser scenario with `npx playwright test` (installed Google Chrome required).

## Verified locally

Production build, four geometry/motion tests and the Chrome browser scenario passed. The browser scenario exercises rendering, pause/resume, disassembly, replay, experience disclosures, PDF delivery and a 390px reduced-motion viewport. Desktop and mobile were visually inspected. `npm audit --omit=dev` and staged Gitleaks reported no findings. Physical iOS/Android devices and public hosting have not been tested. The Three.js bundle is approximately 209 KB gzip; Vite reports its uncompressed chunk above 500 KB.
