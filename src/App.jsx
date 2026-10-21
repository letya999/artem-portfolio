import Portrait from "./Portrait.jsx";
const Arrow = () => (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M5 19 19 5M5 5h14v14" stroke="currentColor" strokeWidth="1.5" />
  </svg>
);
const jobs = [
  [
    "Twinby",
    "Tech Project Manager",
    "03.2025 — 10.2026",
    "4 команды: Data Science, backend, рекламный кабинет, системный анализ.",
    [
      "Запустил антифрод из 9 сервисов. Fraud rate снизился в 2,5 раза; оценочный годовой эффект — $800 тыс.",
      "Внедрил docs-as-code, ADR и AI-флоу. Time-to-market в части аналитики сократился на 60%.",
      "Довёл CDP-платформу для 10+ каналов до этапа запуска. Прогнозируемый эффект — около $1 млн прибыли в год.",
      "Вывел мультитенантную архитектуру для независимой разработки CIS/global. Сформировал backend-команду; lead time сократился с 64 до 16 дней.",
    ],
  ],
  [
    "Финтех-холдинг",
    "Project Manager · NDA",
    "06.2023 — 03.2025",
    "5 команд, около 50 специалистов: Android, iOS, Backend/DevOps, QA и аналитика.",
    [
      "Запустил мобильное приложение на 3 международных рынка. Retention Rate вырос на 15%, конверсия — на 10%.",
      "Сократил интервал релизов на 20%. Расширил отдел с 2 до 5 команд; производительность выросла на 40%.",
    ],
  ],
  [
    "МТС",
    "Scrum Master / Agile Coach",
    "01.2022 — 06.2023",
    "МТС-Касса и МТС Франшиза. Процессы стрима и руководство Agile-гильдией.",
    [
      "Перевёл подразделение с LeSS на SAFe по запросу офиса цифровой трансформации.",
      "Запустил 5 кросс-функциональных и 2 сервисные команды. Результативность квартальных планов выросла на 15%.",
    ],
  ],
  [
    "ЮMoney",
    "Delivery Manager",
    "03.2021 — 01.2022",
    "Яндекс.Деньги / ЮMoney. Электронные платежи и межфункциональные проекты.",
    [
      "Довёл выполнение квартальных планов до 100% от согласованного с бизнесом.",
      "Перестроил взаимодействие с бизнесом и смежными командами — около 90 участников. Организовал запуск корпоративного каталога метаданных.",
    ],
  ],
  [
    "Itis Team",
    "Project Manager",
    "03.2020 — 03.2021",
    "Аутсорсинг мобильной и веб-разработки.",
    [
      "Увеличил маржинальность проектов с 12% до 34% благодаря автоматизации и повторному использованию кода.",
      "Вырастил команду с 5 до 18 человек. За период работы оборот компании вырос в 3 раза.",
    ],
  ],
  [
    "Renewal Studio",
    "Project Manager",
    "03.2019 — 03.2020",
    "Переход из Android-разработки в управление проектами.",
    [
      "Вывел студию на окупаемость за 2 месяца. Сформировал 3 проектные команды и перевёл их на Scrum.",
    ],
  ],
];
export default function App() {
  return (
    <>
      <a className="skip" href="#main">
        К содержанию
      </a>
      <header>
        <a className="mark" href="#top" aria-label="В начало">
          АЛ<span>.</span>
        </a>
        <nav aria-label="Основная навигация">
          <a href="#experience">Опыт</a>
          <a href="#about">Обо мне</a>
          <a href="#contact">Контакт</a>
        </nav>
        <a className="cv-link" href="./Artem-Letyushev-CV.pdf" download>
          Резюме PDF <Arrow />
        </a>
      </header>
      <main id="main">
        <section className="hero" id="top">
          <div className="hero-copy">
            <h1>
              <span>АРТЕМ</span>
              <span>
                ЛЕТЮШЕВ<span className="name-dot">.</span>
              </span>
            </h1>
            <p className="role">Tech / Delivery Project Manager</p>
            <p className="intro">
              Соединяю инженерию,
              <br />
              команды и бизнес.
            </p>
            <a className="primary" href="#contact">
              Обсудить работу <Arrow />
            </a>
            <p className="hero-note">
              7+ лет. Финтех, телеком, дейтинг.
              <br />
              От требований до запуска.
            </p>
          </div>
          <Portrait />
          <div className="hero-bottom">
            <span>Инженерный подход. Человеческий контакт.</span>
            <a href="#results">
              Дальше — результаты <span aria-hidden="true">↓</span>
            </a>
          </div>
        </section>
        <section className="results" id="results">
          <div className="section-top">
            <h2>
              Сложность.
              <br />
              Система. Результат.
            </h2>
            <p>
              За каждым запуском — решения,
              <br />
              договорённости и работа команд.
              <br />
              Вот что получилось в Twinby.
            </p>
          </div>
          <div className="result-grid">
            <article>
              <div className="stat">
                64<span>→</span>16
              </div>
              <h3>Дней от задачи до результата</h3>
              <p>
                Сформировал backend-команду, ввёл инженерные стандарты и
                регулярные релизы. Lead time сократился в четыре раза.
              </p>
            </article>
            <div className="result-secondary">
              <article>
                <strong>÷2,5</strong>
                <h3>Снижение fraud rate</h3>
                <p>
                  Антифрод из 9 сервисов: ML-детекция, device fingerprinting,
                  автомодерация и liveness.
                </p>
              </article>
              <article>
                <strong>−60%</strong>
                <h3>Time-to-market аналитики</h3>
                <p>Docs-as-code, AI-флоу, ADR и архитектурный надзор.</p>
              </article>
            </div>
          </div>
        </section>
        <section className="experience" id="experience">
          <div className="section-top">
            <h2>Опыт в действии.</h2>
            <p>
              От мобильной разработки
              <br />
              до сложных систем и нескольких команд.
            </p>
          </div>
          <div className="history">
            {jobs.map(([company, role, date, scope, points], i) => (
              <details key={company} open={i === 0}>
                <summary>
                  <span className="company">{company}</span>
                  <span className="job">{role}</span>
                  <span className="date">{date}</span>
                  <span className="plus" aria-hidden="true">
                    +
                  </span>
                </summary>
                <div className="job-content">
                  <p>{scope}</p>
                  <ul>
                    {points.map((p) => (
                      <li key={p}>{p}</li>
                    ))}
                  </ul>
                </div>
              </details>
            ))}
          </div>
        </section>
        <section className="about" id="about">
          <div className="about-photo">
            <img
              src="./artem-books.jpg"
              alt="Артем в книжном магазине у полки об искусственном интеллекте"
              width="640"
              height="640"
              loading="lazy"
            />
            <span>Любопытство — часть работы.</span>
          </div>
          <div className="about-copy">
            <h2>
              Менеджер.
              <br />С инженерной оптикой.
            </h2>
            <p className="large-copy">
              Мне важно понимать,
              <br />
              как устроена система.
              <br />И как работают люди внутри неё.
            </p>
            <p>
              Начинал с Android-разработки. Сегодня управляю сроками, ресурсами,
              рисками и межкомандными зависимостями. Могу обсуждать с инженерами
              API и архитектуру, а с бизнесом — экономический эффект.
            </p>
            <p>
              Развиваю open-source проекты и основал AI Engineers Guild —
              инженерное сообщество с 900+ участниками.
            </p>
            <a
              className="text-link"
              href="https://github.com/letya999"
              target="_blank"
              rel="noreferrer"
            >
              Мои проекты на GitHub <Arrow />
            </a>
          </div>
        </section>
        <section className="practice">
          <h2>
            От общего языка
            <br />к общему результату.
          </h2>
          <div className="practice-columns">
            <div>
              <h3>Управление</h3>
              <p>
                Roadmap · SDLC · Ресурсы
                <br />
                Риски и зависимости · Требования
                <br />
                Scrum · Kanban · Приоритизация
              </p>
            </div>
            <div>
              <h3>Инженерия</h3>
              <p>
                API · Интеграции · SQL
                <br />
                Docs-as-code · ADR
                <br />
                AI-инструменты · Автоматизация
              </p>
            </div>
            <div>
              <h3>Образование</h3>
              <p>
                СПбПУ · 2017–2024
                <br />
                Инноватика и управление качеством
              </p>
              <p>
                SAFe RTE · PSM I · ICAgile
                <br />
                Kanban System Design & Improvement
              </p>
            </div>
          </div>
        </section>
        <footer id="contact">
          <div className="contact-top">
            <h2>
              Давайте
              <br />
              соберёмся.
            </h2>
            <div>
              <p>
                Ищете Tech / Delivery PM,
                <br />
                который понимает и код, и людей?
              </p>
              <a
                className="primary"
                href="https://t.me/artemletya"
                target="_blank"
                rel="noreferrer"
              >
                Написать в Telegram <Arrow />
              </a>
              <a className="email" href="mailto:artemletyushev@gmail.com">
                artemletyushev@gmail.com
              </a>
            </div>
          </div>
          <div className="footer-bottom">
            <span>Артем Летюшев · 2026</span>
            <a
              href="https://www.linkedin.com/in/artemletya"
              target="_blank"
              rel="noreferrer"
            >
              LinkedIn <Arrow />
            </a>
            <a href="./Artem-Letyushev-CV.pdf" download>
              Скачать резюме <Arrow />
            </a>
            <a href="#top">Наверх ↑</a>
          </div>
        </footer>
      </main>
    </>
  );
}
