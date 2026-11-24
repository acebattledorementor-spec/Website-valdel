// v2 video: animated slides (CSS animations frame-stepped in headless Chrome), browser-framed page scrolls,
// neural en-IN narration (tts.py, word-synced cues), crossfades, progress bar, subtitles.
//   node build2.mjs [out.mp4]      needs: dist site on :8082, shots/ (capture.mjs), tts/ (tts.py)
import { spawn, execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { scenes, credits } from './script2.mjs';

const DIR = path.dirname(new URL(import.meta.url).pathname.replace(/^\/(\w:)/, '$1'));
const SITE = 'C:/Users/mech12734/Desktop/VALDEL ONE/Website';
const OUTFILE = process.argv[2] || 'C:/Users/mech12734/Desktop/VALDEL ONE/VDE_Offshore_Website_2026.mp4';
const FF = execFileSync('python', ['-c', 'import imageio_ffmpeg;print(imageio_ffmpeg.get_ffmpeg_exe())']).toString().trim();
const W = path.join(DIR, 'work2'); if (!process.env.REUSE) fs.rmSync(W, { recursive: true, force: true }); fs.mkdirSync(W, { recursive: true });
const TTS = path.join(DIR, 'tts');
const FPS = 30, XF = 0.6, LEAD = 0.45;
const logo = fs.readFileSync(path.join(SITE, 'src/static/img/logo.svg'), 'utf8');
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
const ff = (args) => execFileSync(FF, ['-y', '-loglevel', 'error', ...args], { maxBuffer: 1 << 26 });
const audioDur = (f) => { try { execFileSync(FF, ['-i', f], { stdio: 'pipe' }); } catch (e) { const m = /Duration: (\d+):(\d+):([\d.]+)/.exec(e.stderr.toString()); return +m[1] * 3600 + +m[2] * 60 + +m[3]; } };
const norm = (s) => s.toLowerCase().replace(/[^a-z0-9]/g, '');

// ---------- timings ----------
const chapters = { intro: '', proof: '', scroll: '01 · The website', phone: '01 · The website', flow: '02 · Connected', list: '', roadmap: '06 · Next phase', close: '' };
let tGlobal = 0;
for (const [i, s] of scenes.entries()) {
  s.audio = path.join(TTS, `a${i}.mp3`);
  s.words = JSON.parse(fs.readFileSync(path.join(TTS, `w${i}.json`), 'utf8')).filter((w) => w.type === 'WordBoundary');
  s.D = +(audioDur(s.audio) + LEAD + (s.kind === 'close' ? 3.2 : 0.95)).toFixed(2);
  let k = 0;
  s.cueT = (s.cues || []).map((c, j) => {
    const n = norm(c);
    while (k < s.words.length && !norm(s.words[k].w).startsWith(n)) k++;
    if (k >= s.words.length) { console.warn(`cue "${c}" not found in scene ${i}`); k = 0; return 0.8 + j * 1.5; }
    return +(s.words[k++].t + LEAD - 0.15).toFixed(2);
  });
  s.start = tGlobal; tGlobal += s.D - XF;
}
const listCh = ['03 · Value', '04 · Industry outlook', '05 · Built in'];
let li = 0; for (const s of scenes) if (s.kind === 'list') s.chapter = listCh[li++]; else s.chapter = chapters[s.kind];
const TOTAL = tGlobal + XF;

// ---------- slide HTML ----------
const css = `<link rel="stylesheet" href="http://127.0.0.1:8082/css/site.css"><style>
*{box-sizing:border-box}html,body{margin:0;width:1920px;height:1080px;overflow:hidden;background:#002060}
.s{width:1920px;height:1080px;color:#fff;padding:110px 150px;position:relative;overflow:hidden;background:radial-gradient(1400px 900px at 85% 10%,#0A3A8C 0%,#002060 55%,#001440 100%)}
.bgimg{position:absolute;inset:-2%;background-size:cover;background-position:center;animation:kb var(--D) linear forwards}
@keyframes kb{from{transform:scale(1.02)}to{transform:scale(1.12)}}
.shade{position:absolute;inset:0;background:linear-gradient(90deg,rgba(0,24,72,.97) 0%,rgba(0,24,72,.88) 45%,rgba(0,24,72,.35) 100%)}
.shade.full{background:rgba(0,20,64,.86)}
.z{position:relative}
.a{opacity:0;animation:up .8s cubic-bezier(.2,.7,.2,1) forwards}
@keyframes up{from{opacity:0;transform:translateY(34px)}to{opacity:1;transform:none}}
.fade{opacity:0;animation:fd 1s ease forwards}@keyframes fd{to{opacity:1}}
.chap{position:absolute;top:64px;right:150px;font:500 24px var(--f-mono);letter-spacing:.06em;color:#9FB0D4}
.eb{font-family:var(--f-head);text-transform:uppercase;letter-spacing:.14em;font-size:28px;color:#C9D2E6;display:flex;align-items:center;gap:20px;margin:0 0 26px}
.eb:before{content:"";width:56px;height:4px;background:#E30613}
h1{font-family:var(--f-head);color:#fff;font-size:124px;line-height:1;margin:0 0 34px;max-width:13ch}
h2{font-family:var(--f-head);color:#fff;font-size:82px;line-height:1.04;margin:0 0 60px;max-width:22ch}
.sub{font-size:38px;line-height:1.4;color:#DCE3F2;max-width:30ch;margin:0}
.lg{background:#fff;padding:16px 22px;display:inline-block;margin-bottom:70px}.lg svg{height:74px;display:block}
.chips{display:flex;gap:22px;margin-top:64px}
.chip{background:#fff;color:#002060;font-family:var(--f-head);font-weight:600;font-size:34px;padding:20px 30px;border-left:8px solid #E30613}
.stats{display:grid;grid-template-columns:repeat(3,1fr);gap:0;margin-top:20px;border-top:2px solid rgba(255,255,255,.18)}
.stat{padding:50px 50px 40px 0;border-right:2px solid rgba(255,255,255,.12);margin-right:50px}
.stat:last-child{border:0}
.num{font-family:var(--f-head);font-size:210px;line-height:.9;font-weight:700;color:#fff}
.num small{font-size:120px;color:#E30613;margin-left:6px}
.lab{font-size:34px;color:#C9D2E6;margin-top:22px;max-width:16ch;line-height:1.3}
.iso{margin-top:70px;display:flex;align-items:center;gap:30px;border:2px solid rgba(255,255,255,.25);padding:26px 34px;width:max-content}
.iso b{font-family:var(--f-head);font-size:46px}.iso span{font:500 26px var(--f-mono);color:#C9D2E6}
.items{display:grid;grid-template-columns:1fr 1fr;gap:38px 80px;max-width:1560px}
.it{border-top:3px solid #E30613;padding-top:22px}
.it b{display:block;font-family:var(--f-head);font-size:46px;font-weight:600;color:#fff;margin-bottom:10px}
.it span{font-size:30px;line-height:1.4;color:#C9D2E6}
.flow{display:flex;gap:46px;margin-top:10px}
.st{flex:1;background:#fff;color:#002060;padding:64px 24px 30px;font-family:var(--f-head);font-size:38px;font-weight:600;line-height:1.12;position:relative;min-height:230px}
.st:first-child{background:#E30613;color:#fff}.st:first-child i{color:#FFD5D8}
.st i{position:absolute;top:20px;left:24px;font:500 22px var(--f-mono);font-style:normal;color:#8A93A8}
.st .ar{position:absolute;right:-40px;top:50%;transform:translateY(-50%);color:#fff;font-size:42px;font-family:var(--f-body)}
.foot{margin-top:80px;font-size:36px;color:#DCE3F2}
.road{position:relative;display:grid;grid-template-columns:repeat(4,1fr);gap:50px;margin-top:40px;padding-top:70px}
.line{position:absolute;top:22px;left:0;height:4px;background:#E30613;width:0;animation:ln linear forwards}
@keyframes ln{to{width:100%}}
.rail{position:absolute;top:22px;left:0;right:0;height:4px;background:rgba(255,255,255,.15)}
.rp{position:relative}
.rp:before{content:"";position:absolute;top:-62px;left:0;width:30px;height:30px;border-radius:50%;background:#002060;border:5px solid #fff}
.rp .k{font:500 24px var(--f-mono);color:#9FB0D4;letter-spacing:.08em;text-transform:uppercase}
.rp b{display:block;font-family:var(--f-head);font-size:50px;margin:10px 0 16px;line-height:1.05}
.rp span{font-size:30px;line-height:1.4;color:#C9D2E6}
.close{display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center}
.close .lg{margin-bottom:60px}.close .lg svg{height:120px}
.close h1{max-width:none;font-size:112px}
.cred{position:absolute;bottom:46px;left:0;right:0;text-align:center;font:400 20px var(--f-mono);color:#8FA0C4}
</style>`;
const A = (t, cls = 'a') => `class="${cls}" style="animation-delay:${t}s"`;
function slideHtml(s) {
  const chap = s.chapter ? `<div class="chap fade" style="animation-delay:.2s">${esc(s.chapter)}</div>` : '';
  const bg = s.photo ? `<div class="bgimg" style="background-image:url('${s.photo}')"></div><div class="shade${s.kind === 'list' || s.kind === 'close' ? ' full' : ''}"></div>` : '';
  let inner = '';
  if (s.kind === 'intro') inner = `<div ${A(0.2)}><div class="lg">${logo}</div></div><p ${A(0.5, "a eb")}>Introducing</p>
    <h1 ${A(0.7)}>Our offshore website</h1><p class="sub a" style="animation-delay:1.3s">Offshore engineering for EPC contractors, from tender to installation.</p>
    <div class="chips">${s.chips.map((c, j) => `<div ${A(s.cueT[j])}><div class="chip">${esc(c)}</div></div>`).join('')}</div>`;
  if (s.kind === 'proof') inner = `<p ${A(0.2, "a eb")}>Proof, up front</p><h2 ${A(0.35)}>The facts a buyer checks first</h2>
    <div class="stats">${s.stats.map(([n, u, l], j) => `<div class="stat a" style="animation-delay:${s.cueT[j]}s"><div class="num"><span data-count="${n}" data-t="${s.cueT[j]}">0</span><small>${u}</small></div><div class="lab">${esc(l)}</div></div>`).join('')}</div>
    <div ${A(s.cueT[3])}><div class="iso"><b>ISO 9001:2015</b><span>Certified by URS · UKAS-accredited · Cert. 134349/A/0001/UK/En</span></div></div>`;
  if (s.kind === 'flow') inner = `<p ${A(0.2, "a eb")}>${esc(s.eyebrow)}</p><h2 ${A(0.35)}>${esc(s.h)}</h2>
    <div class="flow">${s.steps.map((t, j) => `<div class="st a" style="animation-delay:${s.cueT[j]}s"><i>0${j + 1}</i>${esc(t)}${j < s.steps.length - 1 ? '<span class="ar">→</span>' : ''}</div>`).join('')}</div>
    <p class="foot a" style="animation-delay:${s.cueT.at(-1) + 1.2}s">One record from first enquiry to awarded job. Nothing retyped.</p>`;
  if (s.kind === 'list') inner = `<p ${A(0.2, "a eb")}>${esc(s.eyebrow)}</p><h2 ${A(0.35)}>${esc(s.h)}</h2>
    <div class="items">${s.items.map(([b, t], j) => `<div class="it a" style="animation-delay:${s.cueT[j]}s"><b>${esc(b)}</b><span>${esc(t)}</span></div>`).join('')}</div>`;
  if (s.kind === 'roadmap') inner = `<p ${A(0.2, "a eb")}>${esc(s.eyebrow)}</p><h2 ${A(0.35)}>${esc(s.h)}</h2>
    <div class="road"><div class="rail"></div><div class="line" style="animation-delay:${s.cueT[0]}s;animation-duration:${(s.cueT.at(-1) - s.cueT[0] + 0.8).toFixed(2)}s"></div>
    ${s.phases.map(([b, t], j) => `<div class="rp a" style="animation-delay:${s.cueT[j]}s"><div class="k">${['Now', 'Next', 'Then', 'Beyond'][j]}</div><b>${esc(b)}</b><span>${esc(t)}</span></div>`).join('')}</div>`;
  if (s.kind === 'close') inner = `<div ${A(0.3)}><div class="lg">${logo}</div></div><h1 ${A(0.9)}>From tender to installation.</h1>
    <p class="sub a" style="animation-delay:1.6s;max-width:none">Offshore engineering · Value Delivered</p>`;
  const cls = s.kind === 'close' ? 's close' : 's';
  return `<!DOCTYPE html><html><head><meta charset="utf-8">${css}<style>:root{--D:${s.D}s}</style></head><body><div class="${cls}">${bg}${chap}<div class="z">${inner}</div>${s.kind === 'close' ? `<div class="cred fade" style="animation-delay:2.4s">${esc(credits)}</div>` : ''}</div>
<script>window.setT=function(t){document.getAnimations().forEach(a=>{a.pause();a.currentTime=t*1000});
document.querySelectorAll('[data-count]').forEach(e=>{const p=Math.min(1,Math.max(0,(t-(+e.dataset.t))/1.4));e.textContent=Math.round((+e.dataset.count)*(1-Math.pow(1-p,3)))});};</script></body></html>`;
}
// browser frame + caption for page scrolls
const BX = 300, BY = 56, BW = 1560, BAR = 54, BH = 1080 - 2 * BY - BAR;
const frameHtml = (s) => `<!DOCTYPE html><html><head><meta charset="utf-8">${css}</head><body><div class="s" style="padding:0">
<div style="position:absolute;left:${BX}px;top:${BY}px;width:${BW}px;height:${BAR + BH}px;box-shadow:0 40px 90px rgba(0,0,0,.5);background:#fff;border-radius:14px 14px 4px 4px;overflow:hidden">
<div style="height:${BAR}px;background:#E9ECF2;display:flex;align-items:center;gap:12px;padding:0 22px;border-bottom:1px solid #D5DAE3">
<i style="width:15px;height:15px;border-radius:50%;background:#FF5F57"></i><i style="width:15px;height:15px;border-radius:50%;background:#FEBC2E"></i><i style="width:15px;height:15px;border-radius:50%;background:#28C840"></i>
<div style="margin-left:26px;flex:1;max-width:820px;height:34px;border-radius:17px;background:#fff;display:flex;align-items:center;padding:0 18px;font:400 18px var(--f-mono);color:#5F6473">🔒&nbsp; VDE offshore website&nbsp;<span style="color:#002060">${esc(s.url)}</span></div></div></div></div></body></html>`;
const capHtml = (s) => `<!DOCTYPE html><html><head><meta charset="utf-8">${css}<style>html,body{background:transparent!important}</style></head><body>
<div style="position:absolute;left:60px;bottom:90px;background:#002060;color:#fff;padding:26px 40px 28px 34px;border-left:9px solid #E30613;box-shadow:0 18px 50px rgba(0,0,0,.4);max-width:620px">
<div style="font:500 20px var(--f-mono);color:#FF8A92;letter-spacing:.08em;text-transform:uppercase;margin-bottom:10px">${esc(s.chapter)}</div>
<div style="font-family:var(--f-head);font-size:56px;line-height:1.05;font-weight:600">${esc(s.cap)}</div>
<div style="font:400 23px var(--f-mono);color:#C9D2E6;margin-top:12px">${esc(s.note)}</div></div></body></html>`;
const PX = 1220, PY = 70, PW = 470, PHh = 940, SW = 410, SH = 888;
const phoneHtml = (s) => `<!DOCTYPE html><html><head><meta charset="utf-8">${css}</head><body><div class="s">
<div class="z" style="margin-top:150px"><p class="eb">Mobile</p><h2 style="max-width:9ch">Works on every screen</h2>
<p class="sub" style="max-width:20ch">Fast, accessible and easy to read at site, in a yard or at a bid review.</p></div>
<div style="position:absolute;left:${PX}px;top:${PY}px;width:${PW}px;height:${PHh}px;border-radius:70px;background:#0B1020;box-shadow:0 40px 90px rgba(0,0,0,.5),inset 0 0 0 3px #2A3350"></div></div></body></html>`;

// ---------- Chrome ----------
const chrome = spawn('C:/Program Files/Google/Chrome/Application/chrome.exe', ['--headless=new', '--disable-gpu', '--hide-scrollbars', '--allow-file-access-from-files', '--remote-debugging-port=9335', `--user-data-dir=${path.join(DIR, 'profile3')}`, 'about:blank'], { stdio: 'ignore' });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let target;
for (let i = 0; i < 50 && !target; i++) { await sleep(300); try { target = (await (await fetch('http://127.0.0.1:9335/json')).json()).find((t) => t.type === 'page'); } catch {} }
const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((r) => ws.addEventListener('open', r));
let id = 0; const pending = new Map();
ws.addEventListener('message', (e) => { const m = JSON.parse(e.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); } });
const send = (method, params = {}) => new Promise((r) => { const i = ++id; pending.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
const evalJs = (expression) => send('Runtime.evaluate', { expression, awaitPromise: true });
await send('Page.enable');
await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'no-preference' }] });
await send('Emulation.setDeviceMetricsOverride', { width: 1920, height: 1080, deviceScaleFactor: 1, mobile: false });
async function load(html, name, transparent = false) {
  const f = path.join(W, name + '.html'); fs.writeFileSync(f, html);
  await send('Emulation.setDefaultBackgroundColorOverride', transparent ? { color: { r: 0, g: 0, b: 0, a: 0 } } : {});
  await send('Page.navigate', { url: 'file:///' + f.replace(/\\/g, '/') }); await sleep(1500);
  await evalJs('document.fonts.ready');
}
async function still(html, name, transparent) {
  await load(html, name, transparent);
  const r = await send('Page.captureScreenshot', { format: 'png' });
  const out = path.join(W, name + '.png'); fs.writeFileSync(out, Buffer.from(r.result.data, 'base64')); return out;
}

// ---------- scenes ----------
const clips = [];
for (const [i, s] of scenes.entries()) {
  const out = path.join(W, `v${i}.mp4`); const D = s.D;
  if (process.env.REUSE && fs.existsSync(out)) { clips.push(out); continue; }
  const fade = 'format=yuv420p';
  const audio = `[1:a]adelay=${LEAD * 1000}|${LEAD * 1000},apad,atrim=0:${D},aresample=48000,aformat=channel_layouts=stereo[a]`;
  const enc = ['-map', '[v]', '-map', '[a]', '-t', `${D}`, '-r', `${FPS}`, '-c:v', 'libx264', '-preset', 'medium', '-crf', '18', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '192k', '-ar', '48000', '-ac', '2', out];
  const ease = (a, b) => `(st(0,clip((t-${a})/(${b}),0,1))*ld(0)*ld(0)*(3-2*ld(0)))`;
  if (s.kind === 'scroll') {
    const bg = await still(frameHtml(s), `f${i}`); const cap = await still(capHtml(s), `c${i}`, true);
    const shot = path.join(W, `shot${i}.png`);
    ff(['-i', path.join(DIR, 'shots', s.shot + '.png'), '-vf', `scale=${BW}:-1:flags=lanczos`, shot]);
    ff(['-loop', '1', '-framerate', `${FPS}`, '-t', `${D}`, '-i', bg, '-i', s.audio, '-loop', '1', '-framerate', `${FPS}`, '-t', `${D}`, '-i', shot, '-loop', '1', '-framerate', `${FPS}`, '-t', `${D}`, '-i', cap,
      '-filter_complex', `[2:v]crop=${BW}:${BH}:0:'(ih-${BH})*${ease(1.6, D - 3.2)}'[pg];[0:v][pg]overlay=${BX}:${BY + BAR}[b];[3:v]format=rgba[cp];[b][cp]overlay=x='-760*pow(1-clip((t-0.5)/0.8,0,1),3)':y=0,${fade}[v];${audio}`, ...enc]);
  } else if (s.kind === 'phone') {
    const bg = await still(phoneHtml(s), `f${i}`);
    ff(['-loop', '1', '-framerate', `${FPS}`, '-t', `${D}`, '-i', bg, '-i', s.audio, '-loop', '1', '-framerate', `${FPS}`, '-t', `${D}`, '-i', path.join(DIR, 'shots', s.shot + '.png'),
      '-filter_complex', `[2:v]crop=780:1688:0:'(ih-1688)*${ease(1.2, D - 2.4)}',scale=${SW}:${SH}:flags=lanczos[ph];[0:v][ph]overlay=${PX + (PW - SW) / 2}:${PY + (PHh - SH) / 2},${fade}[v];${audio}`, ...enc]);
  } else {
    await load(slideHtml(s), `s${i}`);
    const animEnd = s.photo ? D : Math.min(D, Math.max(2.4, ...(s.cueT.length ? s.cueT : [0])) + 1.8);
    const n = Math.ceil(animEnd * FPS); const fd = path.join(W, `fr${i}`); fs.mkdirSync(fd);
    for (let f = 0; f < n; f++) {
      await evalJs(`setT(${(f / FPS).toFixed(4)})`);
      const r = await send('Page.captureScreenshot', { format: 'jpeg', quality: 93 });
      fs.writeFileSync(path.join(fd, `${String(f).padStart(5, '0')}.jpg`), Buffer.from(r.result.data, 'base64'));
    }
    ff(['-framerate', `${FPS}`, '-i', path.join(fd, '%05d.jpg'), '-i', s.audio, '-filter_complex', `[0:v]tpad=stop_mode=clone:stop_duration=${(D - n / FPS + 0.5).toFixed(2)},${fade}[v];${audio}`, ...enc]);
    fs.rmSync(fd, { recursive: true, force: true });
  }
  clips.push(out);
  console.log(`scene ${i + 1}/${scenes.length} ${s.kind} ${D}s`);
}
ws.close(); chrome.kill();

// ---------- assemble: crossfades, progress bar, loudness ----------
const inputs = clips.flatMap((c) => ['-i', c]);
let fv = '', fa = '', lastV = '0:v', lastA = '0:a', off = 0;
for (let i = 1; i < clips.length; i++) {
  off += scenes[i - 1].D - XF;
  const tr = scenes[i - 1].kind === 'scroll' && scenes[i].kind === 'scroll' ? 'smoothleft' : 'fade';
  fv += `[${lastV}][${i}:v]xfade=transition=${tr}:duration=${XF}:offset=${off.toFixed(3)}[xv${i}];`;
  fa += `[${lastA}][${i}:a]acrossfade=d=${XF}[xa${i}];`;
  lastV = `xv${i}`; lastA = `xa${i}`;
}
const filter = `${fv}${fa}[${lastV}]fade=t=in:st=0:d=0.6,fade=t=out:st=${(TOTAL - 0.8).toFixed(2)}:d=0.8,drawbox=x=0:y=ih-6:w='iw*t/${TOTAL.toFixed(2)}':h=6:color=0xE30613@1:t=fill[v];[${lastA}]loudnorm=I=-16:TP=-1.5:LRA=11,aresample=48000[a]`;
fs.writeFileSync(path.join(W, 'filter.txt'), filter);
ff([...inputs, '-/filter_complex', path.join(W, 'filter.txt'), '-map', '[v]', '-map', '[a]', '-r', `${FPS}`, '-c:v', 'libx264', '-preset', 'slow', '-crf', '19', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '192k', '-movflags', '+faststart', OUTFILE]);

// ---------- subtitles + script ----------
const ts = (t) => { const ms = Math.round(t * 1000); const h = Math.floor(ms / 3600000), m = Math.floor(ms / 60000) % 60, s = Math.floor(ms / 1000) % 60; return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')},${String(ms % 1000).padStart(3, '0')}`; };
const srt = []; let n = 1;
for (const s of scenes) {
  const sentences = s.say.match(/[^.?!]+[.?!]+/g) || [s.say]; let k = 0;
  for (const sen of sentences) {
    const cnt = sen.trim().split(/\s+/).length; const w0 = s.words[Math.min(k, s.words.length - 1)]; const w1 = s.words[Math.min(k + cnt - 1, s.words.length - 1)]; k += cnt;
    srt.push(`${n++}\n${ts(s.start + LEAD + w0.t)} --> ${ts(s.start + LEAD + w1.t + w1.d + 0.25)}\n${sen.trim()}\n`);
  }
}
fs.writeFileSync(OUTFILE.replace(/\.mp4$/, '.srt'), srt.join('\n'));
fs.writeFileSync(OUTFILE.replace(/\.mp4$/, '.script.txt'), 'VDE offshore website - overview video narration (voice: en-IN Neerja)\n\n' + scenes.map((s, i) => `[${String(i + 1).padStart(2, '0')}] ${ts(s.start).slice(3, 8)}  ${s.cap || s.h || s.kind}\n${s.say}`).join('\n\n') + '\n');
console.log(`done: ${OUTFILE}  ${TOTAL.toFixed(1)} s`);
