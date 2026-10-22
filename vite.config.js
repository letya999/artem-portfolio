import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import {readFileSync,writeFileSync} from 'node:fs';
import {resumeMarkdown} from './src/resume.js';
function writeResumes(){
 const messages=JSON.parse(readFileSync(new URL('./src/messages.json',import.meta.url),'utf8'));
 for(const locale of ['ru','en','kk'])writeFileSync(new URL(`./public/resume.${locale}.md`,import.meta.url),resumeMarkdown(text=>messages[text]?.[locale]??text));
}
export default defineConfig({ plugins: [react(),{name:'localized-resumes',buildStart:writeResumes}], base: "./" });
