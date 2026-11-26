import { execFileSync } from 'node:child_process';
import { copyFile, cp, mkdir, mkdtemp, readFile, rename, rm, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const output = process.argv[2];
if (!output) throw new Error('Usage: npm run release -- <output directory>');

const root = fileURLToPath(new URL('../', import.meta.url));
const { version } = JSON.parse(await readFile(join(root, 'package.json'), 'utf8'));
const archiveName = `the-quiet-reach-${version}.zip`;
const outputDirectory = resolve(output);
await mkdir(outputDirectory, { recursive: true });
const stage = await mkdtemp(join(outputDirectory, '.genesis-release-'));

try {
  const notices = join(stage, 'third-party');
  await mkdir(notices);
  await cp(join(root, 'dist'), join(stage, 'dist'), { recursive: true });
  for (const [dependency, notice] of [
    ['three', 'three.txt'],
    ['@fontsource/dm-sans', 'dm-sans.txt'],
    ['@fontsource/instrument-serif', 'instrument-serif.txt'],
  ]) {
    await copyFile(join(root, 'node_modules', dependency, 'LICENSE'), join(notices, notice));
  }
  await writeFile(join(stage, 'PLAY.txt'), `THE QUIET REACH
Project Genesis · Expedition ${version}

Extract the archive and open a terminal in the extracted directory.

  python3 -m http.server --bind 127.0.0.1 --directory dist 4173

On Windows with the Python launcher, use "py -3" in place of "python3".
Open http://127.0.0.1:4173/ in a browser with WebGL 2.

WASD to walk. Drag to look, or use Left/Right to turn and Page Up/Down to look vertically.
Hold Shift to run. Face a nearby trace and press E to examine it.
Press J for the field journal and Esc to dismiss an observation or close the journal.
On touch screens, drag to look, hold a directional button to move, and tap Examine.

Sound is optional. Journal entries stay in your browser profile when storage is available.
Some scenery can still be walked through.
`);
  execFileSync('zip', ['-qr', archiveName, 'PLAY.txt', 'dist', 'third-party'], { cwd: stage, stdio: 'inherit' });
  execFileSync('unzip', ['-tq', archiveName], { cwd: stage, stdio: 'inherit' });
  const archive = join(outputDirectory, archiveName);
  await rename(join(stage, archiveName), archive);
  console.log(archive);
} finally {
  await rm(stage, { recursive: true, force: true });
}
