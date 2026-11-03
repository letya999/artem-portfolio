import {jobs,businesses,achievements,biography,profileUpdated,profileRole,profileLead,profileScope,profileDomains} from './portfolio-data.js';
import {areas,content} from './practice-data.js';
export function resumeMarkdown(t){
 return [
  `# ${t('Артем Летюшев')}`,t(profileRole),
  `${t('Дата обновления')}: ${profileUpdated}`,
  t(profileLead),t(profileScope),t(profileDomains),
  'artemletyushev@gmail.com · [Telegram](https://t.me/artemletya) · [GitHub](https://github.com/letya999) · [LinkedIn](https://www.linkedin.com/in/artemletya)',
  `## ${t('Обо мне')}`,...biography.map(t),
  `## ${t('Результаты')}`,
  ...achievements.map(([title,highlight,body])=>`### ${t(title)}\n\n${t(highlight)}\n\n${t(body)}`),
  `## ${t('Опыт работы')}`,
  ...jobs.map(([name,role,dates,scope,results,responsibilities,projects])=>`### ${t(name)} — ${t(role)}\n\n${t(dates)}\n\n${t(businesses[name])}\n\n${t(scope)}\n\n${t(projects)}\n\n#### ${t('Достижения')}\n\n${results.map(r=>`- ${t(r)}`).join('\n')}\n\n#### ${t('За что отвечал')}\n\n${responsibilities.map(r=>`- ${t(r)}`).join('\n')}`),
  ...areas.map(([name],i)=>`## ${t(name)}\n\n${t(content[i][0])}\n\n${content[i][1].map(([title,body])=>`### ${t(title)}\n\n${t(body)}`).join('\n\n')}`),
  `## ${t('Публикации и проекты')}`,
  '[Habr](https://habr.com/ru/users/Renewal_Studio/) · [vc.ru](https://vc.ru/id458029) · [ai-stp](https://github.com/letya999/ai-stp) · [job_ftch](https://github.com/letya999/job_ftch)',
 ].join('\n\n')+'\n';
}
