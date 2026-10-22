import {jobs,businesses} from './portfolio-data.js';
import {useI18n} from './i18n.jsx';
import Portrait from "./Portrait.jsx";
import Practice from "./Practice.jsx";
import Conveyor from "./Conveyor.jsx";
const Arrow = () => (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M5 19 19 5M5 5h14v14" stroke="currentColor" strokeWidth="1.5" />
  </svg>
);
export default function App() {
 const {t,locale,changeLocale}=useI18n();
  return (
    <>
      <a className="skip" href="#main">{t("К содержанию")}</a>
      <header>
        <a className="mark" href="#top" aria-label={t("В начало")}>{t("АЛ")}<span>.</span>
        </a>
        <nav aria-label={t("Основная навигация")}>
          <a href="#experience">{t("Опыт")}</a>
          <a href="#about">{t("Обо мне")}</a>
          <a href="#contact">{t("Контакт")}</a>
        </nav>
        <a className="cv-link" href="./Artem-Letyushev-CV.pdf" download>{t("Резюме PDF")}<Arrow />
        </a>
      <a className="md-link" href={`./resume.${locale}.md`} download={`Artem-Letyushev-${locale}.md`}>{t("Резюме MD")}</a>
      <select className="language-select" aria-label={t("Язык")} value={locale} onChange={e=>changeLocale(e.target.value)}><option value="ru">RU</option><option value="en">EN</option><option value="kk">ҚАЗ</option></select>
      </header>
      <main id="main">
        <section className="hero" id="top">
          <div className="hero-copy">
            <h1>
              <span>{t("АРТЕМ")}</span>
              <span>{t("ЛЕТЮШЕВ")}<span className="name-dot">.</span>
              </span>
            </h1>
            <p className="role">{t("Tech / Delivery Project Manager")}</p>
            <p className="intro">{t("Соединяю инженерию,")}<br />{t("команды и бизнес.")}</p>
            <a className="primary" href="#contact">{t("Обсудить работу")}<Arrow />
            </a>
            <p className="hero-note">{t("7+ лет. Финтех, телеком, дейтинг.")}<br />{t("От требований до запуска.")}</p>
          </div>
          <Portrait />
          <div className="hero-bottom">
            <span>{t("Инженерный подход. Человеческий контакт.")}</span>
            <a href="#results">{t("Дальше — результаты")}<span aria-hidden="true">↓</span>
            </a>
          </div>
        </section>
        <section className="results" id="results">
          <h2 className="achievements-heading"><a href="#results">{t("Достижения в цифрах.")}</a></h2>
          <div className="achievements-body">
            <div className="achievement-list">
              <article>
                <strong>64<span>→</span>16</strong>
                <h3>{t("Дней от задачи до результата")}</h3>
                <p>{t("Twinby · Сформировал backend-команду, ввёл инженерные стандарты и регулярные релизы.")}</p>
              </article>
              <article>
                <strong>÷{new Intl.NumberFormat(locale).format(2.5)}</strong>
                <h3>{t("Снижение fraud rate")}</h3>
                <p>{t("Twinby · Антифрод из 9 сервисов: ML-детекция, device fingerprinting, автомодерация и liveness.")}</p>
              </article>
              <article>
                <strong>−60%</strong>
                <h3>{t("Time-to-market аналитики")}</h3>
                <p>{t("Twinby · Docs-as-code, AI-флоу, ADR и архитектурный надзор.")}</p>
              </article>
              <article>
                <strong>+40%</strong>
                <h3>{t("Производительность команд")}</h3>
                <p>{t("Финтех-холдинг · Расширил отдел с 2 до 5 команд и сократил интервал релизов.")}</p>
              </article>
              <article>
                <strong>12<span>→</span>34%</strong>
                <h3>{t("Маржинальность проектов")}</h3>
                <p>{t("Itis Team · Автоматизация и повторное использование кода.")}</p>
              </article>
            </div>
            <div className="little-law" role="img" aria-label={t("Закон Литтла: Lead time равно WIP, делённому на Throughput")}>
              <div className="equation-slot">
                <div className="equation-typeset" aria-hidden="true">
                  <span>Lead time</span><span>=</span>
                  <span className="equation-fraction"><span>WIP</span><span>Throughput</span></span>
                </div>
              </div>
              <p>{t("Время выполнения = задачи в работе / пропускная способность")}</p>
            </div>
          </div>
        </section>
        <section className="experience" id="experience">
          <div className="section-top">
            <h2><a href="#experience">{t("Опыт работы")}</a></h2>
            <p>{t("2026 → 2019. Сначала последнее место работы. Раскройте компанию, чтобы увидеть задачи и результаты.")}</p>
          </div>
          <div className="experience-body">
          <div className="history">
            {jobs.map(([company, role, date, scope, points], i) => (
              <div className="career-entry" key={company}>
              <details open={i === 0} data-company={company}>
                <summary>
                  <span className="company-line"><span className="company">{t(company)}</span><span className="business">{t(businesses[company])}</span></span>
                  <span className="job">{t(role)}</span>
                  <span className="date">{date}</span>
                  <span className="disclosure"><span className="when-closed">{t("Подробнее")}</span><span className="when-open">{t("Свернуть")}</span><span className="plus" aria-hidden="true">+</span></span>
                </summary>
                <div className="job-content">
                  <p>{t(scope)}</p>
                  <ul>
                    {points.map((p) => (
                      <li key={p}>{t(p)}</li>
                    ))}
                  </ul>
                </div>
              </details>
              <div className="matryoshka-slot" role="img" aria-label={`${t("Матрёшка")}: ${t(company)}`}><p className="matryoshka-fallback">{t(company)}</p></div>
              </div>
            ))}
          </div>
          </div>
        </section>
        <section className="about" id="about">
          <div className="about-photo">
            <img
              src="./artem-books.jpg"
              alt={t("Артем в книжном магазине у полки об искусственном интеллекте")}
              width="640"
              height="640"
              loading="lazy"
            />
            <span>{t("Любопытство — часть работы.")}</span>
          </div>
          <div className="about-copy">
            <h2><a href="#about">{t("Менеджер.")}<br />{t("С инженерной оптикой.")}</a></h2>
            <p className="large-copy">{t("Мне важно понимать,")}<br />{t("как устроена система.")}<br />{t("И как работают люди внутри неё.")}</p>
            <p>{t("Начинал с Android-разработки. Сегодня управляю сроками, ресурсами, рисками и межкомандными зависимостями. Могу обсуждать с инженерами API и архитектуру, а с бизнесом — экономический эффект.")}</p>
            <p>{t("Развиваю open-source проекты и основал AI Engineers Guild — инженерное сообщество с 900+ участниками.")}</p>
            <a
              className="text-link"
              href="https://github.com/letya999"
              target="_blank"
              rel="noreferrer"
            >{t("Мои проекты на GitHub")}<Arrow />
            </a>
          </div>
        </section>
        <Practice />
        <Conveyor />
        <footer id="contact">
          <div className="contact-top">
            <h2><a href="#contact">{t("Давайте")}<br />{t("соберёмся.")}</a></h2>
            <div>
              <p>{t("Ищете Tech / Delivery PM,")}<br />{t("который понимает и код, и людей?")}</p>
              <a
                className="primary"
                href="https://t.me/artemletya"
                target="_blank"
                rel="noreferrer"
              >{t("Написать в Telegram")}<Arrow />
              </a>
              <a className="email" href="mailto:artemletyushev@gmail.com">
                artemletyushev@gmail.com
              </a>
            </div>
          </div>
          <div className="footer-bottom">
            <span>{t("Артем Летюшев · 2026")}</span>
            <a
              href="https://www.linkedin.com/in/artemletya"
              target="_blank"
              rel="noreferrer"
            >
              LinkedIn <Arrow />
            </a>
            <a href="./Artem-Letyushev-CV.pdf" download>{t("Скачать резюме")}<Arrow />
            </a>
            <a href="#top">{t("Наверх ↑")}</a>
          </div>
        </footer>
      </main>
    </>
  );
}
