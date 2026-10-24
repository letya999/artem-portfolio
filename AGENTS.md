# Artem Portfolio — agent instructions

This repository builds a static, multilingual portfolio with Astro and three React/Three.js islands. Read [README.md](README.md) and [docs/index.md](docs/index.md) before changing behavior.

## Work boundaries

- Preserve the owner's supplied professional facts. Mark estimates, prototypes, and launch-stage work accurately. Do not invent achievements or portrait identity.
- Keep Russian, English, and Kazakh content aligned. Update `src/portfolio-data.js`, `src/practice-data.js`, and `src/messages.json` as appropriate; generated resumes and agent resources come from `scripts/generate-static.js`.
- Preserve readable static HTML, keyboard access, reduced motion, WebGL fallbacks, and a genuine 404 response.
- Do not commit `.env`, tokens, private source photos, local scanner state, or generated `dist/`. Do not print secrets. Read [docs/security.md](docs/security.md) for asset boundaries.
- Keep `main` as the sole project branch unless the owner requests otherwise.

## Commands

| Command | Purpose |
| --- | --- |
| `npm ci` | Install locked Node dependencies. |
| `npm run dev` | Generate resources and run the local site. |
| `npm run build` | Generate production files in `dist/`. |
| `npm test` | Run JavaScript unit tests. |
| `npm run test:e2e` | Run Playwright browser tests with local Chrome. |

For publication, set `SITE_URL` to the HTTPS origin before building and follow [docs/operations/runbook.md](docs/operations/runbook.md). Review affected source, callers, tests, fixtures, and configuration before editing. A static review does not equal executed validation; report exactly which commands and live checks ran.
