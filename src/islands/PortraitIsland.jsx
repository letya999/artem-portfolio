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
   <img src="/portrait-poster.webp" alt={t('Артем Летюшев')} fetchPriority="high" className="portrait-fallback" width="663" height="634"/>
  </div>
 </div>;
}
export default function PortraitIsland({locale}){return <I18nProvider locale={locale}><PortraitGate/></I18nProvider>;}
