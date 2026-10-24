import {test, expect} from '@playwright/test';

test('achievements have a centered heading and seven project cases to the left of the equation', async ({page}) => {
  await page.setViewportSize({width: 1440, height: 900});
  await page.goto('/');
  const layout = await page.evaluate(() => {
    const section = document.querySelector('#results').getBoundingClientRect();
    const heading = document.querySelector('#results h2').getBoundingClientRect();
    const law = document.querySelector('.little-law').getBoundingClientRect();
    const entries = [...document.querySelectorAll('.achievement-list article')];
    return {
      headingOffset: heading.top - section.top,
      headingCenter: (heading.left + heading.right) / 2,
      count: entries.length,
      metrics: entries.map(entry => entry.querySelector('strong').textContent),
      leftOfEquation: entries.every(entry => entry.getBoundingClientRect().right < law.left),
      titleLeads: entries.every(entry => parseFloat(getComputedStyle(entry.querySelector('h3')).fontSize) > parseFloat(getComputedStyle(entry.querySelector('strong')).fontSize)),
    };
  });
  expect.soft(layout.headingOffset).toBeLessThanOrEqual(64);
  expect.soft(Math.abs(layout.headingCenter - 720)).toBeLessThan(8);
  expect.soft(layout.count).toBe(7);
  expect.soft(layout.metrics).toEqual(['9 сервисов · фрод ↓ в 2,5 раза','10+ каналов коммуникации','Мексика · Индия · Нигерия','5 продуктовых + 2 сервисные команды','ЮMoney · Amundsen','ITIS · команда 5 → 18','Renewal · безубыточность за 2 месяца']);
  expect.soft(layout.leftOfEquation).toBe(true);
  expect.soft(layout.titleLeads).toBe(true);
});
