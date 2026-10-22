export const locales=['ru','en','kk'];
export const localeFromPath=path=>/^\/(ru|en|kk)\.html$/.exec(path)?.[1];
export const escapeHtml=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function profileMeta(locale,t,origin='',path=`/${locale}.html`){
 const title=`${t('Артем Летюшев')} — Tech / Delivery Project Manager`;
 const description=`${t('Артем Летюшев')} — Tech / Delivery Project Manager. ${t('7+ лет. Финтех, телеком, дейтинг.')} ${t('От требований до запуска.')}`;
 const url=origin+path,image=origin+'/artem-reference.png';
 const schema={'@context':'https://schema.org','@type':'ProfilePage',url,inLanguage:locale,name:title,description,mainEntity:{'@type':'Person','@id':origin+'/#person',name:t('Артем Летюшев'),alternateName:locale==='en'?'Артем Летюшев':'Artem Letyushev',jobTitle:'Tech / Delivery Project Manager',image,url:origin+'/',sameAs:['https://github.com/letya999','https://www.linkedin.com/in/artemletya','https://t.me/artemletya','https://habr.com/ru/users/Renewal_Studio/','https://vc.ru/id458029']}};
 return {title,description,url,image,schema};
}
export function updateSeo(locale,t){
 const canonical=document.querySelector('link[rel="canonical"]');
 const origin=document.querySelector('meta[name="site-origin"]')?.content||'';
 const path=localeFromPath(location.pathname)?location.pathname:'/';
 const meta=profileMeta(locale,t,origin,path);
 document.documentElement.lang=locale;document.title=meta.title;
 for(const [selector,value] of [['meta[name="description"]',meta.description],['meta[property="og:title"]',meta.title],['meta[property="og:description"]',meta.description],['meta[property="og:url"]',meta.url],['meta[property="og:locale"]',{ru:'ru_RU',en:'en_US',kk:'kk_KZ'}[locale]]]){
  const element=document.querySelector(selector);if(element)element.content=value;
 }
 if(canonical)canonical.setAttribute('href',meta.url);
 const schema=document.getElementById('profile-schema');if(schema)schema.textContent=JSON.stringify(meta.schema);
}
