import {readFileSync,writeFileSync,rmSync} from 'node:fs';
import {resumeMarkdown} from '../src/resume.js';
import {generateResumePdfs} from './generate-resume-pdfs.js';
import {achievements,profileUpdated,profileRole,profileScope,profileDomains} from '../src/portfolio-data.js';

const messages=JSON.parse(readFileSync(new URL('../src/messages.json',import.meta.url),'utf8'));
const profiles=[];
for(const locale of ['ru','en','kk']){
 const profile=resumeMarkdown(text=>messages[text]?.[locale]??text);
 profiles.push({locale,markdown:profile});
 writeFileSync(new URL(`../public/resume.${locale}.md`,import.meta.url),profile);
 writeFileSync(new URL(`../public/skills/artem-portfolio/references/profile.${locale}.md`,import.meta.url),profile);
}
await generateResumePdfs(profiles);
const en=text=>messages[text]?.en??text;
writeFileSync(new URL('../public/llms.txt',import.meta.url),`# Artem Letyushev — ${en(profileRole)}

> Owner-maintained portfolio. Claims are self-reported; preserve estimates and forecasts as such. Translations are not independent verification.

Updated: ${profileUpdated}

${en(profileScope)} ${en(profileDomains)}

## Selected outcomes

${achievements.map(([title,metric,body])=>`- ${en(title)} (${en(metric)}): ${en(body)}`).join('\n')}

## Profiles and resumes

- [Russian profile](resume.ru.md) · [PDF](resume.ru.pdf)
- [English profile](resume.en.md) · [PDF](resume.en.pdf)
- [Kazakh profile](resume.kk.md) · [PDF](resume.kk.pdf)

## Agent resources

- [Agent guide](agents.md): evidence and integration details.
- [Skill](skill.md): triggers and profile workflows.
- [Portable skill](skills/artem-portfolio/SKILL.md): canonical layout with bundled references.
- [MCP configuration](mcp.json): optional local stdio Fetch server; read skill.md first. Not a hosted endpoint.
`);
const origin=process.env.SITE_URL||'';
if(origin&&(!/^https:\/\/[^/]+$/.test(origin)||new URL(origin).origin!==origin))throw Error('SITE_URL must be an HTTPS origin without a path.');
writeFileSync(new URL('../public/robots.txt',import.meta.url),`User-agent: *\nAllow: /\n${origin?`\nSitemap: ${origin}/sitemap.xml\n`:''}`);
if(origin){
 const paths=['/','/ru','/en','/kk'];
 writeFileSync(new URL('../public/sitemap.xml',import.meta.url),`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${paths.map(path=>`<url><loc>${origin+path}</loc><lastmod>${profileUpdated}</lastmod></url>`).join('')}</urlset>`);
}
else rmSync(new URL('../public/sitemap.xml',import.meta.url),{force:true});
