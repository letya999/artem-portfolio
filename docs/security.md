# Security and publication boundaries

The site is static and needs no server credentials. `.env` is local and ignored by Git; `.env.example` documents only public build values. Cloudflare build settings should contain `SITE_URL` and, if deliberately enabled, public analytics IDs. Never put tokens in `PUBLIC_*` variables: they are bundled into browser code.

Before publication, scan staged files and Git history for credentials, inspect large or unexpected files, and verify `.env` is ignored. Do not commit local scanner state, private task traces, or setup tokens. A passing scanner reduces risk but does not prove that every sensitive fact is absent.

The GPL license covers original source code and documentation. Owner-supplied portrait photographs and CV are distributed to display this portfolio, not relicensed for reuse. Third-party notices remain with their assets: font licenses in `public/`, icon attribution in `public/brand-marks/ATTRIBUTION.md`, story credits in `public/story/CREDITS.txt`, voxel attribution in `public/voxel-LICENSE.txt`, and WebXR hand notice in `scripts/assets/webxr-hand.LICENSE.md`.

Analytics are disabled when their public IDs are empty. Before enabling them, configure the corresponding services and handle applicable privacy information or consent. Deployment does not create those counters automatically.
