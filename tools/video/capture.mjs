// Full-page screenshots of the production site via Chrome DevTools Protocol.
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const OUT = path.join(path.dirname(new URL(import.meta.url).pathname.replace(/^\/(\w:)/, '$1')), 'shots');
fs.mkdirSync(OUT, { recursive: true });
const BASE = 'http://127.0.0.1:8082';
const pages = [
  ['home', '/', 1440],
  ['capabilities', '/capabilities/', 1440],
  ['projects', '/projects/', 1440],
  ['case', '/projects/taean-offshore-wind-oss/', 1440],
  ['how', '/how-we-work/', 1440],
  ['prequal', '/prequalification/', 1440],
  ['careers', '/careers/', 1440],
  ['contact', '/contact/', 1440],
  ['about', '/about/', 1440],
  ['mobile', '/', 390],
];

const chrome = spawn('C:/Program Files/Google/Chrome/Application/chrome.exe', ['--headless=new', '--disable-gpu', '--hide-scrollbars', '--remote-debugging-port=9333', `--user-data-dir=${path.join(OUT, '..', 'profile')}`, 'about:blank'], { stdio: 'ignore' });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let target;
for (let i = 0; i < 40 && !target; i++) { await sleep(300); try { target = (await (await fetch('http://127.0.0.1:9333/json')).json()).find((t) => t.type === 'page'); } catch {} }
const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((r) => ws.addEventListener('open', r));
let id = 0; const pending = new Map();
ws.addEventListener('message', (e) => { const m = JSON.parse(e.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); } });
const send = (method, params = {}) => new Promise((r) => { const i = ++id; pending.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
const evalJs = async (expr) => (await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true })).result?.result?.value;

await send('Page.enable');
await send('Page.navigate', { url: BASE + '/' }); await sleep(1500);
await evalJs(`localStorage.setItem('vde_consent','no')`);
for (const [name, url, w] of pages) {
  const mobile = w < 800;
  await send('Emulation.setDeviceMetricsOverride', { width: w, height: mobile ? 844 : 1080, deviceScaleFactor: mobile ? 2 : 4 / 3, mobile });
  await send('Page.navigate', { url: BASE + url }); await sleep(2500);
  // trigger lazy images, reveal animations
  await evalJs(`(async()=>{for(let y=0;y<document.body.scrollHeight;y+=600){scrollTo(0,y);await new Promise(r=>setTimeout(r,60))}scrollTo(0,0);document.querySelectorAll('img[loading=lazy]').forEach(i=>i.loading='eager');await new Promise(r=>setTimeout(r,800))})()`);
  const h = Math.min(await evalJs(`(()=>{const f=[...document.querySelectorAll('footer')].pop();return f?f.getBoundingClientRect().top+scrollY:document.documentElement.scrollHeight})()`), mobile ? 9000 : 6000);
  await send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: mobile ? 2 : 4 / 3, mobile });
  await sleep(700);
  const shot = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(OUT, name + '.png'), Buffer.from(shot.result.data, 'base64'));
  console.log(name, w, h);
}
ws.close(); chrome.kill();
