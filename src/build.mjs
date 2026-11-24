// Static site build. Usage:
//   node src/build.mjs            -> dist/     production: unconfirmed content hidden or anonymised
//   node src/build.mjs --preview  -> preview/  draft: every [ADD] / [CONFIRM] item visible
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { C, layout, esc } from './lib.mjs';
import * as P from './pages.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PREVIEW = process.argv.includes('--preview');
const OUT = path.join(ROOT, PREVIEW ? 'preview' : 'dist');
const today = new Date().toISOString().slice(0, 10);

// Small Markdown subset for news posts written in the CMS: ## headings, paragraphs, - lists, **bold**, *italic*, [links](url)
function markdown(md) {
  const inline = (s) => esc(s).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/\*(.+?)\*/g, '<em>$1</em>').replace(/\[([^\]]+)\]\(((?:https?:\/\/|\/)[^)\s]+)\)/g, '<a href="$2">$1</a>');
  return md.replace(/\r/g, '').split(/\n{2,}/).map((b) => {
    const t = b.trim(); if (!t) return '';
    const h = t.match(/^(#{2,4})\s+(.*)$/); if (h) return `<h${h[1].length}>${inline(h[2])}</h${h[1].length}>`;
    if (/^[-*]\s/.test(t)) return `<ul class="ticks">${t.split('\n').map((l) => `<li>${inline(l.replace(/^[-*]\s+/, ''))}</li>`).join('')}</ul>`;
    return `<p>${inline(t).replace(/\n/g, '<br>')}</p>`;
  }).join('\n');
}
const readJson = (p) => JSON.parse(fs.readFileSync(path.join(ROOT, p), 'utf8'));
const readDir = (d) => fs.existsSync(path.join(ROOT, d)) ? fs.readdirSync(path.join(ROOT, d)).filter((f) => f.endsWith('.json')).map((f) => readJson(path.join(d, f))) : [];

/* ---------- load content ---------- */
C.P = PREVIEW;
C.site = readJson('content/site.json');
const items = (p) => { const d = readJson(p); return Array.isArray(d) ? d : d.items; }; // CMS stores lists as {items: [...]}
C.assets = items('content/assets.json');
C.services = items('content/services.json');
C.disciplines = items('content/disciplines.json');
C.people = items('content/people.json');
C.officePhotoExists = !!(C.site.officePhoto && fs.existsSync(path.join(ROOT, 'src/static', C.site.officePhoto.src)));
C.projects = readDir('content/projects').filter((p) => p.publish || PREVIEW).sort((a, b) => a.order - b.order);
C.jobs = readDir('content/jobs').filter((j) => (j.publish && !j.example && (!j.validThrough || j.validThrough >= today)) || PREVIEW)
  .sort((a, b) => (parseInt(a.code.replace(/\D/g, ''), 10) || 0) - (parseInt(b.code.replace(/\D/g, ''), 10) || 0));
C.news = readDir('content/news').filter((n) => n.publish || PREVIEW).sort((a, b) => String(b.date).localeCompare(String(a.date)));
C.news.forEach((n) => { n.html = markdown(n.body || ''); });

// integrity: every slug referenced must exist
const problems = [];
for (const p of C.projects) {
  p.assets.forEach((a) => C.assets.some((x) => x.slug === a) || problems.push(`project ${p.slug}: unknown asset ${a}`));
  p.services.forEach((s) => C.services.some((x) => x.slug === s) || problems.push(`project ${p.slug}: unknown service ${s}`));
  p.disciplines.forEach((d) => C.disciplines.some((x) => x.slug === d) || problems.push(`project ${p.slug}: unknown discipline ${d}`));
}
for (const a of C.assets) a.disciplines.forEach((d) => C.disciplines.some((x) => x.slug === d) || problems.push(`asset ${a.slug}: unknown discipline ${d}`));
if (problems.length) { console.error(problems.join('\n')); process.exit(1); }

/* ---------- output ---------- */
fs.rmSync(OUT, { recursive: true, force: true });
fs.cpSync(path.join(ROOT, 'src/static'), OUT, { recursive: true });
// PDFs are produced by tools/make-pdfs.mjs into /downloads; keep previously generated ones
const pdfCache = path.join(ROOT, 'build-cache', PREVIEW ? 'preview' : 'dist', 'downloads');
if (fs.existsSync(pdfCache)) fs.cpSync(pdfCache, path.join(OUT, 'downloads'), { recursive: true });

// page functions call ADD()/CONFIRM() while rendering; C.page tells the open-items report where each marker is
const rendered = [];
const builders = [
  ['/', () => P.home()], ['/capabilities/', () => P.capabilities()], ...C.assets.map((a) => [`/capabilities/${a.slug}/`, () => P.assetPage(a)]),
  ['/services/', () => P.servicesIndex()], ...C.services.map((s) => [`/services/${s.slug}/`, () => P.servicePage(s)]),
  ['/disciplines/', () => P.disciplinesIndex()], ...C.disciplines.map((d) => [`/disciplines/${d.slug}/`, () => P.disciplinePage(d)]),
  ['/projects/', () => P.projectsIndex()], ...C.projects.map((p) => [`/projects/${p.slug}/`, () => P.projectPage(p)]),
  ['/how-we-work/', () => P.howWeWork()], ['/prequalification/', () => P.prequalification(today)], ['/about/', () => P.about()], ['/about/leadership/', () => P.leadership()],
  ['/careers/', () => P.careers()], ...C.jobs.map((j) => [`/careers/${j.code}/`, () => P.jobPage(j)]), ['/insights/', () => P.insights()], ...C.news.map((n) => [`/insights/${n.slug}/`, () => P.newsPage(n)]),
  ['/contact/', () => P.contact()], ['/contact/thanks/', () => P.thanks()], ['/privacy/', () => P.legal('privacy')], ['/terms/', () => P.legal('terms')], ['/cookies/', () => P.legal('cookies')],
  ['/design-system/', () => P.designSystem()], ['/404.html', () => P.notFound()],
];
C.open.clear();
for (const [p, fn] of builders) {
  C.page = p;
  const pg = fn();
  const html = layout(pg);
  C.page = p; // layout (header/footer) markers count for every page; keep them attributed
  const file = pg.file ? path.join(OUT, pg.file) : path.join(OUT, pg.path, 'index.html');
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, html);
  rendered.push({ ...pg, html });
}

// print documents (rendered to PDF by tools/make-pdfs.mjs)
const printDocs = [P.capabilityStatement(), ...C.disciplines.map(P.datasheet)];
for (const doc of printDocs) {
  C.page = doc.path;
  const file = path.join(OUT, doc.path, 'index.html');
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, doc.html);
}

/* ---------- search index, sitemap, robots, headers ---------- */
const strip = (h) => h.replace(/<script[\s\S]*?<\/script>/g, ' ').replace(/<[^>]+>/g, ' ').replace(/&[a-z#0-9]+;/g, ' ').replace(/\s+/g, ' ').trim();
const kindOf = (pg) => pg.kind || ({ home: 'Page', capabilities: 'Page', projects: 'Page' }[pg.type]) || 'Page';
const indexable = rendered.filter((r) => !r.noindex);
const searchIdx = indexable.map((r) => ({ t: r.title.replace(/ \| .*$/, ''), u: r.path, k: kindOf(r), x: (r.description + ' ' + (r.search || '')).slice(0, 300) }));
const docs = [{ t: 'Capability statement (PDF)', u: '/downloads/VDE-Capability-Statement.pdf', k: 'Document', x: 'Two-page capability statement: assets, services, disciplines, software, projects, quality.' },
  ...C.disciplines.map((d) => ({ t: `${d.name} datasheet (PDF)`, u: `/downloads/VDE-Datasheet-${d.slug}.pdf`, k: 'Document', x: `${d.scope} ${d.tools.join(' ')}` })),
  { t: 'Prequalification pack', u: '/prequalification/#pack', k: 'Document', x: 'ISO 9001 certificate, organisation chart, HSE policy, insurance, GST PAN' }];
fs.writeFileSync(path.join(OUT, 'search-index.json'), JSON.stringify(searchIdx.concat(docs)));

const origin = C.site.domain.value.replace(/\/$/, '');
fs.writeFileSync(path.join(OUT, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${indexable.map((r) => `  <url><loc>${esc(origin + r.path)}</loc><lastmod>${today}</lastmod></url>`).join('\n')}\n</urlset>\n`);
fs.writeFileSync(path.join(OUT, 'robots.txt'), PREVIEW ? 'User-agent: *\nDisallow: /\n' : `User-agent: *\nDisallow: /design-system/\nDisallow: /contact/thanks/\nDisallow: /admin/\nDisallow: /api/\n\nSitemap: ${origin}/sitemap.xml\n`);

const csp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com https://plausible.io https://www.googletagmanager.com",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: https:",
  "font-src 'self'",
  "connect-src 'self' https://plausible.io https://www.google-analytics.com https://*.google-analytics.com",
  'frame-src https://challenges.cloudflare.com',
  "frame-ancestors 'none'", "base-uri 'self'", "form-action 'self'", "object-src 'none'", 'upgrade-insecure-requests',
].join('; ');
fs.writeFileSync(path.join(OUT, '_headers'), `/*
  Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
  Content-Security-Policy: ${csp}
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()
  X-Frame-Options: DENY
  Cross-Origin-Opener-Policy: same-origin
${PREVIEW ? '  X-Robots-Tag: noindex, nofollow\n' : ''}
/admin/*
  Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://unpkg.com; style-src 'self' 'unsafe-inline' https://unpkg.com; img-src 'self' data: blob: https:; connect-src 'self' https://api.github.com https://*.githubusercontent.com; frame-ancestors 'none'
  X-Robots-Tag: noindex

/fonts/*
  Cache-Control: public, max-age=31536000, immutable
/css/*
  Cache-Control: public, max-age=86400
/js/*
  Cache-Control: public, max-age=86400
/downloads/*
  Cache-Control: public, max-age=86400
/capability-statement/*
  X-Robots-Tag: noindex
/disciplines/*/datasheet/*
  X-Robots-Tag: noindex
`);
fs.writeFileSync(path.join(OUT, '_redirects'), `/services/pre-bid-engineering /services/pre-bid/ 301\n/tender /contact/#tender 302\n/rfq /contact/#tender 302\n/jobs /careers/ 301\n`);

/* ---------- QA checks (fail loudly, never silently) ---------- */
const warn = [];
const files = new Set();
(function walk(d) { for (const f of fs.readdirSync(d)) { const p = path.join(d, f); if (fs.statSync(p).isDirectory()) walk(p); else files.add('/' + path.relative(OUT, p).replace(/\\/g, '/')); } })(OUT);
const exists = (u) => { const clean = u.split('#')[0].split('?')[0]; if (!clean) return true; return files.has(clean) || files.has(clean.replace(/\/?$/, '/') + 'index.html'); };
const links = new Map();
for (const r of rendered) {
  if (r.title.length > 60) warn.push(`title > 60 chars (${r.title.length}) on ${r.path}: ${r.title}`);
  if (r.description.length > 155) warn.push(`description > 155 chars (${r.description.length}) on ${r.path}`);
  const h1 = (r.html.match(/<h1[\s>]/g) || []).length;
  if (h1 !== 1) warn.push(`${h1} <h1> on ${r.path}`);
  const imgs = r.html.match(/<img\b[^>]*>/g) || [];
  imgs.filter((i) => !/\balt="/.test(i)).forEach(() => warn.push(`img without alt on ${r.path}`));
  if (/href="#"/.test(r.html) && r.type !== 'design' && r.type !== 'thanks') warn.push(`placeholder href="#" on ${r.path}`);
  const out = new Set();
  for (const m of r.html.matchAll(/href="(\/[^"]*)"/g)) {
    const u = m[1].replace(/&amp;/g, '&');
    if (u.startsWith('/downloads/') && !exists(u)) { warn.push(`download not generated yet: ${u} (run npm run pdf)`); continue; }
    if (!exists(u)) warn.push(`broken link ${u} on ${r.path}`);
    out.add(u.split('#')[0].split('?')[0]);
  }
  links.set(r.path, out);
}
// click depth from the home page (requirement: every service in <= 3 clicks)
const depth = new Map([['/', 0]]); const queue = ['/'];
while (queue.length) { const u = queue.shift(); for (const v of links.get(u) || []) if (!depth.has(v) && links.has(v)) { depth.set(v, depth.get(u) + 1); queue.push(v); } }
for (const s of C.services) { const d = depth.get(`/services/${s.slug}/`); if (d === undefined || d > 3) warn.push(`service ${s.slug} is ${d ?? '∞'} clicks from home`); }
// production must not leak unconfirmed client names
if (!PREVIEW) {
  for (const c of C.site.clients.filter((x) => !x.permission)) {
    for (const r of [...rendered, ...printDocs]) if (new RegExp(`\\b${c.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`).test(strip(r.html))) warn.push(`unconfirmed client name "${c.name}" appears on ${r.path}`);
  }
}
const uniqWarn = [...new Set(warn)];
const maxDepth = Math.max(...C.services.map((s) => depth.get(`/services/${s.slug}/`) ?? 99));

/* ---------- open items report (preview build) ---------- */
if (PREVIEW) {
  const groups = { ADD: [], CONFIRM: [], REVIEW: [] };
  for (const v of C.open.values()) groups[v.kind].push(v);
  const md = [`# Open items before launch`, ``, `Generated by \`npm run build:preview\` on ${today}. Each line is a marker currently visible in the preview build; the production build hides these items.`, ``];
  for (const k of ['CONFIRM', 'ADD', 'REVIEW']) {
    md.push(`## ${k} (${groups[k].length})`, '');
    for (const v of groups[k].sort((a, b) => a.label.localeCompare(b.label))) {
      const pg = [...v.pages]; md.push(`- ${v.label} — ${pg.length > 4 ? `${pg.length} pages` : pg.join(', ')}`);
    }
    md.push('');
  }
  fs.mkdirSync(path.join(ROOT, 'docs'), { recursive: true });
  fs.writeFileSync(path.join(ROOT, 'docs', 'open-items-report.md'), md.join('\n'));
}

const jsKb = (fs.statSync(path.join(OUT, 'js/site.js')).size / 1024).toFixed(1);
console.log(`${PREVIEW ? 'PREVIEW' : 'PRODUCTION'} build -> ${path.relative(ROOT, OUT)}/  ${rendered.length} pages, ${C.projects.length} case studies, ${C.jobs.length} jobs, site.js ${jsKb} KB, max service depth ${maxDepth} clicks`);
if (PREVIEW) console.log(`open items: ${C.open.size} (docs/open-items-report.md)`);
if (uniqWarn.length) { console.log(`\n${uniqWarn.length} warning(s):`); uniqWarn.forEach((w) => console.log('  - ' + w)); }
