import {test,expect} from '@playwright/test';
test('browser language region and saved selection choose the interface language',async({browser,baseURL})=>{
 for(const [locale,expected] of [['kk-KZ','kk'],['en-US','en'],['ru-RU','ru'],['de-DE','en']]){
  const context=await browser.newContext({locale});const page=await context.newPage();await page.goto(baseURL+'/');
  await expect.soft(page.locator('html')).toHaveAttribute('lang',expected,{timeout:200});
  await page.evaluate(()=>localStorage.setItem('portfolio-language','kk'));await page.goto(baseURL+'/');
  await expect.soft(page.locator('html')).toHaveAttribute('lang','kk',{timeout:200});await context.close();
 }
});
