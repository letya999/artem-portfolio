import {profileUpdated} from './portfolio-data.js';
export function profileMeta(locale,t,origin='',path=`/${locale}.html`){
 const title=`${t('Tech Project Manager')} — ${t('Артем Летюшев')}`;
 const description=`${t('Артем Летюшев')} — ${t('Tech Project Manager')}. ${t('7+ лет. Финтех, телеком, дейтинг.')} ${t('От требований до запуска.')}`;
 const url=origin+path,image=origin+'/artem-reference.png';
 const schema={'@context':'https://schema.org','@type':'ProfilePage',url,inLanguage:locale,name:title,description,dateModified:profileUpdated,mainEntity:{'@type':'Person','@id':origin+'/#person',name:t('Артем Летюшев'),alternateName:['Artem Letyushev','Артем Летюшев'],jobTitle:t('Tech Project Manager'),image,url:origin+'/',sameAs:['https://github.com/letya999','https://www.linkedin.com/in/artemletya','https://t.me/artemletya','https://habr.com/ru/users/Renewal_Studio/','https://vc.ru/id458029']}};
 return {title,description,url,image,schema};
}
