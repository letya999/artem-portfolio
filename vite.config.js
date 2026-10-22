import { defineConfig,loadEnv } from "vite";
import {seoPlugin} from './scripts/seo.js';
import react from "@vitejs/plugin-react";
import {readFileSync,writeFileSync} from 'node:fs';
import {resumeMarkdown} from './src/resume.js';
function writeResumes(){
 const messages=JSON.parse(readFileSync(new URL('./src/messages.json',import.meta.url),'utf8'));
 for(const locale of ['ru','en','kk']){
  const profile=resumeMarkdown(text=>messages[text]?.[locale]??text);
  writeFileSync(new URL(`./public/resume.${locale}.md`,import.meta.url),profile);
  writeFileSync(new URL(`./public/skills/artem-portfolio/references/profile.${locale}.md`,import.meta.url),profile);
 }
 const skill=readFileSync(new URL('./public/skills/artem-portfolio/SKILL.md',import.meta.url),'utf8');
 writeFileSync(new URL('./public/skill.md',import.meta.url),skill.replaceAll('](references/','](skills/artem-portfolio/references/'));
}
export default defineConfig(({mode})=>({ plugins: [react(),{name:'localized-resumes',buildStart:writeResumes},seoPlugin(process.env.SITE_URL||loadEnv(mode,process.cwd(),'SITE_').SITE_URL||'')], base: "./" }));
