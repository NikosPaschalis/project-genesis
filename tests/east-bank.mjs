import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { chromium } from 'playwright-core';
import { createServer } from 'vite';

const server = await createServer({ server: { host: '127.0.0.1', port: 0 }, logLevel: 'error' });
const storageKey = 'genesis:quiet-reach:journal:1';
let browser;

try {
  await server.listen();
  browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium',
    args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
  });
  const page = await browser.newPage({ viewport: { width: 650, height: 440 }, reducedMotion: 'reduce' });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', entry => { if (entry.type() === 'error') errors.push(entry.text()); });
  await page.addInitScript(({ key }) => {
    if (!localStorage.getItem(key)) localStorage.setItem(key, JSON.stringify(['silt-gate', 'landing', 'obsolete-id']));
  }, { key: storageKey });
  await page.route(url => url.pathname === '/src/main.js', async route => {
    const response = await route.fetch();
    // Only read the pose to steer and stop normal keyboard and pointer movement.
    const probe = 'window.replayPose = () => ({ x: camera.position.x, y: camera.position.y, z: camera.position.z, yaw, pitch });';
    await route.fulfill({ response, body: (await response.text()) + '\n' + probe });
  });

  const url = `http://127.0.0.1:${server.httpServer.address().port}`;
  const enter = () => page.getByRole('button', { name: 'Enter the Reach' }).click();
  await page.goto(url);
  await enter();
  const pose = () => page.evaluate(() => window.replayPose());

  async function look(yaw, pitch = -0.07) {
    const from = await pose();
    const angle = yaw - from.yaw;
    const horizontal = Math.atan2(Math.sin(angle), Math.cos(angle)) / -0.0042;
    const vertical = (pitch - from.pitch) / -0.0042;
    const strokes = Math.max(1, Math.ceil(Math.max(Math.abs(horizontal), Math.abs(vertical)) / 200));
    for (let step = 0; step < strokes; step++) {
      await page.mouse.move(325, 218);
      await page.mouse.down();
      await page.mouse.move(325 + horizontal / strokes, 218 + vertical / strokes);
      await page.mouse.up();
    }
  }

  async function travel(x, z, { close = 0.75, fast = true } = {}) {
    const origin = await pose();
    const distance = Math.hypot(x - origin.x, z - origin.z);
    if (distance <= close) return;
    const yaw = Math.atan2(origin.x - x, origin.z - z);
    await look(yaw);
    const [ux, uz] = [(x - origin.x) / distance, (z - origin.z) / distance];
    if (fast) await page.keyboard.down('Shift');
    await page.keyboard.down('KeyW');
    try {
      await page.waitForFunction(({ origin, ux, uz, distance, close }) => {
        const now = window.replayPose();
        return (now.x - origin.x) * ux + (now.z - origin.z) * uz >= distance - close;
      }, { origin, ux, uz, distance, close }, { timeout: 20_000 });
    } catch (error) {
      throw new Error(`Could not walk toward (${x}, ${z}) from (${origin.x}, ${origin.z}), stopped at ${JSON.stringify(await pose())}`, { cause: error });
    } finally {
      await page.keyboard.up('KeyW');
      if (fast) await page.keyboard.up('Shift');
    }
    const end = await pose();
    assert.ok(Math.hypot(x - end.x, z - end.z) < Math.max(1.7, close * 2.5),
      `Arrived far from (${x}, ${z}): ${JSON.stringify(end)}`);
  }

  async function examine(name) {
    await page.getByRole('button', { name: new RegExp(`Examine .* ${name}$`) }).waitFor({ timeout: 7500 });
    await page.keyboard.press('KeyE');
    await page.locator('#field-note').waitFor();
    assert.match(await page.locator('#note-title').textContent(), new RegExp(name));
    await page.keyboard.press('Escape');
  }

  async function capture(name) {
    const output = process.env.GENESIS_CAPTURE_DIR;
    if (!output) return;
    await mkdir(output, { recursive: true });
    await page.screenshot({ path: join(output, `${name}.png`) });
  }

  await travel(-18, 24.9, { fast: false });
  await look(0);
  await examine('Stone');
  await travel(-20.8, 23);
  await travel(-18, 17);
  await travel(-13.2, 12.1, { close: 0.3, fast: false });
  await travel(7, 12, { close: 0.3 });
  const bridge = await pose();
  assert.ok(Math.abs(bridge.z - 12) < 1.3 && bridge.y > 2.6, JSON.stringify(bridge));
  await capture('bridge-crossing');
  await travel(26.6, 12, { close: 0.3 });
  await travel(27, 3.5);
  await travel(44.7, -2.5);
  await travel(44.7, -10.2, { close: 0.16, fast: false });
  await look(Math.PI / 2, 0.04);
  const mark = page.getByRole('button', { name: /Joined Mark/ });
  // A single movement hold can overshoot at low refresh rates. Recenter in controlled steps.
  for (let correction = 0; correction < 8 && !(await mark.isVisible()); correction++) {
    const current = await pose();
    await page.keyboard.press(current.z < -10.2 ? 'KeyA' : 'KeyD', { delay: 55 });
  }
  assert.ok(await mark.isVisible(), `Unable to line up from ${JSON.stringify(await pose())}`);
  await capture('sighting');
  await examine('Mark');

  await look(Math.PI * 3 / 2);
  assert.equal(await page.getByRole('button', { name: /Joined Mark/ }).isVisible(), false);
  await page.getByRole('button', { name: 'Enable ambient sound' }).click();
  await page.getByRole('button', { name: 'Mute ambient sound' }).click();
  await travel(45, -17.7);
  await travel(31.1, -17.7, { close: 0.35, fast: false });
  await look(Math.PI, -0.17);
  await examine('Gauge');
  console.log('Reached the east bank by bridge, recorded the perspective observation and gauge, and checked sound and facing.');

  await travel(25, -15);
  await travel(27, 3);
  await travel(26.6, 12, { close: 0.4, fast: false });
  await travel(-13.1, 12, { close: 0.4 });
  assert.ok((await pose()).x < -12.4);
  await page.keyboard.press('KeyJ');
  const titles = ['The Silt Gate', 'The Boatless Landing', 'The Leaning Stone', 'The Joined Mark', 'The Dry Gauge'];
  assert.deepEqual(await page.locator('#entries h3').allTextContents(), titles);
  assert.equal(await page.locator('#journal-comparisons li').count(), 3);
  await capture('field-journal');
  await page.reload();
  await enter();
  await page.getByRole('button', { name: 'Journal', exact: true }).click();
  assert.deepEqual(await page.locator('#entries h3').allTextContents(), titles);
  assert.equal(await page.locator('#journal-comparisons li').count(), 3);
  assert.deepEqual(errors, []);
  console.log('Crossed west again and verified original save IDs, discovery order, comparisons, and reload.');
} finally {
  await browser?.close();
  await server.close();
}
