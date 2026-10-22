export function profileMeta(locale,t,origin='',path=`/${locale}.html`){
 const title=`${t('Артем Летюшев')} — Tech / Delivery Project Manager`;
 const description=`${t('Артем Летюшев')} — Tech / Delivery Project Manager. ${t('7+ лет. Финтех, телеком, дейтинг.')} ${t('От требований до запуска.')}`;
 const url=origin+path,image=origin+'/artem-reference.png';
 const schema={'@context':'https://schema.org','@type':'ProfilePage',url,inLanguage:locale,name:title,description,mainEntity:{'@type':'Person','@id':origin+'/#person',name:t('Артем Летюшев'),alternateName:locale==='en'?'Артем Летюшев':'Artem Letyushev',jobTitle:'Tech / Delivery Project Manager',image,url:origin+'/',sameAs:['https://github.com/letya999','https://www.linkedin.com/in/artemletya','https://t.me/artemletya','https://habr.com/ru/users/Renewal_Studio/','https://vc.ru/id458029']}};
 return {title,description,url,image,schema};
}
