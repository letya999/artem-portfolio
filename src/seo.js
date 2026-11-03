import {profileUpdated,profileRole,profileScope,profileDomains,biography} from './portfolio-data.js';
export function profileMeta(locale,t,origin='',path=`/${locale}`){
 const title=`${t(profileRole)} — ${t('Артем Летюшев')}`;
 const description=`${t('Артем Летюшев')}. ${t(profileScope)} ${t(profileDomains)}`;
 const url=origin+path,image=origin+'/social-card-v2.png';
 const schema={'@context':'https://schema.org','@type':'ProfilePage',url,inLanguage:locale,name:title,description,dateModified:profileUpdated,mainEntity:{'@type':'Person','@id':origin+'/#person',name:t('Артем Летюшев'),alternateName:['Artem Letyushev','Артем Летюшев'],jobTitle:t(profileRole),image:origin+'/artem-reference.png',url:origin+'/',sameAs:['https://github.com/letya999','https://www.linkedin.com/in/artemletya','https://t.me/artemletya','https://habr.com/ru/users/Renewal_Studio/','https://vc.ru/id458029']}};
 schema.mainEntity.description=[profileScope,...biography].map(t).join(' ');
 schema.mainEntity.subjectOf=['pdf','md'].map(format=>({'@type':'DigitalDocument',name:`${t('Резюме')} — ${t('Артем Летюшев')}`,url:`${origin}/resume.${locale}.${format}`,inLanguage:locale,encodingFormat:format==='pdf'?'application/pdf':'text/markdown',dateModified:profileUpdated}));
 return {title,description,url,image,schema};
}
