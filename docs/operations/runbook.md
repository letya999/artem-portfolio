# Operations runbook

## Local checks

1. Use Node.js 22.23.4 or newer; run `npm ci`.
2. Copy `.env.example` to ignored `.env`; set `SITE_URL=https://artemletyushev.website` for production checks.
3. Run `npm test`, `npm run build`, and focused Playwright checks with `npm run test:e2e` when Chrome is available.
4. Inspect `dist/ru.html`, `dist/en.html`, `dist/kk.html`, `dist/404.html`, `dist/sitemap.xml`, and `dist/robots.txt` for the intended origin and language links.

## Cloudflare Pages

Connect the private GitHub repository to a new Cloudflare Pages project and select `main`. Set framework preset Astro, build command `npm run build`, output directory `dist`, and build variable `SITE_URL=https://artemletyushev.website`. Keep analytics variables empty until counters are ready. A Git push to `main` should create a production deployment; verify the generated `*.pages.dev` URL before changing custom domains.

The current Direct Upload project cannot be converted to Git integration in place. For cutover, record its existing custom domains and DNS records, remove `artemletyushev.website` and `www.artemletyushev.website` from that project, attach both to the new project, and check the automatically managed DNS targets and SSL status. Keep the Cloudflare nameservers at REG.RU. DNS caches outside Cloudflare can retain old answers until TTL expiry.

Check the apex and `www` over HTTPS, each language URL, the PDF, agent resources, unknown-path HTTP 404, 3D assets, mobile navigation, and browser console. For 3D payloads, check Cloudflare edge cache headers and transfer size, then measure actual browser rendering separately. Do not claim Kazakhstan performance from a single synthetic request; validate from a real Kazakhstan network when available.

## Recovery

If the new deployment fails before domain cutover, keep the old project attached and fix the Git build. If cutover fails, reattach the domains to the old project using the recorded settings. Do not delete the old project until the new production site, domain, and SSL have been checked.
