import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {chromium} from '@playwright/test';
import {resumeHtml} from '../src/resume-html.js';

// Noto covers Kazakh without platform font fallbacks or ambiguous character maps.
const fonts=['Regular','Bold'].map((style,index)=>`@font-face { font-family:Resume; font-weight:${index?700:400}; src:url(data:font/ttf;base64,${readFileSync(new URL(`./assets/fonts/NotoSans-${style}.ttf`,import.meta.url)).toString('base64')}) format('truetype'); }`).join('\n');
const styles=`${fonts}
@page { size:A4; }
* { box-sizing:border-box; }
body { margin:0; font:10pt/1.45 Resume,sans-serif; color:#1d2422; }
h1 { margin:0 0 8pt; font-size:26pt; line-height:1.15; }
h2 { margin:17pt 0 7pt; font-size:15pt; line-height:1.25; }
h3 { margin:12pt 0 5pt; font-size:11.5pt; line-height:1.3; }
h4 { margin:9pt 0 4pt; font-size:10pt; }
h1,h2,h3,h4 { break-after:avoid; }
h3+p { break-after:avoid; }
p { margin:0 0 7pt; orphans:3; widows:3; }
ul { margin:0 0 9pt; padding-left:14pt; }
li { margin:0 0 4pt; break-inside:avoid; }
a { color:#244d39; text-decoration:underline; overflow-wrap:anywhere; }
`;

export async function generateResumePdfs(profiles){
 const browser=await chromium.launch(process.env.CI?{}:{channel:'chrome'});
 try{
  for(const {locale,markdown} of profiles){
   const page=await browser.newPage();
   try{
    await page.setContent(`<!doctype html><html lang="${locale}"><head><meta charset="utf-8"><title>Artem Letyushev · ${locale.toUpperCase()}</title><style>${styles}</style></head><body>${resumeHtml(markdown)}</body></html>`);
    await page.evaluate(()=>document.fonts.ready);
    await page.pdf({path:fileURLToPath(new URL(`../public/resume.${locale}.pdf`,import.meta.url)),format:'A4',printBackground:true,tagged:true,outline:true,margin:{top:'15mm',right:'16mm',bottom:'18mm',left:'16mm'},displayHeaderFooter:true,headerTemplate:'<span></span>',footerTemplate:`<div style="font:8px sans-serif;width:100%;text-align:center;color:#626b66">Artem Letyushev · ${locale.toUpperCase()} · <span class="pageNumber"></span> / <span class="totalPages"></span></div>`});
   }finally{await page.close();}
  }
 }finally{await browser.close();}
}
