import {readFileSync,writeFileSync,rmSync} from 'node:fs';
import {resumeMarkdown} from '../src/resume.js';

const messages=JSON.parse(readFileSync(new URL('../src/messages.json',import.meta.url),'utf8'));
for(const locale of ['ru','en','kk']){
 const profile=resumeMarkdown(text=>messages[text]?.[locale]??text);
 writeFileSync(new URL(`../public/resume.${locale}.md`,import.meta.url),profile);
 writeFileSync(new URL(`../public/skills/artem-portfolio/references/profile.${locale}.md`,import.meta.url),profile);
}
const origin=process.env.SITE_URL||'';
if(origin&&(!/^https:\/\/[^/]+$/.test(origin)||new URL(origin).origin!==origin))throw Error('SITE_URL must be an HTTPS origin without a path.');
writeFileSync(new URL('../public/robots.txt',import.meta.url),`User-agent: *\nAllow: /\n${origin?`\nSitemap: ${origin}/sitemap.xml\n`:''}`);
if(origin){
 const paths=['/','/ru.html','/en.html','/kk.html'];
 writeFileSync(new URL('../public/sitemap.xml',import.meta.url),`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${paths.map(path=>`<url><loc>${origin+path}</loc></url>`).join('')}</urlset>`);
}
else rmSync(new URL('../public/sitemap.xml',import.meta.url),{force:true});
