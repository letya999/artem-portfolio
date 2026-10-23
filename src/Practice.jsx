import {useI18n} from './i18n.jsx';
import {useEffect,useRef,useState} from 'react';
import {createPracticeScene} from './practice-scene.js';
import {areas,content} from './practice-data.js';

const order=[2,1,0];
const cardCopy=['Знаю, как довести до результата','Понимаю, как это реализовать','Понимаю, что создаём и зачем'];

const gear=(cx,cy,outer,inner,teeth)=>{
  const points=Array.from({length:teeth*4},(_,i)=>{
    const angle=i/(teeth*4)*Math.PI*2-Math.PI/2;
    const radius=i%4===1||i%4===2?outer:inner;
    return `${(cx+Math.cos(angle)*radius).toFixed(3)},${(cy+Math.sin(angle)*radius).toFixed(3)}`;
  });
  return `M${points.join('L')}Z`;
};
function PracticeIcon({kind}){
  return <svg viewBox="0 0 96 96" focusable="false" aria-hidden="true" className="practice-icon" xmlns="http://www.w3.org/2000/svg">
    <defs><linearGradient id={`icon-metal-${kind}`} x2=".8" y2="1"><stop stopColor="#fff"/><stop offset=".38" stopColor="#b8bec0"/><stop offset=".7" stopColor="#f4f5f4"/><stop offset="1" stopColor="#6f777b"/></linearGradient></defs>
    {kind===0&&<g stroke="#3f484c" strokeWidth="1.3" strokeLinejoin="round">
      <path d="M8 55l58-12 19 10-58 12zM8 55v8l19 10v-8m0 8 58-12v-8" fill="url(#icon-metal-0)"/>
      <path d="M8 43l58-12 19 10-58 12zM8 43v8l19 10v-8m0 8 58-12v-8" fill="url(#icon-metal-0)"/>
      <path d="M8 31l58-12 19 10-58 12zM8 31v8l19 10v-8m0 8 58-12v-8" fill="url(#icon-metal-0)"/>
      <path d="M37 25l14-3 19 10-14 3zM37 37l14-3 19 10-14 3zM37 49l14-3 19 10-14 3z" fill="#555e61"/>
      <path d="M19 34l11-2m35-6 8 4M19 46l11-2m35-6 8 4" fill="none" stroke="#fff" strokeWidth="1.4"/>
      <text x="49" y="33" fill="#293034" stroke="none" fontSize="15" fontWeight="900" >₽</text>
    </g>}
    {kind===1&&<g stroke="#495257" strokeWidth="2" strokeLinejoin="round">
      <path d={gear(36,58,27,20,9)} fill="url(#icon-metal-1)"/><circle cx="36" cy="58" r="9" fill="#edf0ef"/>
      <path d={gear(65,31,20,15,8)} fill="url(#icon-metal-1)"/><circle cx="65" cy="31" r="6.5" fill="#edf0ef"/>
      <path d="M19 55c4-14 14-19 24-17M54 27c4-9 11-12 18-9" fill="none" stroke="#fff" strokeWidth="2.2"/>
    </g>}
    {kind===2&&<g stroke="#454d50" strokeWidth="2" strokeLinejoin="round">
      <path d="M63 8a24 24 0 0 0-21 30L12 68a11 11 0 0 0 16 16l31-31A24 24 0 0 0 87 24L72 39 60 36 56 23 70 9A24 24 0 0 0 63 8Z" fill="url(#icon-metal-2)"/>
      <path d="M19 72 48 43M49 38l9 10" fill="none" stroke="#fff" strokeWidth="2"/><circle cx="20" cy="76" r="4" fill="#dce0df"/>
    </g>}
  </svg>;
}

export default function Practice(){
  const {t,locale}=useI18n();
  const stage=useRef(null),dialog=useRef(null);
  const [selected,setSelected]=useState(2);
  useEffect(()=>{
    let cleanup=()=>{};
    const observer=new IntersectionObserver(([entry])=>{
      if(entry.isIntersecting){observer.disconnect();cleanup=createPracticeScene(stage.current);}
    },{rootMargin:'100px'});
    observer.observe(stage.current);
    return ()=>{observer.disconnect();cleanup();};
  },[locale]);
  return <section className="practice" id="practice">
    <h2><a href="#practice">{t('Работа на пересечении')}</a></h2>
    <div className="practice-stage" ref={stage}>
      <div className="practice-inputs">
        {order.map((areaIndex,row)=><div className="practice-row" key={areaIndex}>
          <article className="practice-area">
            <PracticeIcon kind={row}/>
            <div><h3>{t(areas[areaIndex][0])}</h3><p>{t(cardCopy[areaIndex])}</p></div>
            <button className="practice-more" aria-label={`${t('Узнать подробнее')}: ${t(areas[areaIndex][0])}`} onClick={()=>{setSelected(areaIndex);dialog.current.showModal();}}>↗</button>
          </article>
          <div className="practice-stream" aria-hidden="true">
            {areas[areaIndex].slice(1).map(tag=><span className="practice-tag" key={tag}><span className="practice-tag-label">{t(tag)}</span><i className="practice-tag-cube" aria-hidden="true" /></span>)}
          </div>
        </div>)}
      </div>
      <div className="practice-press" data-press-anchor aria-label={t('3D-руки собирают потоки в продукт')} role="img"></div>
      <div className="practice-outcome" data-outcome-anchor>
        <div className="practice-outcome-text"><h3>{t('Результат')}</h3><p>{t('Согласованные решения. Предсказуемая доставка. Полезный продукт.')}</p></div>
        <span className="practice-output-arrow" aria-hidden="true">⟶</span>
      </div>
    </div>
    <dialog ref={dialog} className="practice-dialog" aria-labelledby="practice-dialog-title">
      <button className="dialog-close" aria-label={t('Закрыть диалог')} onClick={()=>dialog.current.close()}>×</button>
      <h2 id="practice-dialog-title">{t(areas[selected][0])}</h2><p className="dialog-lead">{t(content[selected][0])}</p>
      {content[selected][1].map(([title,body])=><div className="dialog-detail" key={title}><h3>{t(title)}</h3><p>{t(body)}</p></div>)}
      <p className="practice-vocabulary">{areas[selected].slice(1).map(t).join(' · ')}</p>
    </dialog>
  </section>;
}