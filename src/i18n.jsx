import {createContext,useContext,useEffect,useState} from 'react';
import messages from './messages.json';
import {localeFromPath,updateSeo} from './seo.js';
const LocaleContext=createContext(null);
export function I18nProvider({children}){
 const [locale,setLocale]=useState(()=>{
  const explicit=localeFromPath(location.pathname);if(explicit)return explicit;
  let saved;try{saved=localStorage.getItem('portfolio-language');}catch{}
  return ['ru','en','kk'].includes(saved)?saved:(navigator.languages||[navigator.language]).map(l=>l.toLowerCase().split('-')[0]).find(l=>['ru','en','kk'].includes(l))||'en';
 });
 const t=text=>messages[text]?.[locale]??text;
 useEffect(()=>{updateSeo(locale,t);},[locale]);
 const changeLocale=value=>{if(!['ru','en','kk'].includes(value))return;history.replaceState(null,'',`/${value}.html${location.search}${location.hash}`);setLocale(value);try{localStorage.setItem('portfolio-language',value);}catch{}};
 return <LocaleContext.Provider value={{locale,t,changeLocale}}>{children}</LocaleContext.Provider>;
}
export const useI18n=()=>useContext(LocaleContext);
