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

Monochrome editorial typography with an electric lime interaction accent. References: https://typesafe.ai/ and https://olhalazarieva.com/. Manrope is locally bundled under the SIL Open Font License. No third-party photographs or invented portraits are used.

## Accessibility

Semantic landmarks, keyboard-operable disclosure controls, visible focus, native anchors, and reduced-motion support. No scroll hijacking.
