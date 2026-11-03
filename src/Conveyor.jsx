import {useI18n} from './i18n.jsx';
import {useEffect,useRef} from 'react';
import {createConveyor} from './conveyor-scene.js';
const profiles=[['Habr','https://habr.com/ru/users/Renewal_Studio/','habr'],['GitHub','https://github.com/letya999','github'],['LinkedIn','https://www.linkedin.com/in/artemletya','linkedin'],['Telegram','https://t.me/artemletya','telegram'],['vc.ru','https://vc.ru/id458029','vc']];
export default function Conveyor(){
 const {t}=useI18n();
  const root=useRef(null);
  useEffect(()=>createConveyor(root.current),[]);
  return <section id="conveyor" className="conveyor-section" aria-labelledby="resources-title">
    <h2 id="resources-title">{t('Публикации и проекты')}.</h2>
    <div className="conveyor-stage" ref={root} aria-hidden="true">{profiles.map(([name,url,slug])=><a className="conveyor-link" key={name} href={url} target="_blank" rel="noreferrer" aria-label={name} tabIndex={-1}><img src={`./brand-marks/${slug}.svg`} alt="" width="80" height="80" /></a>)}</div>
    <nav className="resource-links" aria-label={t('Публикации и проекты')}>{profiles.map(([name,url])=><a key={name} href={url} target="_blank" rel="noreferrer">{name}<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 19 19 5M5 5h14v14" stroke="currentColor" strokeWidth="1.5" /></svg></a>)}</nav>
  </section>;
}
