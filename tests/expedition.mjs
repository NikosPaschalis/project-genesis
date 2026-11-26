import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { chromium } from 'playwright-core';
import { createServer } from 'vite';

const server = await createServer({ server: { host: '127.0.0.1', port: 0 }, logLevel: 'error' });
let browser;

try {
  await server.listen();
  const { port } = server.httpServer.address();
  const url = `http://127.0.0.1:${port}`;
  browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH || 'chromium',
    args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
  });

  const desktop = await browser.newPage({ viewport: { width: 560, height: 430 }, reducedMotion: 'reduce' });
  const errors = [];
  desktop.on('pageerror', (error) => errors.push(error.message));
  desktop.on('console', (entry) => {
    if (entry.type() === 'error') errors.push(entry.text());
  });
  // Observe position through the test server response only. The shipped client has no test API.
  await desktop.route('**/src/main.js', async (route) => {
    const response = await route.fetch();
    await route.fulfill({
      response,
      body: await response.text() + '\nwindow.positionForSmokeTest = camera.position; window.rotationForSmokeTest = camera.rotation;',
    });
  });

  await desktop.goto(url);
  await desktop.getByRole('button', { name: 'Enter the Reach' }).click();
  assert.equal(await desktop.locator('#fallback').isVisible(), false);
  await desktop.getByRole('button', { name: 'Enable ambient sound' }).click();
  await desktop.getByRole('button', { name: 'Mute ambient sound' }).click();

  async function lookBy(dx) {
    const start = dx >= 0 ? 215 : 345;
    await desktop.mouse.move(start, 210);
    await desktop.mouse.down();
    await desktop.mouse.move(start + dx, 210);
    await desktop.mouse.up();
  }

  await lookBy(-40);

  async function walk(key, condition, value) {
    await desktop.keyboard.down('Shift');
    await desktop.keyboard.down(key);
    try {
      await desktop.waitForFunction(condition, value, { timeout: 75_000 });
    } catch (error) {
      const position = await desktop.evaluate(() => window.positionForSmokeTest.toArray());
      throw new Error(`Movement by ${key} toward ${value ?? 'water boundary'} stopped at ${position.join(', ')}`, { cause: error });
    } finally {
      await desktop.keyboard.up(key);
      await desktop.keyboard.up('Shift');
    }
  }

  async function recordObservation(count) {
    const button = desktop.getByRole('button', { name: /Examine/ });
    await button.waitFor();
    await desktop.keyboard.press('KeyE');
    await desktop.locator('#field-note').waitFor();
    assert.equal(await desktop.locator('#journal').isVisible(), false);
    await desktop.keyboard.press('KeyJ');
    await desktop.getByRole('heading', { name: 'Field journal' }).waitFor();
    assert.equal(await desktop.locator('#entries li').count(), count);
    await desktop.keyboard.press('Escape');
    console.log(`Recorded observation ${count} in the field and verified it in the journal.`);
  }

  await walk('KeyW', (z) => window.positionForSmokeTest.z < z, 25);
  await desktop.getByRole('button', { name: /Examine/ }).waitFor();
  await lookBy(300);
  await desktop.getByRole('button', { name: /Examine/ }).waitFor({ state: 'hidden' });
  await desktop.keyboard.press('KeyE');
  assert.equal(await desktop.locator('#field-note').isVisible(), false);
  await lookBy(-300);
  await desktop.getByRole('button', { name: /Examine/ }).waitFor();
  await walk('PageUp', () => window.rotationForSmokeTest.x > 0.8);
  assert.equal(await desktop.getByRole('button', { name: /Examine/ }).isVisible(), false);
  await walk('PageDown', () => window.rotationForSmokeTest.x < -0.07);
  await recordObservation(1);

  await desktop.keyboard.down('KeyW');
  try {
    await desktop.waitForFunction(() => window.positionForSmokeTest.z < 23.4);
    await desktop.waitForTimeout(1500);
    assert.ok(await desktop.evaluate(() => window.positionForSmokeTest.z >= 22.9), 'The stone blocks forward movement');
    assert.doesNotMatch(await desktop.locator('#message').textContent(), /too deep/);
  } finally {
    await desktop.keyboard.up('KeyW');
  }
  await walk('KeyA', (x) => window.positionForSmokeTest.x < x, -21.1);
  await walk('KeyW', () => !document.querySelector('#inspect').hidden && document.querySelector('#inspect span').textContent.includes('Landing'));
  await recordObservation(2);

  await walk('KeyD', () => document.querySelector('#message').textContent.includes('too deep'));
  await walk('KeyA', (x) => window.positionForSmokeTest.x < x, -18);
  await walk('KeyW', (z) => window.positionForSmokeTest.z < z, -37);
  await lookBy(-187);
  await lookBy(-187);
  await walk('KeyW', () => !document.querySelector('#inspect').hidden && document.querySelector('#inspect span').textContent.includes('Silt Gate'));
  if (process.env.GENESIS_CAPTURE_DIR) {
    await mkdir(process.env.GENESIS_CAPTURE_DIR, { recursive: true });
    await desktop.screenshot({ path: join(process.env.GENESIS_CAPTURE_DIR, 'inland-spur.png') });
  }
  await recordObservation(3);
  await lookBy(187);
  await lookBy(187);
  await walk('KeyD', (x) => window.positionForSmokeTest.x > x, -18);
  await walk('KeyW', (z) => window.positionForSmokeTest.z < z, -58);
  await walk('KeyD', (x) => window.positionForSmokeTest.x > x, 35.2);
  for (let quarter = 0; quarter < 4; quarter++) await lookBy(187);
  await walk('KeyW', () => !document.querySelector('#inspect').hidden && document.querySelector('#inspect span').textContent.includes('Crown'));
  await recordObservation(4);

  await desktop.keyboard.press('KeyJ');
  await desktop.getByRole('button', { name: 'Return to overlook' }).click();
  await desktop.waitForFunction(() => Math.abs(window.positionForSmokeTest.z - 34) < 0.01);
  await desktop.reload();
  await desktop.getByRole('button', { name: 'Enter the Reach' }).click();
  await desktop.getByRole('button', { name: 'Journal', exact: true }).click();
  assert.equal(await desktop.locator('#entries li').count(), 4);
  assert.deepEqual(errors, []);
  await desktop.close();
  console.log('Desktop passed: horizontal and vertical facing, site collision, in-world observations, pond boundary, all sites and journal persistence.');

  const mobile = await browser.newPage({
    viewport: { width: 390, height: 844 }, reducedMotion: 'reduce', isMobile: true, hasTouch: true,
  });
  await mobile.goto(url);
  await mobile.getByRole('button', { name: 'Enter the Reach' }).tap();
  const forward = mobile.getByRole('button', { name: 'Move forward' });
  const bounds = await forward.boundingBox();
  assert.ok(bounds);
  const cdp = await mobile.context().newCDPSession(mobile);
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: 200, y: 420 }] });
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: 160, y: 420 }] });
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await cdp.send('Input.dispatchTouchEvent', {
    type: 'touchStart',
    touchPoints: [{ x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height / 2 }],
  });
  await mobile.getByRole('button', { name: /Examine/ }).waitFor({ timeout: 45_000 });
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await mobile.getByRole('button', { name: /Examine/ }).tap();
  await mobile.locator('#field-note').waitFor();
  await mobile.getByRole('button', { name: 'Journal', exact: true }).tap();
  await mobile.getByRole('heading', { name: 'Field journal' }).waitFor();
  assert.equal(await mobile.locator('#entries li').count(), 1);
  await mobile.close();
  console.log('Mobile passed: touch look, movement, field note and journal.');

  if (process.env.GENESIS_CAPTURE_DIR) {
    const directory = process.env.GENESIS_CAPTURE_DIR;
    await mkdir(directory, { recursive: true });
    const view = await browser.newPage({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
    await view.goto(url, { waitUntil: 'networkidle' });
    await view.evaluate(() => document.fonts.ready.then(() => true));
    await view.screenshot({ path: join(directory, 'overlook.png') });
    await view.setViewportSize({ width: 390, height: 844 });
    await view.screenshot({ path: join(directory, 'portrait.png') });
    await view.close();
  }
} finally {
  await browser?.close();
  await server.close();
}
