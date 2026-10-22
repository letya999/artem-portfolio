import {useI18n} from './i18n.jsx';
import {useEffect,useRef} from 'react';
import {createConveyor} from './conveyor-scene.js';
const profiles=[['Habr','https://habr.com/ru/users/Renewal_Studio/','habr'],['GitHub','https://github.com/letya999','github'],['LinkedIn','https://www.linkedin.com/in/artemletya','linkedin'],['Telegram','https://t.me/artemletya','telegram'],['vc.ru','https://vc.ru/id458029','vc']];
export default function Conveyor(){
 const {t}=useI18n();
  const root=useRef(null);
  useEffect(()=>createConveyor(root.current),[]);
  return <section id="conveyor" className="conveyor-section" aria-labelledby="resources-title">
    <h2 id="resources-title"><a href="#conveyor">{t('Мои ресурсы')}</a></h2>
    <div className="conveyor-stage" ref={root}>{profiles.map(([name,url,slug])=><a className="conveyor-link" key={name} href={url} target="_blank" rel="noreferrer" aria-label={name}><img src={`./brand-marks/${slug}.svg`} alt="" width="80" height="80" /></a>)}</div>
  </section>;
}
