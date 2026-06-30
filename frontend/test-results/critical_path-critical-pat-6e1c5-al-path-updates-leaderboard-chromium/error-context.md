# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: critical_path.spec.ts >> critical path >> shopping and todo critical path updates leaderboard
- Location: playwright/tests/critical_path.spec.ts:4:3

# Error details

```
Error: expect(locator).toHaveClass(expected) failed

Locator: getByText('Abwasch 1780483846575').locator('..').locator('..')
Expected pattern: /opacity-30/
Received string:  "flex items-center gap-6"
Timeout: 5000ms

Call log:
  - Expect "toHaveClass" with timeout 5000ms
  - waiting for getByText('Abwasch 1780483846575').locator('..').locator('..')
    14 × locator resolved to <div class="flex items-center gap-6">…</div>
       - unexpected value "flex items-center gap-6"

```

```yaml
- text: check
- heading "Abwasch 1780483846575" [level=4]
- text: E2E User 1780483846575 Routine • Dringend
```

# Test source

```ts
  8   |   const todoTitle = `Abwasch ${unique}`;
  9   | 
  10  |   const req = await request.newContext({ baseURL: 'http://localhost:3000' });
  11  |   const res = await req.post('/api/auth/register', { data: user });
  12  |   if (![200, 201].includes(res.status())) {
  13  |     console.warn('Registration returned', res.status());
  14  |   }
  15  | 
  16  |   // route frontend /api requests to backend so fetch('/api/...') hits localhost:3000
  17  |   await page.route('**/api/**', async (route) => {
  18  |     const routeReq = route.request();
  19  |     const newUrl = routeReq.url().replace(/https?:\/\/[^/]+/, 'http://localhost:3000');
  20  |     const headers = routeReq.headers();
  21  |     if (token) headers['cookie'] = `token=${token}`;
  22  |     const method = routeReq.method();
  23  |     const postData = routeReq.postData();
  24  |     const fetchOptions: any = { method, headers };
  25  |     if (postData) fetchOptions.data = postData;
  26  |     const fetched = await req.fetch(newUrl, fetchOptions);
  27  |     const body = await fetched.body();
  28  |     await route.fulfill({ status: fetched.status(), headers: fetched.headers(), body });
  29  |   });
  30  | 
  31  |   // perform API login and set auth cookie into browser context
  32  |   const loginRes = await req.post('/api/auth/login', { data: { email: user.email, password: user.password } });
  33  |   const setCookie = loginRes.headers()['set-cookie'] || loginRes.headers()['Set-Cookie'];
  34  |   let token = '';
  35  |   if (setCookie) {
  36  |     const match = setCookie.match(/token=([^;]+);/);
  37  |     token = match ? match[1] : '';
  38  |     if (token) {
  39  |       await page.context().addCookies([{ name: 'token', value: token, url: 'http://localhost:3000' }]);
  40  |     }
  41  |   }
  42  | 
  43  |   // ensure user has a WG so dashboard shows: create WG via API using auth cookie
  44  |   let wgId = null;
  45  |   if (token) {
  46  |     const loginJson = await loginRes.json().catch(() => ({}));
  47  |     const userId = loginJson?.user?.id || loginJson?.userId;
  48  |     const wgRes = await req.post('/api/wgs', { data: { name: `E2E WG ${unique}`, userId }, headers: { cookie: `token=${token}` } });
  49  |     const wgJson = await wgRes.json().catch(() => ({}));
  50  |     wgId = wgJson?.id || null;
  51  |     console.log('Created WG id:', wgId, 'wgRes.status:', wgRes.status());
  52  |   }
  53  | 
  54  |   await page.goto('http://localhost:5174/');
  55  |   await expect(page.getByText('WG Stimmung')).toBeVisible({ timeout: 10000 });
  56  | 
  57  |   // Ensure the created WG is selected in the UI
  58  |   if (wgId) {
  59  |     try {
  60  |       await page.selectOption('select', String(wgId));
  61  |       await page.waitForResponse(r => r.url().includes(`/api/shopping?wgId=${wgId}`), { timeout: 5000 });
  62  |     } catch (e) {
  63  |       // ignore if select not present or wait times out
  64  |     }
  65  |   }
  66  | 
  67  |   // Go to shopping
  68  |   await page.getByText('Einkaufen').click();
  69  |   await expect(page.getByText('Einkaufen?')).toBeVisible();
  70  | 
  71  |   // Add item to Lebensmittel
  72  |   const section = page.locator('section', { hasText: 'Lebensmittel' });
  73  |   await section.getByRole('button', { name: 'Eintrag hinzufügen' }).click();
  74  |   await section.getByPlaceholder('Lebensmittel hinzufügen...').fill(shoppingItem);
  75  |   const [postResp] = await Promise.all([
  76  |     page.waitForResponse(r => r.url().includes('/api/shopping') && r.request().method() === 'POST', { timeout: 5000 }),
  77  |     section.getByRole('button', { name: 'add' }).click()
  78  |   ]);
  79  |   console.log('Shopping POST status:', postResp.status());
  80  |   console.log('Shopping POST body:', await postResp.text());
  81  |   // Ensure UI fetches fresh data for our WG: re-select WG so MainLayout triggers fetch
  82  |   try {
  83  |     await page.selectOption('select', String(wgId));
  84  |   } catch (e) {
  85  |     // ignore if no select present
  86  |   }
  87  |   // debug: check items from API
  88  |   if (wgId) {
  89  |     const itemsRes = await req.get(`/api/shopping?wgId=${wgId}`, { headers: { cookie: `token=${token}` } });
  90  |     const itemsJson = await itemsRes.json().catch(() => ({}));
  91  |     console.log('API shopping items after add:', itemsJson);
  92  |   }
  93  |   // wait for UI to fetch the updated shopping list
  94  |   await page.waitForResponse(r => r.url().includes(`/api/shopping?wgId=${wgId}`) && r.request().method() === 'GET', { timeout: 5000 }).catch(() => {});
  95  |   await expect(page.getByText(shoppingItem, { timeout: 5000 })).toBeVisible();
  96  | 
  97  |   // Go to todos and add todo
  98  |   await page.goto('http://localhost:5174/?tab=todos');
  99  |   await expect(page.getByText('Aufgaben & Rotation')).toBeVisible();
  100 |   await page.locator('#todo-title-input').fill(todoTitle);
  101 |   await page.locator('#add-todo-btn').click();
  102 |   await expect(page.getByText(todoTitle)).toBeVisible();
  103 | 
  104 |   // Complete todo
  105 |   await page.getByText(todoTitle).click();
  106 |   // completed UI should show reduced opacity class on closest card
  107 |   const todoCard = page.getByText(todoTitle).locator('..').locator('..');
> 108 |   await expect(todoCard).toHaveClass(/opacity-30/);
      |                          ^ Error: expect(locator).toHaveClass(expected) failed
  109 | 
  110 |   // Back to dashboard - leaderboard should contain our user
  111 |   await page.goto('/');
  112 |   await expect(page.getByText('WG Rangliste')).toBeVisible();
  113 |   await expect(page.getByText(user.name)).toBeVisible();
  114 |   });
  115 | });
  116 | 
```