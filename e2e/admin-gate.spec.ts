import { test, expect } from '@playwright/test';

/*
 * The non-negotiable security posture: no customer reaches the admin app.
 * With no session, every protected route bounces to /login, while the health
 * endpoint and login page stay public.
 */

test('protected routes redirect unauthenticated visitors to /login', async ({
  page,
}) => {
  await page.goto('/');
  await expect(page).toHaveURL(/\/login/);
});

test('a deep admin route also bounces to /login', async ({ page }) => {
  await page.goto('/prompts');
  await expect(page).toHaveURL(/\/login/);
});

test('the login page is reachable and shows the MFA expectation', async ({
  page,
}) => {
  await page.goto('/login');
  await expect(
    page.getByRole('heading', { name: 'Yaycay Admin' }),
  ).toBeVisible();
  await expect(page.getByText(/2FA code/i)).toBeVisible();
});

test('the health endpoint is public and reports ok', async ({ request }) => {
  const res = await request.get('/api/health');
  expect(res.ok()).toBeTruthy();
  const body = await res.json();
  expect(body.status).toBe('ok');
});
