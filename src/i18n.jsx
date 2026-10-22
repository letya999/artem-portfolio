import {createContext,useContext} from 'react';
import messages from './messages.json';
const LocaleContext=createContext(null);
export function I18nProvider({children,locale}){
 const t=text=>messages[text]?.[locale]??text;
 return <LocaleContext.Provider value={{locale,t}}>{children}</LocaleContext.Provider>;
}
export const useI18n=()=>useContext(LocaleContext);
