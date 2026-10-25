# Operations runbook

## Local checks

1. Use Node.js 22.23.4 or newer; run `npm ci`.
2. Copy `.env.example` to ignored `.env`; set `SITE_URL=https://artemletyushev.website` for production checks.
3. Run `npm test`, `npm run build`, and focused Playwright checks with `npm run test:e2e` when Chrome is available.
4. Inspect `dist/ru.html`, `dist/en.html`, `dist/kk.html`, `dist/404.html`, `dist/sitemap.xml`, and `dist/robots.txt` for the intended origin and clean `/ru`, `/en`, `/kk` language links.

## GitHub Pages

The public repository is `letya999/artem-portfolio`, with `main` as its sole project branch. Repository Settings → Pages uses GitHub Actions. `.github/workflows/deploy-pages.yml` runs on pushes to `main` and manual dispatch: Node.js 24, `npm ci`, `npm test`, `npm run build`, upload `dist`, then deploy to the `github-pages` environment. Actions are pinned to commit SHAs. The workflow sets `SITE_URL=https://artemletyushev.website`; no personal deployment token is required. Keep analytics variables empty until counters are ready.

GitHub Pages has the custom domain `artemletyushev.website`, verified in the owner's GitHub account, with Enforce HTTPS enabled for the issued apex/`www` certificate. The registrar delegates DNS to the free REG.RU servers `ns1.reg.ru` and `ns2.reg.ru`. The zone contains:

| Type | Name | Value |
| --- | --- | --- |
| A | @ | `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153` (four records) |
| AAAA | @ | `2606:50c0:8000::153`, `2606:50c0:8001::153`, `2606:50c0:8002::153`, `2606:50c0:8003::153` (four records) |
| CNAME | www | `letya999.github.io.` |
| TXT | @ | Existing OpenAI domain verification value |
| TXT | _github-pages-challenge-letya999 | Existing GitHub domain verification value |

Positive TTL and SOA negative-cache minimum are set to REG.RU's minimum of one hour. Remove obsolete parking IPs and avoid wildcard records. Cloudflare is no longer the authoritative DNS provider; retain its old zone during propagation so cached delegations still resolve to GitHub. Existing resolver caches retain their previous TTL: clearing Windows DNS with `Clear-DnsClientCache` cannot clear ISP caches or shorten already-cached answers. Check registry delegation, both authoritative servers, public resolvers, and the local resolver separately. See [GitHub's DNS values](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site) and [REG.RU record management](https://help.reg.ru/support/dns-servery-i-nastroyka-zony/nastroyka-resursnykh-zapisey-dns/nastroyka-resursnykh-zapisey-v-lichnom-kabinete).

Check the apex and `www` over HTTPS, each language URL, the PDF, agent resources, unknown-path HTTP 404, 3D assets, mobile navigation, and browser console. Verify that production responses come from GitHub Pages rather than Cloudflare. GitHub controls cache headers: `public/_headers` is not GitHub Pages configuration. Measure actual compression, transfer size and rendering separately. The first mobile view should show the voxel loader, request `voxel-portrait.json` automatically after idle, then show the 3D model without a click. Check that `/social-card-v2.png` resolves and that Open Graph and X metadata reference its absolute URL. Availability in Russia and Kazakhstan requires checks from real local networks; a successful CI deployment does not establish regional availability.

On 2026-10-25, Globalping probes in Rostelecom (AS12389), MTS (AS8359), Vimpelcom (AS3216), and ER-Telecom (AS51570) fetched `/ru` and `/voxel-portrait.json` over HTTPS: all eight requests returned 200 with valid TLS. The model transferred 950,548 compressed bytes. Direct DNS checks from Russian probes against `ns1.reg.ru` and `ns2.reg.ru` returned the GitHub records, including IPv6 and the GitHub verification TXT; the registry RDAP showed both REG.RU nameservers. These are point-in-time network checks, not a guarantee for every ISP, mobile network, browser, or future block. Cached old delegations may still use the retained Cloudflare zone during propagation.

## Cloudflare fallback

The Git-connected Cloudflare project `artem-portfolio-git` remains at `artem-portfolio-git.pages.dev`, built with `npm run build`, output `dist`, `SITE_URL=https://artemletyushev.website`, and `NODE_VERSION=22`. The older Direct Upload project `artem-portfolio` remains at `artem-portfolio-7y3.pages.dev`. Preserve both projects for rollback. Their `_headers` rules still apply when those hosts are used.

## Recovery

If a GitHub Actions build fails, the last successful GitHub Pages deployment remains live. Diagnose its logs and fix or restore a working commit. For a DNS repair, restore the REG.RU records above; changing nameservers introduces another propagation delay. The Cloudflare projects remain available at their `pages.dev` addresses, but restoring them on the production domain requires a separate DNS/custom-domain migration and HTTPS checks. Do not delete the fallback projects until the owner decides rollback is no longer needed.
