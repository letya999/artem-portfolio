import {useI18n} from './i18n.jsx';
import {useEffect,useRef,useState} from 'react';
import {createPracticeScene} from './practice-scene.js';
import {areas,content} from './practice-data.js';

const order=[2,1,0];
const cardCopy=['Организую работу команд от замысла до запуска.','Разбираюсь в технологиях, архитектуре и ограничениях.','Связываю потребности пользователей и цели бизнеса.'];

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
    <h2><a href="#practice">{t('Работа на пересечении.')}</a></h2>
    <div className="practice-stage" ref={stage}>
      <div className="practice-inputs">
        {order.map((areaIndex,row)=><div className="practice-row" key={areaIndex}>
          <article className="practice-area">
            <img className="practice-icon" src={`/practice-icons/${["product","engineering","process"][row]}.webp`} alt="" width="96" height="96"/>
            <div><h3>{t(areas[areaIndex][0])}</h3><p>{t(cardCopy[areaIndex])}</p></div>
            <button className="practice-more" aria-label={`${t('Узнать подробнее')}: ${t(areas[areaIndex][0])}`} onClick={()=>{setSelected(areaIndex);dialog.current.showModal();}}><span aria-hidden="true">→</span></button>
          </article>
          <div className="practice-stream" aria-hidden="true">
            {areas[areaIndex].slice(1).map(tag=><span className="practice-tag" key={tag}><span className="practice-tag-label">{t(tag)}</span><i className="practice-tag-cube" aria-hidden="true" /></span>)}
          </div>
        </div>)}
      </div>
      <div className="practice-press" data-press-anchor aria-label={t('3D-руки собирают потоки в продукт')} role="img"></div>
      <div className="practice-outcome" data-outcome-anchor>
        <div className="practice-outcome-text"><h3>{t('Результат')}</h3><p>{t('Полезный продукт. Согласованная работа команд. Предсказуемый выпуск.')}</p></div>
        <span className="practice-output-arrow" aria-hidden="true">⟶</span>
      </div>
    </div>
    <dialog ref={dialog} className="practice-dialog" aria-labelledby="practice-dialog-title">
      <button className="dialog-close" aria-label={t('Закрыть диалог')} onClick={()=>dialog.current.close()}>×</button>
      <h2 id="practice-dialog-title">{t(areas[selected][0])}</h2>
      {content.map(([lead,sections],index)=><div key={index} hidden={index!==selected}>
        <p className="dialog-lead">{t(lead)}</p>
        {sections.map(([title,body])=><div className="dialog-detail" key={title}><h3>{t(title)}</h3><p>{t(body)}</p></div>)}
      </div>)}
      <p className="practice-vocabulary">{areas[selected].slice(1).map(t).join(' · ')}</p>
    </dialog>
  </section>;
}
