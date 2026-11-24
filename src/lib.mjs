// Shared build context, helpers, icons, layout and components.
// Nothing here talks to the network; the build is pure Node with no dependencies.

export const C = {
  P: false,            // preview build (shows draft markers) vs production (hides unconfirmed content)
  site: null, assets: [], services: [], disciplines: [], projects: [], jobs: [], news: [], people: [],
  open: new Map(),     // open items collected while rendering (preview only)
  page: '',            // current page path, for the open-items report
};

/* ---------------- basic helpers ---------------- */
export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const has = (v) => v !== undefined && v !== null && String(v).trim() !== '';
export const list = (arr, fn, sep = '') => (arr || []).map(fn).join(sep);
export const bySlug = (arr, slug) => arr.find((x) => x.slug === slug);
export const asset = (s) => bySlug(C.assets, s);
export const service = (s) => bySlug(C.services, s);
export const discipline = (s) => bySlug(C.disciplines, s);

function note(kind, label) {
  const key = `${kind}|${label}`;
  if (!C.open.has(key)) C.open.set(key, { kind, label, pages: new Set() });
  C.open.get(key).pages.add(C.page);
}
/** Visible placeholder for content VDE must add. Empty string in production. */
export const ADD = (label) => (C.P ? (note('ADD', label), `<span class="ph">[ADD] ${esc(label)}</span>`) : '');
/** Visible marker for content VDE must confirm. Empty string in production. */
export const CONFIRM = (label) => (C.P ? (note('CONFIRM', label), `<span class="ph">[CONFIRM] ${esc(label)}</span>`) : '');
export const ADDblock = (label, items = []) => (C.P ? (note('ADD', label), `<div class="ph-block">[ADD] ${esc(label)}${items.length ? `<ul>${list(items, (i) => `<li>${esc(i)}</li>`)}</ul>` : ''}</div>`) : '');
export const REVIEW = (label, items = []) => (C.P ? (items.forEach((i) => note('REVIEW', `${label}: ${i}`)), `<div class="ph-block">[REVIEW] ${esc(label)}<ul>${list(items, (i) => `<li>${esc(i)}</li>`)}</ul></div>`) : '');

/** A value that may be unconfirmed: {value, confirmed}. Returns html or '' in production. */
export function confirmed(obj, label) {
  if (!obj) return '';
  if (obj.confirmed) return esc(obj.value);
  return C.P ? `${esc(obj.value)} ${CONFIRM(label)}` : '';
}
/** Value or [ADD] marker in preview; '' in production when empty. */
/** Postal address as VDE writes it: "..., Bengaluru, Karnataka – 560058, India". */
export const fullAddress = (a) => [a.street, a.locality, [a.region, a.postcode].filter(has).join(' – '), a.country].filter(has).join(', ');
export const valOr = (v, label) => (has(v) ? esc(v) : ADD(label));

/* client-permission aware names */
export const epcName = (p) => (p.epc.permission ? esc(p.epc.name) : C.P && has(p.epc.name) ? `${esc(p.epc.name)} ${CONFIRM('client permission')}` : esc(p.anonEpc));
export const endUserName = (p) => (has(p.endUser.name) && p.endUser.permission ? esc(p.endUser.name) : C.P && has(p.endUser.name) ? `${esc(p.endUser.name)} ${CONFIRM('end-user permission')}` : esc(p.anonEndUser));
export const titleCleared = (p) => p.epc.permission && (!has(p.endUser.name) || p.endUser.permission);
export const projTitleText = (p) => (titleCleared(p) || C.P ? p.title : p.anonTitle);
export const projTitle = (p) => esc(projTitleText(p));
export const projUrl = (p) => `/projects/${p.slug}/`;

/* ---------------- icons (one 24px line set, 1.5px stroke) ---------------- */
const IC = {
  jacket: '<path d="M5 7h14M7 7V4h10v3M8.2 21 10 7M15.8 21 14 7M9.3 12h5.4M8.6 17h6.8M9.3 12l5.4 5M14.7 12l-5.4 5M2 21h20"/>',
  process: '<path d="M2 20h20M4 20v-6h16v6M3 14h18M6 14V8h4v6M13 14V6.5a2 2 0 0 1 4 0V14M8 8V5"/>',
  fpso: '<path d="M2 15h20l-2.5 5h-15zM4.5 15v-4h5v4M11 15V9h4v6M16.5 15v-3h3v3M7 11V8"/>',
  pipeline: '<path d="M2 7c2.5 0 2.5-2 5-2s2.5 2 5 2 2.5-2 5-2 2.5 2 5 2M2 15h20M2 18.5h20M6 13v7.5M18 13v7.5"/>',
  brownfield: '<path d="M4 21 6 11M12 21l-2-10M3 11h10M2 21h12M15.5 3.5a3.2 3.2 0 0 0 3.8 4.6L22 10.8 20.8 12l-2.7-2.7a3.2 3.2 0 0 1-4.6-3.8z"/>',
  wind: '<path d="M7 21V9M7 9 4.5 2.8M7 9l6 .8M7 9l-4.5 4M13 21v-6h8v6M12 15h10M15 15v-3h4v3M2 21h20"/>',
  prebid: '<rect x="3" y="5" width="18" height="16"/><path d="M3 10h18M8 3v4M16 3v4M12 13v3.5l2.5 1.5"/>',
  feed: '<path d="M5 3h10l4 4v14H5zM15 3v4h4M8 11h8M8 14.5h8M8 18h5"/>',
  detail: '<rect x="3" y="3" width="18" height="18"/><path d="M7 17V10h10M7 7h10M7 6v2M17 6v2M19.5 10v7M18.5 10h2M18.5 17h2"/>',
  installation: '<path d="M4 21V3h13M4 7l4-4M17 3v6M15 12a2 2 0 1 0 2-3M2 21h6M12 16h8v5h-8z"/>',
  yard: '<path d="M3 21V11l5 3v-3l5 3V7h3v14zM18 21V4h3v17M2 21h20"/>',
  procurement: '<rect x="5" y="4" width="14" height="17"/><path d="M9 4V2h6v2M8 10l1.5 1.5L12 9M8 16l1.5 1.5L12 15M14 10.5h3M14 16.5h3"/>',
  verification: '<circle cx="10" cy="10" r="6.5"/><path d="M15 15l6 6M7.3 10l2 2 3.5-3.5"/>',
  asbuilt: '<path d="M12 2 21 7v10l-9 5-9-5V7zM3 7l9 5 9-5M12 12v10"/>',
  weight: '<path d="M5 21h14l-2.2-11H7.2zM9 10a3 3 0 1 1 6 0"/>',
  'd-process': '<path d="M9 3h6M10 3v6L5 19a1.5 1.5 0 0 0 1.3 2h11.4a1.5 1.5 0 0 0 1.3-2L14 9V3M7.5 15h9"/>',
  'd-mechanical': '<circle cx="12" cy="12" r="3.5"/><path d="M12 2v4M12 18v4M2 12h4M18 12h4M4.9 4.9l2.8 2.8M16.3 16.3l2.8 2.8M4.9 19.1l2.8-2.8M16.3 7.7l2.8-2.8"/>',
  'd-piping': '<path d="M2 6h9a6 6 0 0 1 6 6v10M2 10h9a2 2 0 0 1 2 2v10M5 4v8M11 18h8"/>',
  'd-electrical': '<path d="M13 2 4 14h7l-1 8 9-12h-7z"/>',
  'd-instrument': '<circle cx="12" cy="13" r="8"/><path d="M12 13l4-4M8.5 21h7M12 5V3"/>',
  'd-telecom': '<path d="M12 10v11M12 10l-4 11M12 10l4 11M8.5 6.5a5 5 0 0 1 7 0M6 4a8.5 8.5 0 0 1 12 0"/><circle cx="12" cy="9" r="1"/>',
  'd-structural': '<path d="M2 18h20M2 8h20M2 8v10M22 8v10M7 8v10M12 8v10M17 8v10M2 8l5 10M12 8l-5 10M12 8l5 10M22 8l-5 10"/>',
  'd-pipeline': '<path d="M2 9h20M2 15h20M6 7v10M18 7v10"/>',
  'd-model': '<path d="M12 2 21 7v10l-9 5-9-5V7zM3 7l9 5 9-5M12 12v10"/>',
  'd-controls': '<path d="M3 3v18h18M7 7h6M9 11h8M11 15h6"/>',
  search: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="M15.5 15.5 21 21"/>',
  menu: '<path d="M3 6h18M3 12h18M3 18h18"/>',
  close: '<path d="M5 5l14 14M19 5 5 19"/>',
  download: '<path d="M12 3v12M7 10l5 5 5-5M4 21h16"/>',
};
export const icon = (name, cls = 'icon') => `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${IC[name] || ''}</svg>`;

// VDE logo: VALDEL wordmark and marks traced as vector shapes from the official artwork (docs/brand/), official colours
// #004785 / #ED1C24. Replace with the official vector file if VDE supplies one.
export const logo = (label = 'VALDEL Design Engineering – home') => `<svg class="logo" viewBox="-2 -2 466 134" role="img" aria-label="${esc(label)}"><path fill="#ED1C24" d="M1 0H69V71Z"/><path fill="#004785" d="M0.5 73 34.5 37 68.5 73Z"/><path fill="#004785" d="M70 0H90L107 44 125 0H145L114 73H100Z"/><path fill="#004785" fill-rule="evenodd" d="M152 0H173L196.5 73H180L174.5 58.5H149L143.5 73H124.5ZM161.5 20.5 169 45.5H154Z"/><path fill="#004785" d="M199 0H218V57H237V73H199Z"/><path fill="#004785" fill-rule="evenodd" d="M237 0H267C284 0 299.5 14 299.5 36.5 299.5 59 284 73 267 73H237ZM255 15.5H262C274 15.5 280 23 280 35.5 280 48 274 55.5 262 55.5H255Z"/><path fill="#004785" d="M302 0H343V16H321V28H341V44H321V57H343V73H302Z"/><path fill="#004785" d="M348 0H366V57H389V73H348Z"/><path fill="#ED1C24" d="M392.5 0.5V73H461Z"/><path fill="#004785" d="M393.5 0H460.5L427 36Z"/><text x="8" y="123" textLength="438" lengthAdjust="spacingAndGlyphs" font-family="Verdana, Public Sans, Arial, sans-serif" font-weight="700" font-size="44" fill="#ED1C24">Design Engineering</text></svg>`;

/* ---------------- navigation ---------------- */
export const NAV = [
  ['Capabilities', '/capabilities/'],
  ['Projects', '/projects/'],
  ['How we work', '/how-we-work/'],
  ['Prequalification', '/prequalification/'],
  ['About', '/about/'],
  ['Careers', '/careers/'],
];
export const CTA_TENDER = '/contact/#tender';

export function breadcrumbs(items) {
  if (!items || !items.length) return '';
  const all = [['Home', '/'], ...items];
  return `<nav class="crumbs" aria-label="Breadcrumb"><ol>${list(all, ([t, u], i) => `<li>${i === all.length - 1 ? `<span aria-current="page">${esc(t)}</span>` : `<a href="${u}">${esc(t)}</a>`}</li>`)}</ol></nav>`;
}
export function breadcrumbSchema(items) {
  const all = [['Home', '/'], ...items];
  return { '@type': 'BreadcrumbList', itemListElement: all.map(([t, u], i) => ({ '@type': 'ListItem', position: i + 1, name: t, item: absUrl(u) })) };
}
export const origin = () => C.site.domain.value.replace(/\/$/, '');
export const absUrl = (u) => origin() + u;

/* ---------------- layout ---------------- */
export function layout(pg) {
  const s = C.site;
  const title = pg.title;
  const canonical = absUrl(pg.path);
  const robots = C.P || pg.noindex ? '<meta name="robots" content="noindex,nofollow">' : '';
  const schema = pg.schema ? `<script type="application/ld+json">${JSON.stringify({ '@context': 'https://schema.org', '@graph': [].concat(pg.schema) }).replace(/</g, '\\u003c')}</script>` : '';
  const ogImg = pg.ogImage || '/img/og-default.png';
  const cur = (u) => (pg.path.startsWith(u) ? ' aria-current="page"' : '');
  const previewBar = C.P ? `<div class="preview-bar"><div class="wrap"><span>DRAFT PREVIEW – shows [ADD] / [CONFIRM] items. Not for publication.</span><a href="/design-system/">Design system</a></div></div>` : '';
  const turnstile = pg.forms && s.turnstileSiteKey ? '<script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer></script>' : '';
  return `<!DOCTYPE html>
<html lang="en-GB">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(pg.description)}">
${robots}
<link rel="canonical" href="${canonical}">
<meta property="og:type" content="${pg.ogType || 'website'}">
<meta property="og:site_name" content="${esc(s.legalName)}">
<meta property="og:title" content="${esc(pg.ogTitle || pg.title)}">
<meta property="og:description" content="${esc(pg.description)}">
<meta property="og:url" content="${canonical}">
<meta property="og:image" content="${absUrl(ogImg)}">
<meta name="twitter:card" content="summary_large_image">
<meta name="theme-color" content="#002060">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="preload" href="/fonts/barlow-condensed-700.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="/fonts/public-sans.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="/css/site.css">
${pg.extraHead || ''}
${schema}
<script>document.documentElement.className+=' js'</script>
<script src="/js/site.js" defer></script>
${turnstile}
</head>
<body data-page="${esc(pg.type || 'page')}"${pg.bodyAttrs || ''}>
<a class="skip" href="#main">Skip to content</a>
${previewBar}
<header class="site-header" id="top">
  <div class="wrap">
    <a class="brand" href="/">${logo()}</a>
    <nav class="nav" aria-label="Main">${list(NAV, ([t, u]) => `<a href="${u}"${cur(u)}>${t}</a>`)}</nav>
    <div class="header-actions">
      <button class="icon-btn" type="button" data-search-open aria-label="Search the site (shortcut: /)">${icon('search', '')}</button>
      <a class="btn btn-primary btn-sm" href="${CTA_TENDER}" data-track="cta_tender_header">Send a tender package</a>
      <button class="icon-btn menu-btn" type="button" data-menu-open aria-expanded="false" aria-controls="menu-sheet" aria-label="Open menu">${icon('menu', '')}</button>
    </div>
  </div>
</header>
<div class="sheet" id="menu-sheet" hidden role="dialog" aria-modal="true" aria-label="Menu">
  <div class="sheet-top"><a class="brand logo-plate" href="/">${logo()}</a><button class="icon-btn" type="button" data-menu-close aria-label="Close menu">${icon('close', '')}</button></div>
  <nav aria-label="Main (mobile)">${list(NAV, ([t, u]) => `<a href="${u}"${cur(u)}>${t}</a>`)}<a href="/contact/">Contact</a></nav>
  <div class="sheet-cta"><a class="btn btn-primary" href="${CTA_TENDER}">Send a tender package</a></div>
</div>
<main id="main">
${pg.body}
</main>
${footer()}
<dialog class="search-dialog" id="search" aria-label="Search">
  <form role="search" method="dialog"><label class="sr-only" for="q">Search projects, services, disciplines, documents and jobs</label><input id="q" type="search" placeholder="Search projects, services, disciplines, jobs…" autocomplete="off"><button class="close" value="close" type="submit">ESC</button></form>
  <ul class="search-results" id="search-results" aria-live="polite"></ul>
</dialog>
<div class="consent" id="consent" hidden role="region" aria-label="Cookie consent">
  <p><strong>Analytics cookies.</strong> We use privacy-friendly analytics to see which pages help visitors. Nothing non-essential runs until you choose. <a href="/cookies/">Cookie notice</a></p>
  <div class="btn-row"><button class="btn btn-primary btn-sm" type="button" data-consent="yes">Accept analytics</button><button class="btn btn-secondary btn-sm" type="button" data-consent="no">Essential only</button></div>
</div>
<script type="application/json" id="site-config">${JSON.stringify({ analytics: s.analytics, preview: C.P, endpoint: s.formEndpoint }).replace(/</g, '\\u003c')}</script>
</body>
</html>`;
}

function footer() {
  const s = C.site;
  const bd = C.people.filter((p) => p.bd && (p.consent || C.P));
  const a = s.address;
  const addr = fullAddress(a);
  return `<footer class="site-footer on-dark">
  <div class="wrap">
    <div class="foot-grid">
      <div>
        <a class="brand logo-plate" href="/" style="display:inline-flex">${logo('VALDEL Design Engineering')}</a>
        <p style="margin-top:1rem">${esc(s.legalName)}<br>${esc(addr)} ${a.confirmed ? '' : ADD('full office address')}</p>
        <p>${has(s.phone) ? `<a href="tel:${esc(s.phone.replace(/\s/g, ''))}" data-track="phone_click">${esc(s.phone)}</a>` : ADD('phone')}<br>
        ${has(s.linkedin) ? `<a href="${esc(s.linkedin)}" rel="noopener">LinkedIn</a>` : ADD('LinkedIn page URL')}</p>
        <span class="iso-mark">${esc(s.iso.standard)} certified ${has(s.iso.certificateNumber) ? `· Cert. ${esc(s.iso.certificateNumber)}` : ADD('certificate no.')}</span>
        ${C.P ? `<p>${ADD('official vector logo file (SVG redrawn from supplied PNG shown)')}</p>` : ''}
      </div>
      <div>
        <h2>What we engineer</h2>
        <ul>${list(C.assets, (x) => `<li><a href="/capabilities/${x.slug}/">${esc(x.short)}</a></li>`)}</ul>
      </div>
      <div>
        <h2>Services</h2>
        <ul>${list(C.services, (x) => `<li><a href="/services/${x.slug}/">${esc(x.short)}</a></li>`)}<li><a href="/disciplines/">Disciplines</a></li></ul>
      </div>
      <div>
        <h2>Contact</h2>
        <ul>
          <li><a href="${CTA_TENDER}">Send a tender package</a></li>
          <li><a href="/services/pre-bid/#request">Request pre-bid support</a></li>
          ${list(bd, (p) => `<li>${esc(p.name)}, ${esc(p.role)}<br><a href="mailto:${esc(p.email)}" data-track="email_click">${esc(p.email)}</a> ${p.consent ? '' : CONFIRM('show publicly?')}</li>`)}
          <li>Careers: <a href="mailto:${esc(s.careersEmail)}" data-track="email_click">${esc(s.careersEmail)}</a></li>
        </ul>
        <h2 style="margin-top:1.5rem">Valdel Group</h2>
        <ul>
          <li><a href="${esc(s.groupUrl)}" rel="noopener">Valdel Group</a></li>
          <li>Onshore / downstream engineering → <a href="${esc(s.onshoreUrl)}" rel="noopener">${esc(s.onshoreName)}</a></li>
        </ul>
      </div>
    </div>
    <div class="foot-base">
      <span>© ${new Date().getFullYear()} ${esc(s.legalName)}. ${esc(s.brandPromise)}</span>
      <ul><li><a href="/privacy/">Privacy</a></li><li><a href="/terms/">Terms</a></li><li><a href="/cookies/">Cookies</a></li><li><button class="btn-link" style="color:#fff" type="button" data-consent-open>Cookie settings</button></li><li><a href="/sitemap.xml">Sitemap</a></li></ul>
    </div>
  </div>
</footer>`;
}

/* ---------------- components ---------------- */
export function pageHero({ crumbs, eyebrow, h1, lead, aside = '', extra = '' }) {
  return `<section class="page-hero"><div class="wrap">${breadcrumbs(crumbs)}
  <div class="${aside ? 'page-hero-grid' : ''}"><div>${eyebrow ? `<p class="eyebrow">${eyebrow}</p>` : ''}<h1>${h1}</h1>${lead ? `<p class="lead">${lead}</p>` : ''}${extra}</div>${aside}</div></div></section>`;
}

export function ctaBand(heading, text, primary = ['Send a tender package', CTA_TENDER], secondary = null) {
  return `<section class="cta-band"><div class="wrap band"><div><h2>${heading}</h2>${text ? `<p>${text}</p>` : ''}</div><div class="btn-row"><a class="btn btn-primary" href="${primary[1]}" data-track="cta">${esc(primary[0])}</a>${secondary ? `<a class="btn btn-secondary" href="${secondary[1]}">${esc(secondary[0])}</a>` : ''}</div></div></section>`;
}

export function projectCard(p, h = 'h3') {
  const tags = [
    ...p.assets.map((a) => asset(a)?.short),
    ...p.services.map((s) => service(s)?.short),
  ].filter(Boolean);
  const status = has(p.status) ? `<span class="tag tag-status-${esc(p.status.replace(/\s+/g, '-'))}">${esc(p.status)}</span>` : '';
  const unpub = !p.publish && p.status !== 'award pending' ? `<span class="ph">NOT PUBLISHED</span>` : '';
  return `<article class="card" data-project data-asset="${esc(p.assets.join(' '))}" data-service="${esc(p.services.join(' '))}" data-region="${esc(p.region)}" data-clienttype="${esc(p.clientType)}" data-year="${esc(p.year)}" data-status="${esc(p.status)}" data-software="${esc(p.software.join('|'))}">
  <div class="card-meta">${status}${list(tags, (t) => `<span class="tag">${esc(t)}</span>`)}${unpub}</div>
  <${h}><a href="${projUrl(p)}">${projTitle(p)}</a></${h}>
  <p>${epcName(p)}${has(p.region) ? ` · ${esc(p.region)}` : ''}</p>
  <p class="card-scope">${esc(p.scope)}</p>
</article>`;
}

export const relatedProjects = (pred) => C.projects.filter(pred).sort((a, b) => a.order - b.order);

export function projectsSection(items, heading = 'Related projects', emptyText = '') {
  if (!items.length) return emptyText ? `<section class="section section--tight"><div class="wrap"><h2>${heading}</h2><p class="muted">${emptyText}</p></div></section>` : '';
  return `<section class="section section--tight section--grey"><div class="wrap"><div class="section-head"><h2>${heading}</h2><a class="link-arrow" href="/projects/">All projects</a></div><div class="cards cards-3">${list(items, (p) => projectCard(p))}</div></div></section>`;
}

/* ---------------- forms ---------------- */
const REGIONS = ['Middle East', 'India / South Asia', 'Southeast Asia', 'East Asia', 'Australia', 'Europe', 'Africa', 'Americas / Caribbean', 'Other'];
const ACCEPT = '.pdf,.dwg,.dxf,.xlsx,.xls,.docx,.doc,.zip';

const field = (id, label, input, { opt = false, hint = '', full = false } = {}) =>
  `<div class="field${full ? ' full' : ''}"><label for="${id}">${label}${opt ? ' <span class="opt">(optional)</span>' : ''}</label>${hint ? `<span class="hint" id="${id}-hint">${hint}</span>` : ''}${input}<span class="err" id="${id}-err"></span></div>`;
const text = (id, name, { type = 'text', req = false, auto = '', hint = false, extra = '' } = {}) =>
  `<input id="${id}" name="${name}" type="${type}"${req ? ' required aria-required="true"' : ''}${auto ? ` autocomplete="${auto}"` : ''} aria-describedby="${id}-err${hint ? ` ${id}-hint` : ''}"${extra}>`;

function common(type, ctx = '') {
  const s = C.site;
  return `<input type="hidden" name="form_type" value="${type}"><input type="hidden" name="context" value="${esc(ctx)}"><input type="hidden" name="page_url" value="">
  <div class="hp" aria-hidden="true"><label for="${type}-website">Leave this field empty</label><input id="${type}-website" name="website" type="text" tabindex="-1" autocomplete="off"></div>
  ${s.turnstileSiteKey ? `<div class="full cf-turnstile" data-sitekey="${esc(s.turnstileSiteKey)}"></div>` : C.P ? `<div class="full">${ADD('Cloudflare Turnstile site key (spam protection)')}</div>` : ''}`;
}
const status = () => `<div class="full form-status" role="status" aria-live="polite" hidden></div>`;
const privacyNote = (extra = '') => `<p class="full notice">We use these details only to reply to this enquiry and to manage it in our business-development records. ${extra}See our <a href="/privacy/">privacy notice</a> (India DPDP Act 2023).</p>`;

export function tenderForm({ id = 'tender', type = 'tender', ctxAsset = '', ctxService = '', submit = 'Send tender package', prebid = false } = {}) {
  const p = id;
  return `<form class="form" id="${p}-form" data-form="${type}" action="${C.site.formEndpoint}" method="post" enctype="multipart/form-data" novalidate>
  ${common(type, [ctxAsset, ctxService].filter(Boolean).join(','))}
  ${field(`${p}-name`, 'Your name', text(`${p}-name`, 'name', { req: true, auto: 'name' }))}
  ${field(`${p}-company`, 'Company', text(`${p}-company`, 'company', { req: true, auto: 'organization' }))}
  ${field(`${p}-email`, 'Business e-mail', text(`${p}-email`, 'email', { type: 'email', req: true, auto: 'email' }), { full: false })}
  ${prebid
    ? field(`${p}-bid`, 'Bid due date', text(`${p}-bid`, 'bid_due_date', { type: 'date', hint: true }), { opt: true, hint: 'So we can plan back from your submission date.' })
    : field(`${p}-project`, 'Project or tender name', text(`${p}-project`, 'project'), { opt: true })}
  ${field(`${p}-msg`, prebid ? 'What do you need for the bid?' : 'Scope and message', `<textarea id="${p}-msg" name="message" required aria-required="true" aria-describedby="${p}-msg-err ${p}-msg-hint"></textarea>`, { full: true, hint: prebid ? 'For example: configuration and weight estimate for two 4-legged jackets, MTO for pricing.' : 'What is the asset, the scope and the key dates?' })}
  <details class="full" ${prebid ? 'open' : ''}><summary class="link-arrow" style="cursor:pointer">Add project details (optional)</summary>
  <div class="form" style="margin-top:1rem">
    ${field(`${p}-asset`, 'Asset type', `<select id="${p}-asset" name="asset" aria-describedby="${p}-asset-err"><option value="">Select…</option>${list(C.assets, (a) => `<option value="${a.slug}"${a.slug === ctxAsset ? ' selected' : ''}>${esc(a.name)}</option>`)}<option value="other">Other</option></select>`, { opt: true })}
    ${field(`${p}-region`, 'Region', `<select id="${p}-region" name="region" aria-describedby="${p}-region-err"><option value="">Select…</option>${list(REGIONS, (r) => `<option>${r}</option>`)}</select>`, { opt: true })}
    <fieldset class="full field"><legend>Services <span class="opt">(optional)</span></legend><div class="checks">${list(C.services, (s) => `<label class="check"><input type="checkbox" name="services" value="${s.slug}"${s.slug === ctxService || (prebid && s.slug === 'pre-bid') ? ' checked' : ''}> ${esc(s.short)}</label>`)}</div></fieldset>
    ${field(`${p}-enduser`, 'End user / operator', text(`${p}-enduser`, 'end_user'), { opt: true })}
    ${prebid ? field(`${p}-project`, 'Project or tender name', text(`${p}-project`, 'project'), { opt: true }) : field(`${p}-bid`, 'Bid due date', text(`${p}-bid`, 'bid_due_date', { type: 'date' }), { opt: true })}
    ${field(`${p}-timeline`, 'Project timeline', text(`${p}-timeline`, 'timeline', { hint: true }), { opt: true, hint: 'e.g. award Q2, IFC by Q4' })}
    ${field(`${p}-scope`, 'Estimated scope', text(`${p}-scope`, 'est_scope', { hint: true }), { opt: true, hint: 'Man-hours or number of deliverables' })}
    ${field(`${p}-file`, 'Tender documents', `<input id="${p}-file" name="file" type="file" accept="${ACCEPT}" data-max-mb="100" aria-describedby="${p}-file-err ${p}-file-hint">`, { opt: true, hint: 'PDF, DWG, DXF, XLSX, DOCX or ZIP, up to 100 MB. Files are stored privately and only our BD team can open them.' })}
    ${field(`${p}-link`, 'Or a link to your document share', text(`${p}-link`, 'share_link', { type: 'url' }), { opt: true })}
    <label class="check full"><input type="checkbox" name="nda" value="yes"> NDA required before you share documents. We reply with our mutual NDA template first. ${has(C.site.ndaTemplateUrl) ? '' : ADD('mutual NDA template file')}</label>
  </div></details>
  <p class="full notice"><strong>Confidentiality.</strong> Everything you send is treated as confidential, used only to prepare our response and never shared outside VDE without your written consent.</p>
  ${privacyNote()}
  ${status()}
  <div class="full"><button class="btn btn-primary" type="submit">${esc(submit)}</button></div>
</form>`;
}

export function generalForm() {
  const p = 'general';
  return `<form class="form" id="general-form" data-form="general" action="${C.site.formEndpoint}" method="post" enctype="multipart/form-data" novalidate>
  ${common('general')}
  ${field(`${p}-name`, 'Your name', text(`${p}-name`, 'name', { req: true, auto: 'name' }))}
  ${field(`${p}-company`, 'Company', text(`${p}-company`, 'company', { req: true, auto: 'organization' }))}
  ${field(`${p}-email`, 'E-mail', text(`${p}-email`, 'email', { type: 'email', req: true, auto: 'email' }), { full: true })}
  ${field(`${p}-msg`, 'Message', `<textarea id="${p}-msg" name="message" required aria-required="true" aria-describedby="${p}-msg-err"></textarea>`, { full: true })}
  ${privacyNote()}
  ${status()}
  <div class="full"><button class="btn btn-primary" type="submit">Send message</button></div>
</form>`;
}

export function prequalForm() {
  const p = 'prequal';
  return `<form class="form" id="prequal-form" data-form="prequal" action="${C.site.formEndpoint}" method="post" enctype="multipart/form-data" novalidate>
  ${common('prequal')}
  ${field(`${p}-name`, 'Your name', text(`${p}-name`, 'name', { req: true, auto: 'name' }))}
  ${field(`${p}-company`, 'Company', text(`${p}-company`, 'company', { req: true, auto: 'organization' }))}
  ${field(`${p}-email`, 'Business e-mail', text(`${p}-email`, 'email', { type: 'email', req: true, auto: 'email' }), { full: true })}
  ${field(`${p}-msg`, 'Vendor registration or project it is for', `<textarea id="${p}-msg" name="message" style="min-height:5rem" aria-describedby="${p}-msg-err"></textarea>`, { full: true, opt: true })}
  ${privacyNote('We send the pack to this address. ')}
  ${status()}
  <div class="full"><button class="btn btn-primary" type="submit">Request the prequalification pack</button></div>
</form>`;
}


export function applyForm(job) {
  const p = 'apply';
  return `<form class="form" id="apply-form" data-form="job_apply" action="${C.site.formEndpoint}" method="post" enctype="multipart/form-data" novalidate>
  ${common('job_apply', job ? job.code : '')}
  ${field(`${p}-name`, 'Full name', text(`${p}-name`, 'name', { req: true, auto: 'name' }))}
  ${field(`${p}-email`, 'E-mail', text(`${p}-email`, 'email', { type: 'email', req: true, auto: 'email' }))}
  ${job || !C.jobs.length
    ? field(`${p}-position`, 'Position code', text(`${p}-position`, 'position', { req: !!job, extra: job ? ` value="${esc(job.code)}"` : '' }), { opt: !job })
    : field(`${p}-position`, 'Position', `<select id="${p}-position" name="position" aria-describedby="${p}-position-err"><option value="">Open application (no specific position)</option>${list(C.jobs, (j) => `<option value="${esc(j.code)}">${esc(j.code)} – ${esc(j.title)}</option>`)}</select>`, { opt: true })}
  ${field(`${p}-exp`, 'Years of offshore experience', text(`${p}-exp`, 'experience'), { opt: true })}
  ${field(`${p}-msg`, 'A short note', `<textarea id="${p}-msg" name="message" required aria-required="true" aria-describedby="${p}-msg-err"></textarea>`, { full: true })}
  <div class="full notice" id="${p}-consent-text"><strong>Personal data notice.</strong> Your CV and details are used only to assess your application for roles at ${esc(C.site.legalName)}. HR keeps them for up to 12 months and then deletes them. You can ask us to correct or delete your data at any time. See the <a href="/privacy/">privacy notice</a>.</div>
  <label class="check full"><input type="checkbox" name="consent" value="yes" required aria-required="true" aria-describedby="${p}-consent-text ${p}-consent-err"> I have read the notice and consent to VDE processing my CV for recruitment.</label>
  <span class="err full" id="${p}-consent-err"></span>
  ${field(`${p}-file`, 'CV', `<input id="${p}-file" name="file" type="file" accept=".pdf,.doc,.docx" data-max-mb="10" required aria-required="true" aria-describedby="${p}-file-err ${p}-file-hint">`, { full: true, hint: 'PDF or Word, up to 10 MB.' })}
  ${status()}
  <div class="full"><button class="btn btn-primary" type="submit">Apply</button></div>
</form>`;
}
