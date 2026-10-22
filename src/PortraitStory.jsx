import {useRef,useState} from 'react';
import ScanPreview from './ScanPreview.jsx';
import {useI18n} from './i18n.jsx';
const stages=[
 ['01','Фото и подготовка','./artem-reference.png','Исходное фото задаёт узнаваемость: пропорции, силуэт и выражение лица. Для извлечения ориентиров использовался отдельно подготовленный фронтальный портрет.'],
 ['02','Ориентиры → маска','./story/landmarks.png','MediaPipe выделяет ориентиры лица. По точкам строится треугольная маска: глаза, нос, рот и контур. Это геометрическая подсказка из изображения, а не полноценный скан головы.'],
 ['03','Настоящий скан','./story/scan-views.png','Ваш 3D-скан очищен от фона и лишних фрагментов. После обработки осталось 32 016 измеренных вершин. Задняя поверхность открыта: скан не содержит полного затылка.'],
 ['04','База из кубиков','./story/base.png','Исходная воксельная модель задаёт кубическую структуру. Фотографические ориентиры помогают проверить пропорции, а измеренный скан — перенести рельеф лица на кубики.'],
 ['05','Совмещение и сборка','./story/combined.png','Поверхность скана и кубическая оболочка совмещены в общей системе координат. Лицо опирается на измерения; затылок, шея и недостающие участки достроены. Это художественная реконструкция.'],
 ['06','Материал и движение','./story/final.png','React и Three.js. InstancedMesh рисует тысячи кубиков; металлический материал и свет подчёркивают грани. Пружинная динамика реагирует на курсор, а прокрутка управляет распадом и сборкой следующих моделей.'],
];
export default function PortraitStory(){
 const {t}=useI18n(),dialog=useRef(null);const [peeled,setPeeled]=useState(false),[open,setOpen]=useState(false);
 return <>
  <div className={`portrait-sticker ${peeled?'peeled':''}`}>
   <button className="sticker-paper" aria-expanded={peeled} aria-controls="story-reveal" onClick={()=>setPeeled(!peeled)}>{t('Это я')}</button>
   <button id="story-reveal" className="story-trigger" onClick={()=>{setOpen(true);dialog.current.showModal();}}>{t('Посмотреть, как это сделано')} <span aria-hidden="true">↗</span></button>
   <svg className="sticker-arrow" viewBox="0 0 110 70" fill="none" aria-hidden="true"><path d="M5 60Q20 9 94 13M79 3l18 10-16 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
  </div>
  <dialog ref={dialog} className="story-dialog practice-dialog" aria-labelledby="story-title" onClose={()=>setOpen(false)}>
   <button className="dialog-close" aria-label={t('Закрыть диалог')} onClick={()=>dialog.current.close()}>×</button>
   <p className="story-eyebrow">{t('За кулисами портрета')}</p><h2 id="story-title">{t('От фотографии к движению.')}</h2>
   {open&&<><div className="story-grid">{stages.map(([number,title,src,description])=><figure key={number}><div className="story-image"><img src={src} alt={t(title)}/><span>{number}</span></div><figcaption><h3>{t(title)}</h3><p>{t(description)}</p></figcaption></figure>)}</div>
   <div className="story-scan"><div><p className="story-eyebrow">{t('Покрутите оригинал')}</p><h3>{t('Измеренная поверхность.')}</h3><p>{t('Интерактивная версия очищенного скана — до превращения в кубики.')}</p></div><div><ScanPreview/></div></div>
   <p className="story-credit">{t('Ориентиры: MediaPipe. Исходная воксельная модель: MIT. Фото и скан: Артем Летюшев.')}</p></>}
  </dialog>
 </>;
}
