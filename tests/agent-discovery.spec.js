import {test,expect} from '@playwright/test';

test('agent entrypoints serve usable documents and a portable skill',async({request,page})=>{
 const read=async path=>{const response=await request.get(path);expect(response.ok()).toBeTruthy();const text=await response.text();expect(text).not.toMatch(/<!doctype html>/i);return text;};
 const skill=await read('/skill.md');
 expect((await request.get('/skill.md')).headers()['content-type']).toMatch(/charset=utf-8/i);
 expect(skill).toMatch(/^---\nname: artem-portfolio\n/);
 expect(skill).toContain('description:');
 expect(skill).toContain('vacancy');
 const canonical=await read('/skills/artem-portfolio/SKILL.md');
 expect(canonical).toContain('references/workflow.md');
 for(const [path,body] of [['/skill.md',skill],['/skills/artem-portfolio/SKILL.md',canonical],['/agents.md',await read('/agents.md')],['/llms.txt',await read('/llms.txt')]]){
  for(const match of body.matchAll(/\]\(([^)]+)\)/g))if(!match[1].startsWith('https:'))await read(new URL(match[1],`http://127.0.0.1:5173${path}`).pathname);
 }
 const config=JSON.parse(await read('/mcp.json'));
 expect(config.mcpServers.fetch.command).toBe('uvx');
 expect(config.mcpServers.fetch.args).toEqual(['mcp-server-fetch==2026.10.19']);
 expect(config.instructions).toContain('skill.md');
 expect(config.mcpServers.fetch.env.PYTHONIOENCODING).toBe('utf-8');
 for(const locale of ['ru','en','kk'])expect(await read(`/skills/artem-portfolio/references/profile.${locale}.md`)).toBe(await read(`/resume.${locale}.md`));
 await page.goto('/?view=agent');
 for(const path of ['/skill.md','/agents.md','/mcp.json','/llms.txt'])await expect(page.locator(`a[href="${path}"]`)).toBeVisible();
 await expect(page.locator('head link[type="text/markdown"][lang="en"]')).toHaveAttribute('href','/resume.en.md');
});
