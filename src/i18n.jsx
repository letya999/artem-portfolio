import {createContext,useContext,useEffect,useState} from 'react';
import messages from './messages.json';
const LocaleContext=createContext(null);
export function I18nProvider({children}){
 const [locale,setLocale]=useState(()=>{
  let saved;try{saved=localStorage.getItem('portfolio-language');}catch{}
  return ['ru','en','kk'].includes(saved)?saved:(navigator.languages||[navigator.language]).map(l=>l.toLowerCase().split('-')[0]).find(l=>['ru','en','kk'].includes(l))||'en';
 });
 const t=text=>messages[text]?.[locale]??text;
 useEffect(()=>{document.documentElement.lang=locale;document.title=t('Артем Летюшев')+' — Tech / Delivery PM';document.querySelector('meta[name="description"]').content=t('7+ лет. Финтех, телеком, дейтинг.');},[locale]);
 const changeLocale=value=>{if(!['ru','en','kk'].includes(value))return;setLocale(value);try{localStorage.setItem('portfolio-language',value);}catch{}};
 return <LocaleContext.Provider value={{locale,t,changeLocale}}>{children}</LocaleContext.Provider>;
}
export const useI18n=()=>useContext(LocaleContext);
