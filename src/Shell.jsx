import {useI18n} from './i18n.jsx';
import {resumeMarkdown} from './resume.js';
import Human from './App.jsx';
const isAgent=new URLSearchParams(location.search).get('view')==='agent';
export default function Shell(){
 const {t,locale,changeLocale}=useI18n();
 const agent=isAgent;
 return <>
  {agent?<div className="agent-shell">
   <header><a href="?view=human">← {t('Сайт')}</a><a href={`./resume.${locale}.md`} download={`Artem-Letyushev-${locale}.md`}>{t('Резюме MD')} ↓</a>
   <select aria-label={t('Язык')} value={locale} onChange={e=>changeLocale(e.target.value)}><option value="ru">RU</option><option value="en">EN</option><option value="kk">ҚАЗ</option></select></header>
   <main><pre>{resumeMarkdown(t)}</pre></main>
  </div>:<Human/>}
  <aside className="view-dock" aria-label={t('Формат сайта')}>
   <a href="?view=human" aria-current={!agent?'page':undefined}><span aria-hidden="true">{agent?'○':'●'}</span> Human</a>
   <a href="?view=agent" aria-current={agent?'page':undefined}><span aria-hidden="true">{agent?'●':'○'}</span> Agent</a>
  </aside>
 </>;
}
