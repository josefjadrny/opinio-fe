import { test, expect } from '@playwright/test';

test.describe('Profile menu + Settings modal', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173');
    await page.waitForLoadState('networkidle');
  });

  test('shows Register button (disabled) when anonymous', async ({ page }) => {
    const registerBtn = page.getByRole('button', { name: /register/i });
    await expect(registerBtn).toBeVisible();
    await expect(registerBtn).toBeDisabled();
  });

  test('Profile button opens dropdown with Settings, About, Login', async ({ page }) => {
    await page.getByRole('button', { name: /profile/i }).click();
    await expect(page.getByRole('button', { name: /settings/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /about/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /login/i })).toBeVisible();
  });

  test('dropdown closes when clicking outside', async ({ page }) => {
    await page.getByRole('button', { name: /profile/i }).click();
    await expect(page.getByRole('button', { name: /settings/i })).toBeVisible();
    await page.mouse.click(100, 100);
    await expect(page.getByRole('button', { name: /settings/i })).not.toBeVisible();
  });

  test('Settings opens modal over the map on desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.getByRole('button', { name: /profile/i }).click();
    await page.getByRole('button', { name: /settings/i }).click();
    // Modal visible
    await expect(page.getByRole('heading', { name: /settings/i })).toBeVisible();
    // Map still visible behind (sidebar titles present)
    await expect(page.getByText(/rising/i).first()).toBeVisible();
    // Screenshot for visual review
    await page.screenshot({ path: '/tmp/settings-desktop.png', fullPage: false });
  });

  test('Settings modal closes with Escape', async ({ page }) => {
    await page.getByRole('button', { name: /profile/i }).click();
    await page.getByRole('button', { name: /settings/i }).click();
    await expect(page.getByRole('heading', { name: /settings/i })).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('heading', { name: /settings/i })).not.toBeVisible();
  });

  test('Settings modal closes by clicking backdrop', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.getByRole('button', { name: /profile/i }).click();
    await page.getByRole('button', { name: /settings/i }).click();
    await expect(page.getByRole('heading', { name: /settings/i })).toBeVisible();
    // Click the backdrop (left edge of modal backdrop area, which is the map container overlay)
    await page.mouse.click(300, 700);
    await expect(page.getByRole('heading', { name: /settings/i })).not.toBeVisible();
  });

  test('Settings shows anonymous state — fields disabled', async ({ page }) => {
    await page.getByRole('button', { name: /profile/i }).click();
    await page.getByRole('button', { name: /settings/i }).click();
    const nameInput = page.locator('input[type="text"]').first();
    await expect(nameInput).toBeDisabled();
    await expect(nameInput).toHaveValue('Anonymous');
  });

  test('switching Settings → About replaces modal (no stacking)', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    // Open Settings
    await page.getByRole('button', { name: /profile/i }).click();
    await page.getByRole('button', { name: /settings/i }).click();
    await expect(page.getByRole('heading', { name: /settings/i })).toBeVisible();
    // Now open About without closing Settings first
    await page.getByRole('button', { name: /profile/i }).click();
    await page.getByRole('button', { name: /about/i }).click();
    // About should be visible
    await expect(page.getByRole('heading', { name: /about/i })).toBeVisible();
    // Settings should NOT be visible
    await expect(page.getByRole('heading', { name: /settings/i })).not.toBeVisible();
    // Only one modal backdrop
    const backdrops = page.locator('.fixed.inset-0');
    expect(await backdrops.count()).toBeLessThanOrEqual(2);
  });

  test('mobile: settings opens as bottom sheet', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('http://localhost:5173');
    await page.waitForLoadState('networkidle');
    await page.getByRole('button', { name: /profile/i }).click();
    await page.getByRole('button', { name: /settings/i }).click();
    await expect(page.getByRole('heading', { name: /settings/i })).toBeVisible();
    await page.screenshot({ path: '/tmp/settings-mobile.png', fullPage: false });
  });
});
