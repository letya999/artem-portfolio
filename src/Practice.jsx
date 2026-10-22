import {useI18n} from './i18n.jsx';
import {useEffect,useRef,useState} from 'react';
import {createPracticeScene} from './practice-scene.js';
const areas=[['Менеджмент','Roadmap','Команды','Риски'],['Инженерия','API','ADR','AI-флоу'],['Операционка','Flow','Релизы','Kanban'],['Продуктовка','Запуски','Метрики','CDP']];
const content=[
 ['Собираю команды вокруг общего результата.',[
  ['Чем управлял','В Twinby — четырьмя командами: Data Science, backend, рекламный кабинет и системный анализ. В финтех-холдинге — пятью командами, около 50 специалистов.'],
  ['Как выстраивал работу','Связывал roadmap, ресурсы и межкомандные зависимости. Согласовывал приоритеты с бизнесом, делал риски видимыми и доводил договорённости до квартальных планов.'],
  ['Что получилось','В МТС запустил пять кросс-функциональных и две сервисные команды. В ЮMoney выполнение согласованных квартальных планов достигло 100%.']]],
 ['Понимаю систему глубже списка задач.',[
  ['От разработки к архитектуре','Начинал с Android-разработки. Этот опыт помогает обсуждать API, интеграции и архитектурные ограничения с инженерами и переводить их в понятные бизнесу решения.'],
  ['Что реализовывал с командами','В Twinby — антифрод из девяти сервисов и мультитенантную архитектуру для независимой разработки CIS/global. Сформировал backend-команду и внедрил инженерные стандарты.'],
  ['Как сохранял знания','Внедрил docs-as-code, ADR и AI-флоу. Time-to-market в части аналитики сократился на 60%. Развиваю open-source проекты.']]],
 ['Превращаю загрузку в предсказуемую поставку.',[
  ['Какие вопросы закрывал','Где застревают задачи? Что мешает релизу? Какая зависимость тормозит несколько команд? Связывал планирование, разработку и выпуск в общий поток работы.'],
  ['Что менял','Выстраивал регулярные релизы и управление зависимостями. В МТС перевёл подразделение с LeSS на SAFe по запросу офиса цифровой трансформации.'],
  ['Эффект для бизнеса','В Twinby lead time сократился с 64 до 16 дней. В финтех-холдинге интервал релизов уменьшился на 20%. В Itis Team автоматизация и повторное использование кода помогли увеличить маржинальность с 12% до 34%.']]],
 ['Соединяю запуск с измеримым эффектом.',[
  ['Какие продукты выводил','В финтех-холдинге запустил мобильное приложение на трёх международных рынках. Retention Rate вырос на 15%, конверсия — на 10%. В ЮMoney организовал запуск корпоративного каталога метаданных.'],
  ['Как связывал продукт и инженерию','Помогал превратить бизнес-задачу в реализуемый объём: согласовать требования, зависимости и критерии результата, организовать работу нескольких команд и довести решение до пользователей.'],
  ['Отдельный кейс — Twinby','Запустил антифрод: fraud rate снизился в 2,5 раза, оценочный годовой эффект — $800 тыс. CDP-платформу для 10+ каналов довёл до этапа запуска; около $1 млн прибыли в год — прогноз, а не полученный результат.']]],
];
export default function Practice(){
 const {t,locale}=useI18n();
  const root=useRef(null),dialog=useRef(null);
  const [selected,setSelected]=useState(0);
  useEffect(()=>createPracticeScene(root.current),[locale]);
  return <section className="practice" id="practice" ref={root}>
    <h2><a href="#practice">{t("От общего языка к общему результату.")}</a></h2>
    <div className="practice-columns">{areas.map(([name,...tags],i)=><article className="practice-area" key={name}>
      <h3>{t(name)}</h3><div className="voxel-tags">{tags.map(tag=><span className="voxel-tag" data-voxel-word={t(tag)} key={tag}>{t(tag)}</span>)}</div>
      <p>{t(content[i][0])}</p><button className="practice-more" onClick={()=>{setSelected(i);dialog.current.showModal();}}>{t("Узнать подробнее")}<span aria-hidden="true">↗</span></button>
    </article>)}</div>
    <dialog ref={dialog} className="practice-dialog" aria-labelledby="practice-dialog-title">
      <button className="dialog-close" aria-label={t("Закрыть диалог")} onClick={()=>dialog.current.close()}>×</button>
      <h2 id="practice-dialog-title">{t(areas[selected][0])}</h2><p className="dialog-lead">{t(content[selected][0])}</p>
      {content[selected][1].map(([title,text])=><div className="dialog-detail" key={title}><h3>{t(title)}</h3><p>{t(text)}</p></div>)}
    </dialog>
  </section>;
}
