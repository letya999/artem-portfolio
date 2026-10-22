import {I18nProvider} from '../i18n.jsx';
import Portrait from '../Portrait.jsx';
export default function PortraitIsland({locale}){return <I18nProvider locale={locale}><Portrait/></I18nProvider>;}
