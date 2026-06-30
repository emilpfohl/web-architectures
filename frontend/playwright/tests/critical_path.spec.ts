import { test, expect, request } from '@playwright/test';

test.describe.serial('critical path', () => {
  test('shopping and todo critical path updates leaderboard', async ({ page }) => {
  const unique = Date.now();
  const user = { email: `e2e_${unique}@example.com`, password: 'password123', name: `E2E User ${unique}` };
  const shoppingItem = `Milch ${unique}`;
  const todoTitle = `Abwasch ${unique}`;

  const req = await request.newContext({ baseURL: 'http://localhost:3000' });
  const res = await req.post('/api/auth/register', { data: user });
  if (![200, 201].includes(res.status())) {
    console.warn('Registration returned', res.status());
  }

  // route frontend /api requests to backend so fetch('/api/...') hits localhost:3000
  await page.route('**/api/**', async (route) => {
    const routeReq = route.request();
    const newUrl = routeReq.url().replace(/https?:\/\/[^/]+/, 'http://localhost:3000');
    const headers = routeReq.headers();
    if (token) headers['cookie'] = `token=${token}`;
    const method = routeReq.method();
    const postData = routeReq.postData();
    const fetchOptions: any = { method, headers };
    if (postData) fetchOptions.data = postData;
    const fetched = await req.fetch(newUrl, fetchOptions);
    const body = await fetched.body();
    await route.fulfill({ status: fetched.status(), headers: fetched.headers(), body });
  });

  // perform API login and set auth cookie into browser context
  const loginRes = await req.post('/api/auth/login', { data: { email: user.email, password: user.password } });
  const setCookie = loginRes.headers()['set-cookie'] || loginRes.headers()['Set-Cookie'];
  let token = '';
  if (setCookie) {
    const match = setCookie.match(/token=([^;]+);/);
    token = match ? match[1] : '';
    if (token) {
      await page.context().addCookies([{ name: 'token', value: token, url: 'http://localhost:3000' }]);
    }
  }

  // ensure user has a WG so dashboard shows: create WG via API using auth cookie
  let wgId = null;
  if (token) {
    const loginJson = await loginRes.json().catch(() => ({}));
    const userId = loginJson?.user?.id || loginJson?.userId;
    const wgRes = await req.post('/api/wgs', { data: { name: `E2E WG ${unique}`, userId }, headers: { cookie: `token=${token}` } });
    const wgJson = await wgRes.json().catch(() => ({}));
    wgId = wgJson?.id || null;
    console.log('Created WG id:', wgId, 'wgRes.status:', wgRes.status());
  }

  await page.goto('http://localhost:5174/');
  await expect(page.getByText('WG Stimmung')).toBeVisible({ timeout: 10000 });

  // Ensure the created WG is selected in the UI
  if (wgId) {
    try {
      await page.selectOption('select', String(wgId));
      await page.waitForResponse(r => r.url().includes(`/api/shopping?wgId=${wgId}`), { timeout: 5000 });
    } catch (e) {
      // ignore if select not present or wait times out
    }
  }

  // Go to shopping
  await page.getByText('Einkaufen').click();
  await expect(page.getByText('Einkaufen?')).toBeVisible();

  // Add item to Lebensmittel
  const section = page.locator('section', { hasText: 'Lebensmittel' });
  await section.getByRole('button', { name: 'Eintrag hinzufügen' }).click();
  await section.getByPlaceholder('Lebensmittel hinzufügen...').fill(shoppingItem);
  const [postResp] = await Promise.all([
    page.waitForResponse(r => r.url().includes('/api/shopping') && r.request().method() === 'POST', { timeout: 5000 }),
    section.getByRole('button', { name: 'add' }).click()
  ]);
  console.log('Shopping POST status:', postResp.status());
  console.log('Shopping POST body:', await postResp.text());
  // Ensure UI fetches fresh data for our WG: re-select WG so MainLayout triggers fetch
  try {
    await page.selectOption('select', String(wgId));
  } catch (e) {
    // ignore if no select present
  }
  // debug: check items from API
  if (wgId) {
    const itemsRes = await req.get(`/api/shopping?wgId=${wgId}`, { headers: { cookie: `token=${token}` } });
    const itemsJson = await itemsRes.json().catch(() => ({}));
    console.log('API shopping items after add:', itemsJson);
  }
  // wait for UI to fetch the updated shopping list
  await page.waitForResponse(r => r.url().includes(`/api/shopping?wgId=${wgId}`) && r.request().method() === 'GET', { timeout: 5000 }).catch(() => {});
  await expect(page.getByText(shoppingItem, { timeout: 5000 })).toBeVisible();

  // Go to todos and add todo
  await page.goto('http://localhost:5174/?tab=todos');
  await expect(page.getByText('Aufgaben & Rotation')).toBeVisible();
  await page.locator('#todo-title-input').fill(todoTitle);
  await page.locator('#add-todo-btn').click();
  await expect(page.getByText(todoTitle)).toBeVisible();

  // Complete todo
  await page.getByText(todoTitle).click();
  // completed UI should show reduced opacity class on closest card
  const todoCard = page.getByText(todoTitle).locator('..').locator('..');
  await expect(todoCard).toHaveClass(/opacity-30/);

  // Back to dashboard - leaderboard should contain our user
  await page.goto('/');
  await expect(page.getByText('WG Rangliste')).toBeVisible();
  await expect(page.getByText(user.name)).toBeVisible();
  });
});
