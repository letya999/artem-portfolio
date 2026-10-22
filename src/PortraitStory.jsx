import {useEffect,useRef,useState} from 'react';
import ScanPreview from './ScanPreview.jsx';
import {useI18n} from './i18n.jsx';
const stages=[
 ['01','Первая модель из кубиков','./story/models/thumb-0.png','Первая модель из исходного архива voxel_portrait_threejs.zip.'],
 ['02','Металлическая модель','./story/models/thumb-1.png','Ранняя детальная голова из 4 336 металлических кубиков, сохранённая в коммите deca966.'],
 ['03','Реконструкция по фотографиям','./story/models/thumb-2.png','Ориентиры MediaPipe из двух фотографий сформировали раннюю поверхность лица. Макушка, затылок и уши достроены приблизительно; это не скан iPhone.'],
 ['04','Настоящий скан iPhone','./story/models/thumb-3.png','Оригинальный GLB из архива 21.10.2026.zip: кожа и волосы сохранены в фототекстуре. Затылок открыт, вместе с лицом в исходнике есть лишние области.'],
 ['05','Перенос рельефа','./story/models/thumb-4.png','Первый перенос формы скана на кубическую оболочку: историческая модель из коммита 0102e21.'],
 ['06','Плотная реконструкция','./story/models/thumb-5.png','Челюсть и уши уточнены по скану, кубиков стало значительно больше. Версия из коммита 50e4a55.'],
 ['07','Физика и движение','./story/models/thumb-6.png','Поздние правки головы и шеи, закрытие объёма, свет, взгляд и пружинные волны кубиков. Здесь показана текущая модель.'],
];
export default function PortraitStory(){
 const {t}=useI18n(),dialog=useRef(null),viewer=useRef(null);const [peeled,setPeeled]=useState(false),[open,setOpen]=useState(false),[preview,setPreview]=useState(null);
 useEffect(()=>{if(preview)viewer.current.showModal();},[preview]);
 return <>
  <div className={`portrait-sticker ${peeled?'peeled':''}`}>
   <button className="sticker-paper" aria-expanded={peeled} aria-controls="story-reveal" onClick={()=>setPeeled(!peeled)}>{t('Это я')}</button>
   <button id="story-reveal" className="story-trigger" onClick={()=>{setOpen(true);dialog.current.showModal();}}>{t('Посмотреть, как это сделано')} <span aria-hidden="true">↗</span></button>
   <svg className="sticker-arrow" viewBox="0 0 160 100" fill="none" aria-hidden="true"><path d="M4 90C34 31 81 19 146 25M128 8l20 17-20 17" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/><path d="M7 93C39 35 81 21 143 27" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity=".45"/></svg>
  </div>
  <dialog ref={dialog} className="story-dialog practice-dialog" aria-labelledby="story-title" onClose={()=>setOpen(false)}>
   <button className="dialog-close" aria-label={t('Закрыть диалог')} onClick={()=>dialog.current.close()}>×</button>
   <p className="story-eyebrow">{t('За кулисами портрета')}</p><h2 id="story-title">{t('От первых кубиков к движению.')}</h2>
   <p className="story-interaction-note">{t('Нажмите на изображения, чтобы открыть их крупно. 3D-модели можно вращать.')}</p>
   {open&&<><div className="story-grid">{stages.map(([number,title,src,description])=><figure key={number}><div className={`story-image ${number==='04'?'story-image-model':''}`}>
    {number==='04'?<><img className="story-scan-poster" src={src} alt=""/><ScanPreview compact/></>:<button className="story-media-trigger story-thumbnail" onClick={()=>setPreview(number)} aria-label={`${t('Открыть шаг')}: ${t(title)}`}><img src={src} alt={t(title)}/><span className="story-zoom" aria-hidden="true">↗</span></button>}
    <span className="story-number">{number}</span>
   </div>{number==='04'&&<button className="story-media-trigger story-open-model" onClick={()=>setPreview(number)}>{t('Развернуть 3D-модель')} ↗</button>}<figcaption><h3>{t(title)}</h3><p>{t(description)}</p></figcaption></figure>)}</div>
   <p className="story-credit">{t('Ориентиры: MediaPipe. Исходная воксельная модель: MIT. Фото и скан: Артем Летюшев.')}</p></>}
  </dialog>
  <dialog ref={viewer} className="story-viewer practice-dialog" aria-label={preview?t(stages.find(([number])=>number===preview)?.[1]):undefined} onClose={()=>setPreview(null)}>
   <button className="dialog-close" aria-label={t('Закрыть диалог')} onClick={()=>viewer.current.close()}>×</button>
   {preview&&<><h2>{t(stages.find(([number])=>number===preview)[1])}</h2>{preview==='01'?<ScanPreview kind="original-voxel"/>:preview==='02'?<ScanPreview kind="metal-first"/>:preview==='03'?<ScanPreview kind="photo-reconstruction"/>:preview==='04'?<ScanPreview/>:preview==='05'?<ScanPreview kind="scan-transfer"/>:preview==='06'?<ScanPreview kind="dense-reconstruction"/>:preview==='07'?<ScanPreview kind="voxel"/>:<div>
    <img src={stages.find(([number])=>number===preview)[2]} alt={t(stages.find(([number])=>number===preview)[1])}/>
   </div>}</>}
  </dialog>
 </>;
}
