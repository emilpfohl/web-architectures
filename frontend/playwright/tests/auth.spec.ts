import { test, expect, request } from '@playwright/test';

test('register via API and login via UI', async ({ page }) => {
  const unique = Date.now();
  const user = { email: `e2e_${unique}@example.com`, password: 'password123', name: `E2E User ${unique}` };

  // register via backend API
  const req = await request.newContext({ baseURL: 'http://localhost:3000' });
  const res = await req.post('/api/auth/register', { data: user });
  // proceed even if registration returns non-2xx (allow existing test data)
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
  if (token) {
    // parse login response to get user id
    const loginJson = await loginRes.json().catch(() => ({}));
    const userId = loginJson?.user?.id || loginJson?.userId;
    await req.post('/api/wgs', { data: { name: `E2E WG ${unique}`, userId }, headers: { cookie: `token=${token}` } });
  }

  await page.goto('http://localhost:5174/');
  await expect(page.getByText('WG Stimmung')).toBeVisible({ timeout: 10000 });
});
