import {useI18n} from './i18n.jsx';
export default function PortraitLoader(){
 const {t}=useI18n();
 return <div className="portrait-loading-preview" role="status" aria-live="polite">
  <div className="voxel-loader" aria-hidden="true">{Array.from({length:9},(_,i)=><i key={i}/>)}</div>
  <span>{t('Загружаем 3D-портрет')}</span>
 </div>;
}
