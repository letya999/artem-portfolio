import {useEffect,useRef,useState} from 'react';
import ScanPreview from './ScanPreview.jsx';
import {useI18n} from './i18n.jsx';
const stages=[
 ['01','Первая модель из кубиков','./story/models/thumb-0.png','Первые крупные кубики задали узнаваемый силуэт, но ещё почти не передавали черты лица.','original-voxel'],
 ['02','Металлическая модель','./story/models/thumb-1.png','Форма стала плотнее: 4 336 металлических кубиков проявили глаза, нос и линию челюсти.','metal-first'],
 ['03','Ориентиры лица','./story/landmarks.png','По фотографиям найдены опорные точки глаз, носа, губ и контура лица. Из них собрана первая треугольная маска.'],
 ['04','Реконструкция по фотографиям','./story/models/thumb-2.png','Маска превратилась в поверхность головы. Макушка, затылок и уши на этом этапе восстановлены приблизительно.','photo-reconstruction'],
 ['05','Настоящий скан iPhone','./story/models/thumb-3.png','Измеренная поверхность сохранила фототекстуру кожи и волос. В исходном скане видны лишние фрагменты и открытый затылок.','scan'],
 ['06','Перенос рельефа','./story/models/thumb-4.png','Рельеф скана перенесён на кубическую оболочку: лицо получило измеренные пропорции.','scan-transfer'],
 ['07','Плотная реконструкция','./story/models/thumb-5.png','Кубиков стало больше, а форма челюсти, ушей и шеи точнее.','dense-reconstruction'],
 ['08','Физика и движение','./story/models/thumb-6.png','Объём замкнут; свет, взгляд и пружинные волны кубиков оживляют итоговый портрет.','voxel'],
];
export default function PortraitStory(){
 const {t}=useI18n(),dialog=useRef(null),viewer=useRef(null);const [peeled,setPeeled]=useState(false),[open,setOpen]=useState(false),[preview,setPreview]=useState(null);
 useEffect(()=>{if(preview)viewer.current.showModal();},[preview]);
 const selected=stages.find(([number])=>number===preview);
 return <>
  <div className={`portrait-sticker ${peeled?'peeled':''}`} onPointerLeave={()=>setPeeled(false)}>
   <button className="sticker-paper" aria-expanded={peeled} aria-controls="story-reveal" onClick={()=>setPeeled(!peeled)}>{t('Это я')}</button>
   <button id="story-reveal" className="story-trigger" aria-label={t('Посмотреть, как это сделано')} onClick={()=>{setOpen(true);dialog.current.showModal();}}>{t('Как это сделано')} <span aria-hidden="true">↗</span></button>
   <svg className="sticker-arrow" viewBox="0 0 160 100" fill="none" aria-hidden="true"><path d="M4 90C34 31 81 19 146 25M128 8l20 17-20 17" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/><path d="M7 93C39 35 81 21 143 27" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity=".45"/></svg>
  </div>
  <dialog ref={dialog} className="story-dialog practice-dialog" aria-labelledby="story-title" onClose={()=>setOpen(false)}>
   <button className="dialog-close" aria-label={t('Закрыть диалог')} onClick={()=>dialog.current.close()}>×</button>
   <p className="story-eyebrow">{t('За кулисами портрета')}</p><h2 id="story-title">{t('От первых кубиков к движению.')}</h2>
   <p className="story-interaction-note">{t('Нажмите на изображения, чтобы открыть их крупно. 3D-модели можно вращать.')}</p>
   {open&&<><div className="story-grid">{stages.map(([number,title,src,description,kind])=><figure key={number}><div className={`story-image ${kind==='scan'?'story-image-model':''}`}>
    {kind==='scan'?<><img className="story-scan-poster" src={src} alt=""/><ScanPreview compact/></>:<button className="story-thumbnail" onClick={()=>setPreview(number)} aria-label={`${t('Открыть шаг')}: ${t(title)}`}><img src={src} alt={t(title)}/></button>}
    <span className="story-number">{number}</span>
   </div><button className="story-media-trigger story-open-model" onClick={()=>setPreview(number)}>{t(kind?'Открыть 3D-модель':'Открыть изображение')} <span aria-hidden="true">↗</span></button><figcaption><h3>{t(title)}</h3><p>{t(description)}</p></figcaption></figure>)}</div>
   <p className="story-credit">{t('Ориентиры: MediaPipe. Исходная воксельная модель: MIT. Фото и скан: Артем Летюшев.')}</p></>}
  </dialog>
  <dialog ref={viewer} className="story-viewer practice-dialog" aria-label={selected?t(selected[1]):undefined} onClose={()=>setPreview(null)}>
   <button className="dialog-close" aria-label={t('Закрыть диалог')} onClick={()=>viewer.current.close()}>×</button>
   {selected&&<><h2>{t(selected[1])}</h2>{selected[4]?<ScanPreview kind={selected[4]}/>:<img src={selected[2]} alt={t(selected[1])}/>}</>}
  </dialog>
 </>;
}
