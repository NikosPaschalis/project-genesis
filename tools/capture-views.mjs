import { mkdir, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { chromium } from 'playwright-core';
import { createServer } from 'vite';

const [source, output, routeName, mode] = process.argv.slice(2);
if (!source || !output) throw new Error('Usage: node tools/capture-views.mjs <checkout> <output directory> [east|sight|crossing] [stats]');
const eastViews = [
  { name: 'crown-descent', x: 35.5, z: -42, yaw: 2.86, pitch: -0.14 },
  { name: 'reed-bend', x: 25, z: -24, yaw: 2.86, pitch: -0.12 },
  { name: 'measure-approach', x: 24, z: -13.2, yaw: -1.97, pitch: 0.09 },
  { name: 'measure-aisle', x: 32, z: -10.2, yaw: -1.56, pitch: 0.08 },
  { name: 'crossing-west', x: -15, z: 13, yaw: -1.60, pitch: -0.10 },
  { name: 'southern-lookback', x: 26, z: 11, yaw: 0.31, pitch: -0.10 },
];
const sightViews = [
  { name: 'joined', x: 44.7, z: -10.2, yaw: Math.PI / 2, pitch: 0.041 },
  { name: 'separated', x: 44.7, z: -11.35, yaw: 1.49, pitch: 0.041 },
];
const crossingViews = [
  { name: 'trail-fork', x: -19.9, z: 20.2, yaw: -0.47, pitch: -0.11 },
  { name: 'turn-to-crossing', x: -15.9, z: 15.8, yaw: -1.02, pitch: -0.13 },
  { name: 'return-from-deck', x: -8, z: 12, yaw: 1.7, pitch: -0.13 },
  { name: 'waymark-detail', x: -16.75, z: 12.5, yaw: -0.58, pitch: -0.1 },
];
const viewGroups = { east: eastViews, sight: sightViews, crossing: crossingViews };
const views = viewGroups[routeName] ?? [
  { name: 'fork', x: -21.2, z: -27.8, yaw: 0.37, pitch: -0.12 },
  { name: 'approach', x: -25.7, z: -39.0, yaw: 0.12, pitch: -0.11 },
  { name: 'return-view', x: -24.5, z: -46.0, yaw: -2.05, pitch: -0.10 },
];

await mkdir(output, { recursive: true });
const server = await createServer({
  root: resolve(source),
  server: { host: '127.0.0.1', port: 0 },
  logLevel: 'error',
});
let browser;

try {
  await server.listen();
  browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium',
    args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
  });
  const page = await browser.newPage({ viewport: { width: 880, height: 550 }, reducedMotion: 'reduce' });
  const errors = [];
  page.on('console', entry => { if (entry.type() === 'error') errors.push(entry.text()); });
  page.on('pageerror', error => errors.push(error.message));
  await page.route(url => url.pathname === '/src/main.js', async route => {
    const response = await route.fetch();
    // Fixed viewpoints support visual comparison. The shipped client has no camera test API.
    const capture = `window.captureView = ({ x, z, yaw: heading, pitch: tilt }) => {
      camera.position.set(x, (typeof walkingHeight === 'function' ? walkingHeight(x, z) : ground(x, z)) + 1.67, z);
      yaw = heading;
      pitch = tilt;
      document.getElementById('message').textContent = '';
    };
    window.captureStats = () => {
      const { calls, triangles } = renderer.info.render;
      return { calls, triangles };
    };`;
    await route.fulfill({ response, body: (await response.text()) + '\n' + capture });
  });
  const { port } = server.httpServer.address();
  await page.goto(`http://127.0.0.1:${port}`, { waitUntil: 'networkidle' });
  const enter = page.getByRole('button', { name: 'Enter the Reach' });
  if (!(await enter.isVisible()) && errors.length) throw new Error(errors.join('\n'));
  await enter.click();
  await page.evaluate(() => document.fonts.ready.then(() => true));
  const stats = {};
  for (const view of views) {
    await page.evaluate(pose => window.captureView(pose), view);
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    stats[view.name] = await page.evaluate(() => window.captureStats());
    if (mode !== 'stats') await page.screenshot({ path: join(output, `${view.name}.png`) });
  }
  if (errors.length) throw new Error(errors.join('\n'));
  await writeFile(join(output, 'renderer.json'), JSON.stringify(stats, null, 2) + '\n');
  console.log(`Measured ${views.length} fixed views from ${source}`);
} finally {
  await browser?.close();
  await server.close();
}
