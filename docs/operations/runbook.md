# Operations runbook

## Local checks

1. Use Node.js 22.23.4 or newer; run `npm ci`.
2. Copy `.env.example` to ignored `.env`; set `SITE_URL=https://artemletyushev.website` for production checks.
3. Run `npm test`, `npm run build`, and focused Playwright checks with `npm run test:e2e` when Chrome is available.
4. Inspect `dist/ru.html`, `dist/en.html`, `dist/kk.html`, `dist/404.html`, `dist/sitemap.xml`, and `dist/robots.txt` for the intended origin and clean `/ru`, `/en`, `/kk` language links.

## Cloudflare Pages

The live Git-connected project is `artem-portfolio-git`, sourced from private `letya999/artem-portfolio` branch `main`. It uses the Astro preset, build command `npm run build`, output directory `dist`, `SITE_URL=https://artemletyushev.website`, and `NODE_VERSION=22`. Its preview hostname is `artem-portfolio-git.pages.dev`. Keep analytics variables empty until counters are ready. A Git push to `main` creates a production deployment.

The previous Direct Upload project `artem-portfolio` remains available at `artem-portfolio-7y3.pages.dev` for rollback. Both `artemletyushev.website` and `www.artemletyushev.website` are attached to the Git project, and Cloudflare DNS has proxied CNAME records to `artem-portfolio-git.pages.dev`. The OpenAI TXT verification record remains in the zone. Keep the Cloudflare nameservers at REG.RU. Resolvers outside Cloudflare can retain the former answer until their TTL expires; a stale resolver does not indicate that the Pages deployment failed.

Check the apex and `www` over HTTPS, each language URL, the PDF, agent resources, unknown-path HTTP 404, 3D assets, mobile navigation, and browser console. For 3D payloads, check the one-day browser cache headers and transfer size, then measure actual browser rendering separately. The first mobile view should show the voxel loader, request `voxel-portrait.json` automatically after idle, then show the 3D model without a click. Check that `/social-card-v2.png` resolves and that Open Graph and X metadata reference its absolute URL. Do not claim Kazakhstan performance from a single synthetic request; validate from a real Kazakhstan network when available.

## Recovery

If a future Git deployment fails, Cloudflare Pages keeps the last successful production deployment. Diagnose the build log and restore a working commit. If the domain routing fails, reattach both domains to the previous Direct Upload project and verify its DNS and SSL. Do not delete the previous project until the owner decides rollback is no longer needed.
