import {I18nProvider} from '../i18n.jsx';
import Conveyor from '../Conveyor.jsx';
export default function ConveyorIsland({locale}){return <I18nProvider locale={locale}><Conveyor/></I18nProvider>;}
