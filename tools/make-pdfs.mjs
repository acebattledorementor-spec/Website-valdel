// Renders the print documents to PDF with headless Edge/Chrome, and the Open Graph preview image.
//   node tools/make-pdfs.mjs     (run after both builds; re-run the builds afterwards is not needed)
// Output: <build>/downloads/*.pdf and a cache in build-cache/<build>/downloads so later builds keep them.
import fs from 'node:fs';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';
import { start } from './serve.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const BROWSERS = [
  process.env.BROWSER,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
  '/usr/bin/chromium', '/usr/bin/google-chrome', '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
].filter(Boolean);
const browser = BROWSERS.find((b) => fs.existsSync(b));
if (!browser) { console.error('No Edge/Chrome found. Set BROWSER=/path/to/chrome'); process.exit(1); }
const profile = path.join(ROOT, 'build-cache', 'browser-profile');
// async on purpose: the local server runs in this process and must keep answering the browser
const run = (args) => promisify(execFile)(browser, ['--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check', `--user-data-dir=${profile}`, '--virtual-time-budget=8000', ...args], { timeout: 90000 });

// Edge's launcher can return before the file is written: wait until it exists and its size is stable
async function waitFor(file, ms = 45000) {
  const t0 = Date.now(); let last = -1;
  while (Date.now() - t0 < ms) {
    if (fs.existsSync(file)) { const n = fs.statSync(file).size; if (n > 0 && n === last) return; last = n; }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(`browser did not write ${file}`);
}

const raw = JSON.parse(fs.readFileSync(path.join(ROOT, 'content/disciplines.json'), 'utf8'));
const disciplines = Array.isArray(raw) ? raw : raw.items;
const docs = [['/capability-statement/', 'VDE-Capability-Statement.pdf'], ...disciplines.map((d) => [`/disciplines/${d.slug}/datasheet/`, `VDE-Datasheet-${d.slug}.pdf`])];

let port = 8790;
for (const build of ['preview', 'dist']) {
  const out = path.join(ROOT, build);
  if (!fs.existsSync(out)) { console.log(`skip ${build}/ (not built)`); continue; }
  const server = await start(out, port);
  const cache = path.join(ROOT, 'build-cache', build, 'downloads');
  fs.mkdirSync(cache, { recursive: true });
  fs.mkdirSync(path.join(out, 'downloads'), { recursive: true });
  for (const [url, name] of docs) {
    const file = path.join(cache, name);
    fs.rmSync(file, { force: true });
    await run(['--no-pdf-header-footer', '--print-to-pdf-no-header', `--print-to-pdf=${file}`, `http://127.0.0.1:${port}${url}`]);
    await waitFor(file);
    fs.copyFileSync(file, path.join(out, 'downloads', name));
    const kb = Math.round(fs.statSync(file).size / 1024);
    console.log(`${build}/downloads/${name}  ${kb} KB${kb > 3072 ? '  (over 3 MB budget!)' : ''}`);
  }
  // Open Graph / LinkedIn preview image (1200x630), rendered once from the production build
  if (build === 'dist') {
    const og = path.join(out, '_og.html');
    fs.writeFileSync(og, `<!DOCTYPE html><html><head><link rel="stylesheet" href="/css/site.css"><style>body{margin:0;width:1200px;height:630px;background:#002060;color:#fff;display:flex;flex-direction:column;justify-content:space-between;padding:64px 72px;box-sizing:border-box}h1{color:#fff;font-size:76px;max-width:16ch;margin:0}.b{display:inline-block;background:#fff;padding:14px 20px;align-self:flex-start}.b svg{height:84px;display:block}.f{font-family:var(--f-mono);font-size:22px;color:#C9D2E6;border-top:2px solid #E30613;padding-top:20px}</style></head><body><div class="b">${fs.readFileSync(path.join(ROOT, 'src/static/img/logo.svg'), 'utf8')}</div><h1>Offshore engineering for EPC contractors</h1><div class="f">Jackets · Topsides · FPSO modules · Subsea pipelines · Offshore wind · ISO 9001:2015</div></body></html>`);
    const png = path.join(ROOT, 'src/static/img/og-default.png');
    fs.rmSync(png, { force: true });
    await run(['--hide-scrollbars', '--window-size=1200,630', `--screenshot=${png}`, `http://127.0.0.1:${port}/_og.html`]);
    await waitFor(png);
    fs.rmSync(og);
    for (const b of ['preview', 'dist']) if (fs.existsSync(path.join(ROOT, b))) fs.copyFileSync(png, path.join(ROOT, b, 'img/og-default.png'));
    console.log('img/og-default.png  1200x630');
  }
  server.close();
  port++;
}
