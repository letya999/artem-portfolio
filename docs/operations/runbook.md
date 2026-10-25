# Operations runbook

## Local checks

1. Use Node.js 22.23.4 or newer; run `npm ci`.
2. Copy `.env.example` to ignored `.env`; set `SITE_URL=https://artemletyushev.website` for production checks.
3. Run `npm test`, `npm run build`, and focused Playwright checks with `npm run test:e2e` when Chrome is available.
4. Inspect `dist/ru.html`, `dist/en.html`, `dist/kk.html`, `dist/404.html`, `dist/sitemap.xml`, and `dist/robots.txt` for the intended origin and clean `/ru`, `/en`, `/kk` language links.

## GitHub Pages

The public repository is `letya999/artem-portfolio`, with `main` as its sole project branch. Repository Settings → Pages uses GitHub Actions. `.github/workflows/deploy-pages.yml` runs on pushes to `main` and manual dispatch: Node.js 24, `npm ci`, `npm test`, `npm run build`, upload `dist`, then deploy to the `github-pages` environment. Actions are pinned to commit SHAs. The workflow sets `SITE_URL=https://artemletyushev.website`; no personal deployment token is required. Keep analytics variables empty until counters are ready.

GitHub Pages has the custom domain `artemletyushev.website`. Cloudflare DNS contains DNS-only CNAME records for `artemletyushev.website` and `www`, both pointing to `letya999.github.io`; the apex uses Cloudflare CNAME flattening to return GitHub Pages IP addresses. The OpenAI TXT verification record remains unchanged. Keep the Cloudflare nameservers at REG.RU: Cloudflare supplies DNS, not the production HTTP proxy. After DNS validation and certificate issuance, enable Enforce HTTPS in Pages. Public resolvers can retain old answers until TTL expiry; test authoritative/public DNS separately from a stale local resolver.

Check the apex and `www` over HTTPS, each language URL, the PDF, agent resources, unknown-path HTTP 404, 3D assets, mobile navigation, and browser console. Verify that production responses come from GitHub Pages rather than Cloudflare. GitHub controls cache headers: `public/_headers` is not GitHub Pages configuration. Measure actual compression, transfer size and rendering separately. The first mobile view should show the voxel loader, request `voxel-portrait.json` automatically after idle, then show the 3D model without a click. Check that `/social-card-v2.png` resolves and that Open Graph and X metadata reference its absolute URL. Availability in Russia and Kazakhstan requires checks from real local networks; a successful CI deployment does not establish regional availability.

## Cloudflare fallback

The Git-connected Cloudflare project `artem-portfolio-git` remains at `artem-portfolio-git.pages.dev`, built with `npm run build`, output `dist`, `SITE_URL=https://artemletyushev.website`, and `NODE_VERSION=22`. The older Direct Upload project `artem-portfolio` remains at `artem-portfolio-7y3.pages.dev`. Preserve both projects for rollback. Their `_headers` rules still apply when those hosts are used.

## Recovery

If a GitHub Actions build fails, the last successful GitHub Pages deployment remains live. Diagnose its logs and fix or restore a working commit. For a hosting rollback, verify the Cloudflare Git project's custom-domain associations, restore both CNAME targets to `artem-portfolio-git.pages.dev` with proxy enabled, and check DNS and HTTPS. If necessary, reattach the domains to the older Direct Upload project instead. Do not delete the fallback projects until the owner decides rollback is no longer needed.
