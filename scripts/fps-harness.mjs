/**
 * Film Lab playback fps harness (D-3).
 *
 * Measures sustained playback fps against the production build so the
 * "sustained playback >= 55 fps" ship gate is repeatable. Define "sustained"
 * as a fixed 3-second sample at 1x speed; reference machine is the machine
 * running this script (record it in the report).
 *
 * Also gates the bundle budget (BUDGET_KB_GZIP): dist JS/CSS gzip sizes must
 * stay within budget or the run fails. Builds first so both gates measure
 * fresh output.
 *
 * Usage: bun run fps
 * Requires: playwright devDependency + a chromium browser (bun install brings
 * the driver; the browser comes from ~/.cache/ms-playwright).
 */
import { spawn, spawnSync } from 'node:child_process';
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { gzipSync } from 'node:zlib';

const PORT = 4173;
const SUSTAINED_MS = 3000;
const MIN_FPS = 55;
const BUDGET_KB_GZIP = { js: 75, css: 2 };

function distGzipKb(ext) {
  const bytes = readdirSync('dist/assets')
    .filter((f) => f.endsWith(`.${ext}`))
    .reduce((total, f) => total + gzipSync(readFileSync(`dist/assets/${f}`)).length, 0);
  return Number((bytes / 1024).toFixed(1));
}

const build = spawnSync('bun', ['run', 'build'], { stdio: 'inherit' });
if (build.status !== 0) process.exit(build.status ?? 1);

function waitForPort(port, host = '127.0.0.1', timeoutMs = 30000) {
  const started = Date.now();
  return new Promise((resolve, reject) => {
    const attempt = async () => {
      try {
        const res = await fetch(`http://${host}:${port}/`);
        if (res.ok) return resolve();
      } catch { /* server not up yet */ }
      if (Date.now() - started > timeoutMs) return reject(new Error('preview server timed out'));
      setTimeout(attempt, 250);
    };
    attempt();
  });
}

const server = spawn('bun', ['run', 'preview', '--host', '127.0.0.1', '--port', String(PORT)], { stdio: 'ignore' });
const { chromium } = await import('playwright');

let browser;
try {
  await waitForPort(PORT);
  browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto(`http://127.0.0.1:${PORT}/`);
  const playButton = page.getByRole('button', { name: 'Play play' });
  await playButton.waitFor();
  await playButton.click();

  const sample = await page.evaluate(async (ms) => {
    const started = performance.now();
    let frames = 0;
    let last = started;
    const count = () => {
      const now = performance.now();
      frames += 1;
      last = now;
      if (now - started >= ms) return;
      requestAnimationFrame(count);
    };
    return await new Promise((resolve) => {
      const finish = () => resolve({ frames, elapsedMs: last - started });
      requestAnimationFrame(() => {
        requestAnimationFrame(count);
        setTimeout(finish, ms + 250);
      });
    });
  }, SUSTAINED_MS);

  const fps = (sample.frames / sample.elapsedMs) * 1000;
  const kbGzip = { js: distGzipKb('js'), css: distGzipKb('css') };
  const report = {
    measuredAt: new Date().toISOString(),
    sustainedMs: SUSTAINED_MS,
    speed: '1x',
    frames: sample.frames,
    elapsedMs: sample.elapsedMs,
    fps: Number(fps.toFixed(1)),
    minFps: MIN_FPS,
    pass: fps >= MIN_FPS,
    bundle: {
      kbGzip,
      budgetKbGzip: BUDGET_KB_GZIP,
      pass: Object.keys(BUDGET_KB_GZIP).every((ext) => kbGzip[ext] <= BUDGET_KB_GZIP[ext]),
    },
    machine: `${process.platform}/${process.arch} ${process.env.HOSTNAME ?? ''}`,
  };
  console.log(JSON.stringify(report, null, 2));
  mkdirSync('docs/evidence', { recursive: true });
  writeFileSync('docs/evidence/fps-report.json', JSON.stringify(report, null, 2));
  if (!report.pass || !report.bundle.pass) process.exitCode = 1;
} finally {
  if (browser) await browser.close();
  server.kill('SIGTERM');
}