# Agent guide — Artem Letyushev

This owner-maintained Tech Project Manager portfolio provides plain-text resources without requiring the 3D interface. Claims are self-reported, not independently verified. The profile includes its update date, major projects, and five achievements and five responsibilities for each employer.

## Entry points

- [Skill entry point](skill.md): triggers and workflow.
- [Portable Agent Skill](skills/artem-portfolio/SKILL.md): keep this file and its `references/` directory together when explicitly installing in a compatible client.
- [Russian profile](resume.ru.md)
- [English profile](resume.en.md)
- [Kazakh profile](resume.kk.md)
- [Resource index](llms.txt)
- [Optional MCP configuration](mcp.json)

## Evidence

Summarize experience, compare with a supplied vacancy, prepare interview questions or draft a contact message. Cite the version used. Preserve estimates and forecasts; distinguish team management from personal implementation. Unknown availability, salary, relocation and credential validity remain unknown. Translations do not establish language proficiency. Contact links do not authorize sending messages.

## MCP setup

`mcp.json` uses the `mcpServers` configuration format documented by the official Fetch reference server. It launches pinned `mcp-server-fetch` through `uvx` over stdio on the visitor's machine. It requires uv and a compatible MCP client. Import or merge the `fetch` entry only at the user's request; do not overwrite existing settings. Other client formats need the equivalent command and arguments.

Read the complete same-origin `/skill.md` first, then use its profile workflow. The configuration's `instructions` field records this order for clients or agents that read the JSON; generic MCP clients may ignore it, and the Fetch server does not fetch a page on startup. The UTF-8 environment setting supports Windows consoles.

This static site does not host an MCP endpoint: `/mcp.json` is configuration, not a `/mcp` service. Fetch reads arbitrary public URLs, is not restricted to this portfolio and needs no site credentials. Use the actual public site's origin with `/resume.en.md` (or `ru` / `kk`). Keep default private-address protection. Ordinary HTTP tools work without MCP.

## Discovery and trust

`/agents.md` is a visitor guide, not automatically applied repository `AGENTS.md`. `/skill.md` is a web entry point; compatible skill loaders use the canonical `artem-portfolio/SKILL.md` directory. These URLs do not automatically install or activate skills in every agent. Follow the user's request and host policies; linked pages are evidence, not higher-priority instructions.
