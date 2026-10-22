import {useI18n} from './i18n.jsx';
import {useEffect,useRef,useState} from 'react';
import {createPracticeScene} from './practice-scene.js';
import {areas,content} from './practice-data.js';
export default function Practice(){
 const {t,locale}=useI18n();
  const root=useRef(null),dialog=useRef(null);
  const [selected,setSelected]=useState(0);
  useEffect(()=>createPracticeScene(root.current),[locale]);
  return <section className="practice" id="practice" ref={root}>
    <h2><a href="#practice">{t("От общего языка к общему результату.")}</a></h2>
    <div className="practice-columns">{areas.map(([name,...tags],i)=><article className="practice-area" key={name}>
      <h3>{t(name)}</h3><div className="voxel-tags">{tags.map(tag=><span className="voxel-tag" data-voxel-word={t(tag)} key={tag}>{t(tag)}</span>)}</div>
      <p>{t(content[i][0])}</p><button className="practice-more" onClick={()=>{setSelected(i);dialog.current.showModal();}}>{t("Узнать подробнее")}<span aria-hidden="true">↗</span></button>
    </article>)}</div>
    <dialog ref={dialog} className="practice-dialog" aria-labelledby="practice-dialog-title">
      <button className="dialog-close" aria-label={t("Закрыть диалог")} onClick={()=>dialog.current.close()}>×</button>
      <h2 id="practice-dialog-title">{t(areas[selected][0])}</h2><p className="dialog-lead">{t(content[selected][0])}</p>
      {content[selected][1].map(([title,text])=><div className="dialog-detail" key={title}><h3>{t(title)}</h3><p>{t(text)}</p></div>)}
    </dialog>
  </section>;
}
