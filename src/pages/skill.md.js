import skill from '../../public/skills/artem-portfolio/SKILL.md?raw';

export function GET(){
  return new Response(skill.replaceAll('](references/','](skills/artem-portfolio/references/'),{headers:{'Content-Type':'text/markdown; charset=utf-8'}});
}
