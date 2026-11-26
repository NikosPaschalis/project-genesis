import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { chromium } from 'playwright-core';

const directory = process.argv[2];
if (!directory) throw new Error('Usage: npm run test:release -- <extracted archive directory>');
const path = resolve(directory);
const { version } = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'));
const server = spawn('python3', ['-u', '-m', 'http.server', '--bind', '127.0.0.1', '--directory', 'dist', '0'], { cwd: path });
let browser;
try {
  const port = await new Promise((resolve, reject) => {
    server.stdout.on('data', chunk => {
      const address = /port (\d+)/.exec(chunk.toString());
      if (address) resolve(address[1]);
    });
    server.stderr.on('data', chunk => reject(new Error(chunk)));
    server.on('error', reject);
    server.on('exit', code => reject(new Error(`Server exited ${code}`)));
  });
  const url = `http://127.0.0.1:${port}`;
  browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 640, height: 430 }, reducedMotion: 'reduce' });
  const failures = [];
  page.on('pageerror', error => failures.push(error.message));
  page.on('console', entry => { if (entry.type() === 'error') failures.push(entry.text()); });
  page.on('response', response => { if (!response.ok() && response.status() !== 304) failures.push(`${response.status()} ${response.url()}`); });
  page.on('request', request => { if (!request.url().startsWith(url)) failures.push(`External request ${request.url()}`); });
  await page.goto(url);
  await page.getByText(version, { exact: true }).waitFor();
  await page.getByRole('button', { name: 'Enter the Reach' }).click();
  await page.mouse.move(320, 215);
  await page.mouse.down();
  await page.mouse.move(280, 215);
  await page.mouse.up();
  await page.keyboard.down('KeyW');
  await page.getByRole('button', { name: /Examine .*Leaning Stone/ }).waitFor({ timeout: 20000 });
  await page.keyboard.up('KeyW');
  await page.keyboard.press('KeyE');
  await page.locator('#field-note').waitFor();
  await page.reload();
  await page.getByRole('button', { name: 'Enter the Reach' }).click();
  await page.getByRole('button', { name: 'Journal', exact: true }).click();
  assert.deepEqual(await page.locator('#entries h3').allTextContents(), ['The Leaning Stone']);
  assert.deepEqual(failures, []);
  console.log('Extracted ZIP served with the packaged Python launch command. Production WebGL, version, first observation, and persisted journal passed, with no external requests.');
} finally {
  await browser?.close();
  server.kill();
}
