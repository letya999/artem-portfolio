import {useI18n} from './i18n.jsx';
import {useEffect,useRef,useState} from 'react';
import {createPracticeScene} from './practice-scene.js';
import {areas,content} from './practice-data.js';

const order=[2,1,0];
const cardCopy=['Знаю, как довести до результата','Понимаю, как это реализовать','Понимаю, что создаём и зачем'];

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
    <h2><a href="#practice">{t('От общего языка к общему результату.')}</a></h2>
    <p className="practice-intro">{t('Соединяю продуктовые цели, инженерные решения и процессы доставки, чтобы команды выпускали работающие продукты.')}</p>
    <div className="practice-stage" ref={stage}>
      <div className="practice-inputs">
        {order.map((areaIndex,row)=><div className="practice-row" key={areaIndex}>
          <article className="practice-area">
            <span className="practice-icon" aria-hidden="true">{['▧','⚙','✥'][row]}</span>
            <div><h3>{t(areas[areaIndex][0])}</h3><p>{t(cardCopy[areaIndex])}</p></div>
            <button className="practice-more" aria-label={`${t('Узнать подробнее')}: ${t(areas[areaIndex][0])}`} onClick={()=>{setSelected(areaIndex);dialog.current.showModal();}}>↗</button>
          </article>
          <div className="practice-stream" aria-label={t(areas[areaIndex][0])}>
            {areas[areaIndex].slice(1).map((tag,i)=><span className="practice-tag" style={{'--n':i,'--row':i%3}} key={tag}>{t(tag)}</span>)}
          </div>
        </div>)}
      </div>
      <div className="practice-press" data-press-anchor aria-label={t('3D-руки собирают потоки в продукт')} role="img"><span className="practice-press-core" aria-hidden="true" /></div>
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
