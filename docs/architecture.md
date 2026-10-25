# Architecture

Astro produces static HTML at the domain root. React islands hydrate only the portrait, practice, and conveyor interactions; Three.js renders their 3D scenes. The HTML contains profile content before hydration, so search engines and visitors without JavaScript can read it.

Canonical professional facts live in `src/portfolio-data.js` and `src/practice-data.js`. Interface translations live in `src/messages.json`. `scripts/generate-static.js` generates localized resumes and agent profile snapshots during `npm run build`; edit source data rather than generated copies. `SITE_URL` supplies absolute canonical, hreflang, social, schema, sitemap, and robots URLs at build time.

The output is `dist/`; GitHub Actions builds and publishes that folder to GitHub Pages. `/ru`, `/en`, and `/kk` are the public language URLs (built from `.html` files), and `404.html` handles unknown paths. Static 3D JSON, GLB, images, fonts, and downloadable CV files are under `public/`. GitHub Pages controls response caching and compression; `public/_headers` applies only to the retained Cloudflare Pages fallback. Cloudflare now supplies DNS only for the production domain. A lightweight voxel loader appears first; Three.js and the portrait data then load automatically after idle hydration, including on mobile. The static photo appears only when JavaScript or WebGL cannot render the model.

The head contour asset and voxel JSON are sizeable; a fast edge response cannot remove browser parsing, GPU upload, and rendering cost. Keep WebGL failure and reduced-motion fallbacks. Browser tests under `tests/` cover presentation, localization, interactions, SEO, and agent resources; unit tests live beside source modules.
