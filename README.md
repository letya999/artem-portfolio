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

## SEO and AI search

The build serves readable profile HTML before JavaScript, using the same localized experience and competency data as the interactive site. `/ru.html`, `/en.html` and `/kk.html` are stable language URLs; explicit language URLs override browser preferences. The homepage keeps browser-language detection. Switching languages preserves the query and section anchor.

Each page includes localized title/description, canonical and reciprocal language links, Open Graph metadata, a Twitter summary card, and Schema.org `ProfilePage` with `Person`. The supplied portrait is used for previews. Public content is allowed by `robots.txt`; the agent Markdown resources remain accessible. No hidden keywords, fabricated reviews or guaranteed AI rankings are used. See [Google's JavaScript guidance](https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics) and [AI search guidance](https://developers.google.com/search/docs/appearance/ai-features).

Copy `.env.example` to `.env` or configure `SITE_URL` in the deployment build environment. Set it to the HTTPS origin, without a path, query or fragment. The domain is not hardcoded: rebuilding generates absolute canonical, language, social and schema URLs plus `sitemap.xml` and its `robots.txt` declaration. Without `SITE_URL`, metadata remains relative and no invalid relative sitemap is emitted. Absolute URLs are needed for reliable production language discovery and social previews.

Publish the entire `dist` folder at the domain root. Serve generated `.html`, `.md`, `.json`, `.txt`, images and assets directly; return genuine HTTP 404 for unknown paths instead of rewriting every missing resource to the homepage. Configure HTTPS and one canonical hostname at the host/CDN. Use short caching for HTML and long immutable caching only for hashed `/assets/` files. Protect staging from indexing at the host. These host settings cannot be enforced by a static build.

After publishing, verify ownership in Google Search Console and Bing Webmaster Tools, submit `/sitemap.xml`, and inspect the live language URLs and structured data. On domain migration, update `SITE_URL`, rebuild, and configure permanent redirects from corresponding old URLs; retain the old domain while search engines process the move. Search-console ownership, external indexing, CDN rules and real-user Core Web Vitals require the deployed site and are not established by local tests. The existing Three.js bundle still triggers Vite's size warning.

Validation: `node --test tests/seo-build.test.mjs` checks builds with two different origins and without one. `node node_modules/@playwright/test/cli.js test tests/seo.spec.js tests/localization.spec.js tests/agent-discovery.spec.js tests/agent-view.spec.js --workers=1` checks static HTML, JavaScript-disabled reading, metadata, localization and agent resources.

## Agent interfaces

Root-domain static resources are available at `/skill.md`, `/agents.md`, `/mcp.json`, and `/llms.txt`. The Agent view links to all four; HTML alternate links advertise the Russian, English and Kazakh Markdown profiles.

The portable skill lives in `public/skills/artem-portfolio/`: distribute `SKILL.md` together with `references/`. Vite generates the root skill alias with adjusted links and the three bundled profile snapshots from the same data as the downloadable resumes. Edit the canonical skill, not the generated alias or snapshots. The build copies these resources into `dist`; deploy them as real files before any SPA fallback. Paths assume deployment at the domain root.

The skill follows [Agent Skills](https://agentskills.io/specification). The visitor guide distinguishes itself from repository [AGENTS.md](https://agents.md/) instructions. The additional [llms.txt](https://llmstxt.org/) index is a discovery proposal, not a guarantee of agent support or automatic activation.

The MCP file follows the [official Fetch server configuration](https://github.com/modelcontextprotocol/servers/tree/main/src/fetch). It starts a pinned local stdio server via `uvx`; this static site does not host a remote MCP endpoint. Users explicitly merge the entry into compatible client settings. Fetch can read arbitrary public sites, not just this portfolio. No credentials or private-address bypass are configured. Installation and MCP client connection are not automatic.

Validate with `node node_modules/@playwright/test/cli.js test tests/agent-discovery.spec.js tests/agent-view.spec.js --workers=1` and `node node_modules/vite/bin/vite.js build`.

## Motion implementation (original implementation notes)

The hero uses the exact 400×400 reference supplied by the owner (`public/artem-reference.png`). Its face is registered directly onto a closed 3D surface: front geometry coordinates and UVs preserve the source proportions, smile and tilt. Orthographic projection avoids additional perspective distortion. A shader converts the source to monochrome; satin metallic lighting supplies depth without replacing the facial features. The original image resolution limits fine detail. The rounded back is an approximation, not a scan.

The portrait stays assembled most of the time. Every 24 seconds, only three neighbouring plates complete a staggered turn; the selected band alternates between forehead and lower neck. Head rotation and subtle iris displacement follow the cursor across the viewport. Pause and reduced motion are preserved. Scroll no longer disassembles the face. The manual disassembly control remains available.

`public/head-contours.bin` contains 40,723 vertices (814,460 bytes). Regenerate with `python scripts/bake-head.py <face_landmarker.task>` in an isolated environment with mediapipe, numpy, scipy and pillow. The source photo is processed locally. Historical multi-view fitting files are retained for provenance, but are not used by the current bake or browser.

Run geometry and animation checks with `node --test src/motion.test.js src/sculpture.test.js`. Run the browser scenario with `npx playwright test` (installed Google Chrome required).

## Verified locally

Production build, six geometry/motion tests and two Chrome browser scenarios passed. Checks cover watertight plate geometry, head depth, cyclic motion, viewport pointer mapping, pause/resume, disassembly, replay, missing-asset fallback, experience disclosures, PDF delivery and a 390px reduced-motion viewport. Desktop and mobile were visually inspected. Physical iOS/Android devices and public hosting have not been tested. The Three.js application chunk is approximately 210 KB gzip; Vite reports its uncompressed size above 500 KB. The contour asset adds about 815 KB before HTTP compression.
