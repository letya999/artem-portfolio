import {readFileSync} from 'node:fs';
import {jobs,businesses} from '../src/portfolio-data.js';
import {areas,content} from '../src/practice-data.js';
import {escapeHtml as esc,locales,localeFromPath,profileMeta} from '../src/seo.js';

export function seoPlugin(siteUrl=''){
 let origin='';
 if(siteUrl){
  const url=new URL(siteUrl);
  if(url.protocol!=='https:'||url.username||url.password||url.pathname!=='/'||url.search||url.hash)throw new Error('SITE_URL must be an HTTPS origin without a path, credentials, query or fragment.');
  origin=url.origin;
 }
 const messages=JSON.parse(readFileSync(new URL('../src/messages.json',import.meta.url),'utf8'));
 const languages='<nav aria-label="Languages"><a href="/ru.html" lang="ru">Русский</a> · <a href="/en.html" lang="en">English</a> · <a href="/kk.html" lang="kk">Қазақша</a></nav>';
 const robots=`User-agent: *\nAllow: /\n${origin?`\nSitemap: ${origin}/sitemap.xml\n`:''}`;
 function render(html,locale,path){
  const t=text=>messages[text]?.[locale]??text;
  const {title,description,url,image,schema}=profileMeta(locale,t,origin,path);
  const alternate=locales.map(lang=>`<link rel="alternate" hreflang="${lang}" href="${esc(origin+'/'+lang+'.html')}" />`).join('\n');
  const head=`<!--seo:start-->
<meta name="site-origin" content="${esc(origin)}" />
<meta name="robots" content="index,follow,max-image-preview:large" />
<link rel="canonical" href="${esc(url)}" />
${alternate}
<link rel="alternate" hreflang="x-default" href="${esc(origin+'/')}" />
<meta property="og:type" content="profile" />
<meta property="og:title" content="${esc(title)}" />
<meta property="og:description" content="${esc(description)}" />
<meta property="og:url" content="${esc(url)}" />
<meta property="og:image" content="${esc(image)}" />
<meta property="og:image:alt" content="${esc(t('Артем Летюшев'))}" />
<meta property="og:locale" content="${{ru:'ru_RU',en:'en_US',kk:'kk_KZ'}[locale]}" />
<meta name="twitter:card" content="summary" />
<script id="profile-schema" type="application/ld+json">${JSON.stringify(schema).replaceAll('<','\\u003c')}</script>
<!--seo:end-->`;
  const profile=`<!--profile:start--><main style="max-width:960px;margin:40px auto;padding:24px;font-family:system-ui;line-height:1.65">${languages}<h1>${esc(t('Артем Летюшев'))}</h1><p>${esc(description)}</p>
<h2>${esc(t('Опыт работы'))}</h2>${jobs.map(([company,role,date,scope,points])=>`<section><h3>${esc(t(company))} — ${esc(t(role))}</h3><p>${esc(date)} · ${esc(t(businesses[company]))}</p><p>${esc(t(scope))}</p><ul>${points.map(point=>`<li>${esc(t(point))}</li>`).join('')}</ul></section>`).join('')}
${areas.map(([name,...tags],i)=>`<section><h2>${esc(t(name))}</h2><p>${tags.map(tag=>esc(t(tag))).join(' · ')}</p><p>${esc(t(content[i][0]))}</p>${content[i][1].map(([heading,body])=>`<h3>${esc(t(heading))}</h3><p>${esc(t(body))}</p>`).join('')}</section>`).join('')}
<h2>${esc(t('Контакт'))}</h2><a href="mailto:artemletyushev@gmail.com">artemletyushev@gmail.com</a><p>${schema.mainEntity.sameAs.map(link=>`<a href="${link}">${link}</a>`).join(' · ')}</p><a href="/resume.${locale}.md">Markdown</a> · <a href="/llms.txt">llms.txt</a> · <a href="/skill.md">Agent Skill</a></main><!--profile:end-->`;
  return html.replace(/<!--seo:start-->[\s\S]*?<!--seo:end-->/,'').replace(/<!--profile:start-->[\s\S]*?<!--profile:end-->/,'')
   .replace(/<html lang="[^"]*">/,`<html lang="${locale}">`).replace(/<title>[\s\S]*?<\/title>/,`<title>${esc(title)}</title>`)
   .replace(/<meta\s+name="description"\s+content="[^"]*"\s*\/>/,`<meta name="description" content="${esc(description)}" />`)
   .replace('</head>',head+'\n</head>').replace('<div id="root"></div>',`<div id="root">${profile}</div>`);
 }
 return {name:'portfolio-seo',
  configureServer(server){server.middlewares.use((req,res,next)=>{if(req.url?.split('?')[0]==='/robots.txt'){res.setHeader('Content-Type','text/plain; charset=utf-8');res.end(robots);}else next();});},
  transformIndexHtml(html,ctx){const path=(ctx.originalUrl||ctx.path).split('?')[0];return render(html,localeFromPath(path)||'ru',localeFromPath(path)?path:'/');},
  generateBundle:{order:'post',handler(_options,bundle){
   const index=bundle['index.html'];
   for(const locale of locales)this.emitFile({type:'asset',fileName:`${locale}.html`,source:render(String(index.source),locale,`/${locale}.html`)});
   this.emitFile({type:'asset',fileName:'robots.txt',source:robots});
   if(origin)this.emitFile({type:'asset',fileName:'sitemap.xml',source:`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${['/',...locales.map(lang=>`/${lang}.html`)].map(path=>`<url><loc>${esc(origin+path)}</loc></url>`).join('')}</urlset>`});
   else this.warn('SITE_URL is unset: portable relative metadata emitted; set SITE_URL at deployment to generate an absolute sitemap and social URLs.');
  }}
 };
}
