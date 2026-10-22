import {I18nProvider} from '../i18n.jsx';
import Practice from '../Practice.jsx';
export default function PracticeIsland({locale}){return <I18nProvider locale={locale}><Practice/></I18nProvider>;}
