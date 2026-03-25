const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', error => console.log('PAGE ERROR:', error.message));
  page.on('requestfailed', request => console.log('REQUEST FAILED:', request.url(), request.failure()?.errorText));

  // navigate to page
  await page.goto('http://localhost:3001/?tab=shopping', { waitUntil: 'networkidle2' });

  // wait for input
  await page.waitForSelector('input[placeholder^="Neuer Artikel"]');
  
  // type something
  await page.type('input[placeholder^="Neuer Artikel"]', 'Test Item 123');

  // get button and click
  await Promise.all([
    page.click('button[type="submit"].btn-primary'),
    new Promise(resolve => setTimeout(resolve, 2000))
  ]);

  await browser.close();
})();
