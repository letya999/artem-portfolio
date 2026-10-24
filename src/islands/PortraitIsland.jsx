import {useEffect,useState} from 'react';
import {I18nProvider,useI18n} from '../i18n.jsx';
import PortraitLoader from '../PortraitLoader.jsx';

function PortraitGate(){
 const {t}=useI18n();
 const [Portrait,setPortrait]=useState(null);
 const [failed,setFailed]=useState(false);
 useEffect(()=>{import('../Portrait.jsx').then(module=>setPortrait(()=>module.default)).catch(()=>setFailed(true));},[]);
 if(Portrait)return <Portrait/>;
 return <div className="portrait-wrap">
  <div className="portrait-stage" role="group" aria-label={t('Кинетический объёмный портрет Артема')}>
   {failed?<p className="portrait-load-error">{t('Не удалось загрузить 3D-портрет')}</p>:<PortraitLoader/>}
   <noscript><img src="/artem-reference.webp" alt={t('Артем Летюшев')} className="portrait-fallback"/></noscript>
  </div>
 </div>;
}
export default function PortraitIsland({locale}){return <I18nProvider locale={locale}><PortraitGate/></I18nProvider>;}
