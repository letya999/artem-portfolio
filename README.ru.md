<p align="center"><img src="public/brand/logo-mono.png" width="96" alt="Монограмма Артема Летюшева"></p>
<h1 align="center">Артем Летюшев · Портфолио</h1>
<p align="center"><strong>Интерактивное портфолио технического руководителя проектов.</strong><br>История, трехмерный портрет и подтвержденные рабочие кейсы.</p>
<p align="center"><a href="README.md">English</a> · <strong>Русский</strong></p>
<p align="center"><a href="https://artemletyushev.website">Сайт</a> · <a href="docs/index.md">Документация</a> · <a href="LICENSE">Лицензия GPL-3.0</a></p>

![Реконструкция портрета из объемных вокселей.](public/story/combined.png)

## О проекте

Статический сайт на Astro рассказывает о профессиональном опыте на русском, английском и казахском языках. Текст доступен без JavaScript. React и Three.js отвечают за интерактивный портрет, раздел практики и конвейер. Есть резюме для скачивания, контакты, поисковые метаданные, ресурсы для агентов и настоящая страница 404. Оценки и прогнозы подписаны как оценки и прогнозы.

## Стек и процесс

Astro 7 · React 19 · Three.js · JavaScript · CSS · Playwright · GitHub Pages. Визуальное направление прорабатывалось в Sketch и дорабатывалось короткими итерациями дизайна и разработки. В рабочем процессе автор использует [Impeccable](https://github.com/pbakaus/impeccable), [Test Designer](https://github.com/letya999/test-designer), [Test Critic](https://github.com/letya999/test-critic), [Probity](https://github.com/letya999/probity) и [AI Repo Safety](https://github.com/letya999/ai-repo-safety-skill). Это инструменты разработки, а не зависимости сайта или гарантия результата.

## Локальный запуск

Нужен Node.js 22.23.4 или новее.

```sh
npm ci
cp .env.example .env
npm run dev
```

В PowerShell используйте `Copy-Item .env.example .env`. Файл `.env` исключен из Git. Для производственной сборки укажите `SITE_URL` с HTTPS-доменом; счетчики аналитики необязательны. Сервер и секреты API сайту не нужны.

```sh
npm run build
npm run preview
npm test
```

Статическая сборка находится в `dist/`. Браузерные проверки запускаются через `npm run test:e2e` при наличии Chrome. Инструкции по публикации и проверке домена находятся в [runbook](docs/operations/runbook.md).

## Структура

| Путь | Назначение |
| --- | --- |
| `src/` | Оболочка Astro, контент, React-компоненты, анимация и стили. |
| `public/` | Резюме, изображения, 3D-данные, ресурсы для агентов и лицензии ассетов. |
| `scripts/generate-static.js` | Генерация локализованных статических ресурсов. |
| `tests/` | Браузерные проверки и проверки сборки. |
| [`docs/`](docs/index.md) | Актуальные заметки о продукте, архитектуре и эксплуатации. |
| [`AGENTS.md`](AGENTS.md) | Инструкции для агентов-разработчиков. |

## Развертывание и аналитика

GitHub Actions проверяет и собирает ветку `main` на Node.js 24 командами `npm ci`, `npm test` и `npm run build`, затем публикует `dist` в GitHub Pages. Workflow задает `SITE_URL=https://artemletyushev.website`. Домен подключен в Settings → Pages с обязательным HTTPS. DNS обслуживает REG.RU через `ns1.reg.ru` и `ns2.reg.ru`: основной домен направлен на A/AAAA-адреса GitHub Pages, а `www` — CNAME на `letya999.github.io`. Проверки и откат описаны в [runbook](docs/operations/runbook.md).

`PUBLIC_GA_MEASUREMENT_ID` и `PUBLIC_YANDEX_METRIKA_ID` задаются после создания счетчиков и решения вопроса с уведомлением или согласием на отслеживание. Пустые значения отключают загрузку счетчиков. Успешная сборка не подтверждает сбор аналитики, распространение DNS или скорость у реальных посетителей.

## Лицензия

Исходный код и оригинальная документация — [GNU GPL v3.0](LICENSE). Предоставленные владельцем фотографии и резюме не передаются для свободного использования по этой лицензии. Лицензии шрифтов, значков и 3D-ассетов указаны в файлах `public/*LICENSE*`, `public/brand-marks/ATTRIBUTION.md`, `public/story/CREDITS.txt` и `scripts/assets/webxr-hand.LICENSE.md`. Репозиторий открыт; исключения для ассетов сохраняются.
