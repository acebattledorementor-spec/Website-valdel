// Page templates. Each function returns {path, title, description, body, ...} for layout().
import {
  C, esc, has, list, asset, service, discipline, ADD, CONFIRM, ADDblock, REVIEW, confirmed, valOr,
  epcName, endUserName, projTitle, projTitleText, projUrl, icon, pageHero, ctaBand, projectCard,
  relatedProjects, projectsSection, tenderForm, generalForm, prequalForm, applyForm,
  breadcrumbSchema, absUrl, origin, CTA_TENDER, logo, fullAddress,
} from './lib.mjs';

const S = () => C.site;
const orgId = () => absUrl('/#organization');
const COMMERCIAL = [
  ['Lump sum', 'A fixed price for a defined scope and deliverables list.'],
  ['Unit rate', 'A rate per deliverable or per engineering man-hour, for scopes that grow or are not yet fixed.'],
  ['Task force', 'VDE engineers deputed to your office, or working on your systems from Bengaluru.'],
];

/* ---------------- shared bits ---------------- */
function counters(asNote = true) {
  const s = S();
  const items = s.counters.items.filter((c) => c.confirmed || C.P);
  if (!items.length) return '';
  return `<section class="proof" aria-label="VDE in numbers"><div class="wrap"><ul class="proof-list">${list(items, (c) => `<li><span class="proof-num num">${esc(c.value)}</span><span class="proof-label">${esc(c.label)}${has(c.note) ? ` (${esc(c.note)})` : ''} ${c.confirmed ? '' : CONFIRM('figure before publishing')}</span></li>`)}</ul>
  ${asNote ? `<p class="proof-note">Source: VDE records, as of ${has(s.counters.asOf) ? esc(s.counters.asOf) : ADD('month and year')}.</p>` : ''}</div></section>`;
}

// Hero figure: a captioned, credited photo when content provides one; otherwise a placeholder (preview only).
function heroFigure(img, caption, label = 'model render') {
  if (img && img.src) {
    const lic = img.licenseUrl ? `<a href="${esc(img.licenseUrl)}" rel="noopener license">${esc(img.license)}</a>` : esc(img.license);
    const credit = img.credit ? ` Photo: <a href="${esc(img.sourceUrl)}" rel="noopener">${esc(img.credit)}</a>${img.license ? `, ${lic}` : ''}.` : '';
    return `<figure class="figure-sheet"><img src="${esc(img.src)}" alt="${esc(img.alt)}" width="${img.width}" height="${img.height}" fetchpriority="high" decoding="async"><figcaption><span>FIG.</span><span>${esc(img.caption)}${credit}</span></figcaption></figure>`;
  }
  if (!C.P) return '';
  return `<figure class="figure-sheet"><div class="sheet-area">${ADD(`real VDE ${label} (E3D / S3D / SACS / Tekla), cleared for publication, with caption and alt text`)}</div><figcaption><span>FIG.</span><span>${esc(caption)}</span></figcaption></figure>`;
}
function mediaPlaceholder(label) {
  return C.P ? `<div class="media-ph">${ADD(label)}</div>` : '';
}
// Office photo: shown when the file exists; people are visible, so production needs consent ticked.
function officeFigure() {
  const o = S().officePhoto;
  if (!o) return '';
  if (!C.officePhotoExists) return ADD(`office photo: save it as src/static${o.src}`);
  if (!o.consent && !C.P) return '';
  return `<figure style="margin:1.5rem 0 0"><img src="${esc(o.src)}" alt="${esc(o.alt)}" width="${o.width}" height="${o.height}" loading="lazy" decoding="async" style="width:100%;height:auto;aspect-ratio:${o.width}/${o.height};object-fit:cover"><figcaption class="muted" style="font-size:var(--t-xs);margin-top:.5rem">${esc(o.caption)} ${o.consent ? '' : CONFIRM('consent of the people shown, before publishing')}</figcaption></figure>`;
}
const chipsLinks = (items) => `<ul class="chips">${list(items, ([t, u]) => `<li>${u ? `<a class="tag" href="${u}">${esc(t)}</a>` : `<span class="tag">${esc(t)}</span>`}</li>`)}</ul>`;

function orgSchema() {
  const s = S();
  const a = s.address;
  const org = {
    '@type': ['Organization', 'ProfessionalService'],
    '@id': orgId(),
    name: s.legalName,
    alternateName: 'VDE',
    url: origin() + '/',
    logo: absUrl('/img/logo.svg'),
    description: s.heroSub,
    foundingDate: String(s.formed),
    parentOrganization: { '@type': 'Organization', name: s.groupName, url: s.groupUrl },
    address: { '@type': 'PostalAddress', streetAddress: a.street || undefined, addressLocality: 'Bengaluru', addressRegion: a.region, postalCode: a.postcode || undefined, addressCountry: a.countryCode },
    areaServed: s.markets.confirmed ? s.markets.items : undefined,
    knowsAbout: C.assets.map((x) => x.name).concat(C.services.map((x) => x.name)),
    hasCredential: { '@type': 'EducationalOccupationalCredential', credentialCategory: 'certification', name: s.iso.standard },
    contactPoint: [{ '@type': 'ContactPoint', contactType: 'sales', email: s.enquiryEmail || undefined, telephone: s.phone || undefined, url: absUrl('/contact/'), availableLanguage: 'en' },
      { '@type': 'ContactPoint', contactType: 'human resources', email: s.careersEmail }],
    sameAs: s.linkedin ? [s.linkedin] : undefined,
  };
  return org;
}

/* ================= HOME ================= */
export function home() {
  const s = S();
  const fig = heroFigure(s.heroImage, 'Offshore jacket and topside 3D model – VDE');
  const featured = C.projects.filter((p) => p.featured).sort((a, b) => a.order - b.order).slice(0, 3);
  const clients = s.clients.filter((c) => c.permission || C.P);
  const jobs = C.jobs;
  const steps = [
    ['Concept', '/services/concept-feed/'], ['Pre-bid', '/services/pre-bid/'], ['FEED', '/services/concept-feed/'], ['Detail', '/services/detail-engineering/'],
    ['Procurement & expediting', '/services/procurement-expediting/'], ['Fabrication support', '/services/yard-support/'], ['Installation', '/services/installation-engineering/'], ['As-built', '/services/as-built-3d/'],
  ];
  const doors = [
    { who: 'EPC project or engineering manager', h: 'I need engineering capacity', u: '/capabilities/', p: 'See what we engineer by asset and service, the projects behind it, and send your tender package.', sub: [['Send a tender package', CTA_TENDER]] },
    { who: 'Procurement or vendor registration', h: 'I’m prequalifying vendors', u: '/prequalification/', p: 'ISO 9001 certificate, organisation, HSE, insurance and statutory details in one pack.', sub: [['Request the pack', '/prequalification/#pack']] },
    { who: 'End user or operator', h: 'I operate offshore assets', u: '/services/verification/', p: 'Independent design verification, brownfield modifications and weight control.', sub: [['Brownfield', '/capabilities/brownfield/'], ['Weight control', '/services/weight-control/']] },
    { who: 'Engineer or designer', h: 'I want to join VDE', u: '/careers/', p: `Open positions, the software we use and how we are growing to ${esc(s.team.growthTarget)} engineers by ${esc(s.team.growthBy)}.`, sub: [] },
  ];
  const why = [
    { h: 'Senior offshore team', e: `${s.team.seniorShare} of the offshore team has ${s.team.seniorDefinition}`, p: 'Experienced engineers set the design basis and check the work. That is what keeps rework off your schedule.', l: ['Leadership', '/about/leadership/'] },
    { h: 'Every discipline under one roof', e: `${C.disciplines.length} disciplines in Bengaluru, from process to pipelines`, p: 'Process, mechanical, piping, E&I, telecom, structural, pipelines and 3D layout work from one model and one deliverables list.', l: ['Disciplines', '/disciplines/'] },
    { h: 'QMS-controlled delivery', e: `${s.iso.standard} · checker ≠ preparer · change notes validated within 2 working days`, p: 'Every deliverable is checked by someone other than its preparer, inter-discipline checked and issued by transmittal.', l: ['How we work', '/how-we-work/'] },
    { h: 'Fast mobilisation for pre-bid windows', e: `Pre-bid engineering for jackets and pipelines in a live tender`, p: 'We staff tender support at short notice, so your estimators get engineered weights and MTOs before the bid is due.', l: ['Pre-bid engineering', '/services/pre-bid/'] },
  ];
  const body = `
<section class="hero on-dark">
  <div class="wrap hero-grid${fig ? '' : ' no-media'}">
    <div>
      <p class="eyebrow">${esc(s.legalName)}</p>
      <h1>${esc(s.tagline)}</h1>
      <p class="lead">${esc(s.heroSub)}</p>
      <div class="btn-row">
        <a class="btn btn-primary" href="${CTA_TENDER}" data-track="cta_tender_hero">Send a tender package</a>
        <a class="btn btn-secondary" href="/downloads/VDE-Capability-Statement.pdf" data-track="download_capability" download>${icon('download', '')} Download capability statement</a>
      </div>
    </div>
    ${fig}
  </div>
</section>
${counters()}
<section class="section section--tight" aria-labelledby="doors-h">
  <div class="wrap">
    <h2 id="doors-h" class="sr-only">Find what you need</h2>
    <div class="doors">${list(doors, (d) => `<div class="door"><span class="who">${d.who}</span><h3><a href="${d.u}">${d.h}</a></h3><p>${d.p}</p><div class="sub">${list(d.sub, ([t, u]) => `<a class="link-arrow" href="${u}">${t}</a>`)}</div></div>`)}</div>
  </div>
</section>
<section class="section section--grey">
  <div class="wrap">
    <div class="section-head"><div><p class="eyebrow">What we engineer</p><h2>Six offshore asset types</h2></div><a class="link-arrow" href="/capabilities/">Capability matrix</a></div>
    <div class="cards cards-3">${list(C.assets, (a) => `<article class="card reveal">${icon(a.icon)}<h3><a href="/capabilities/${a.slug}/">${esc(a.name)}</a></h3><p>${esc(a.line)}</p><a class="link-arrow" href="/projects/?asset=${a.slug}">See projects</a></article>`)}</div>
  </div>
</section>
<section class="section">
  <div class="wrap">
    <div class="section-head"><div><p class="eyebrow">From tender to installation</p><h2>We join at any stage of your project</h2></div></div>
    <ol class="lifecycle">${list(steps, ([t, u], i) => `<li><a href="${u}"><span class="n">${String(i + 1).padStart(2, '0')}</span><span class="t">${t}</span></a></li>`)}</ol>
  </div>
</section>
<section class="section section--grey">
  <div class="wrap">
    <div class="section-head"><div><p class="eyebrow">Case studies</p><h2>Recent offshore projects</h2></div><a class="link-arrow" href="/projects/">All projects</a></div>
    <div class="cards cards-3">${list(featured, (p) => projectCard(p))}</div>
  </div>
</section>
${[['EPC', 'clients-epc-h', 'EPC contractors we work for'], ['End user', 'clients-eu-h', 'End users on our projects']].map(([type, id, heading], i) => {
  const group = clients.filter((c) => c.type === type);
  if (!group.length) return '';
  return `<section class="section section--tight${i ? ' section--grey' : ''}" aria-labelledby="${id}"><div class="wrap"><h2 id="${id}" class="eyebrow">${heading}</h2>
<ul class="logos">${list(group, (c) => `<li>${c.logo && c.permission ? `<img src="${esc(c.logo)}" alt="${esc(c.name)}" width="140" height="40" loading="lazy">` : `<span class="logo-text">${esc(c.name)}</span>`} ${c.permission ? '' : CONFIRM('written permission')}</li>`)}</ul>
</div></section>`;
}).join('')}
<section class="section">
  <div class="wrap">
    <div class="section-head"><div><p class="eyebrow">Why EPCs choose VDE</p><h2>Four things you can check</h2></div></div>
    <div class="why">${list(why, (w) => `<div class="reveal"><h3>${w.h}</h3><p class="evidence">${esc(w.e)} ${w.add ? ADD(w.add) : ''}</p><p>${w.p}</p><a class="link-arrow" href="${w.l[1]}">${w.l[0]}</a></div>`)}</div>
  </div>
</section>
<section class="section--grey"><div class="wrap band"><div><h2>Registering VDE as a vendor?</h2><p>Certificates, organisation, HSE, insurance and statutory details in one pack, e-mailed by our business development team on request.</p></div><a class="btn btn-secondary" href="/prequalification/#pack">Request the prequalification pack</a></div></section>
<section class="section section--navy on-dark">
  <div class="wrap band"><div><h2>We are growing to ${esc(s.team.growthTarget)} engineers by ${esc(s.team.growthBy)}</h2><p>${jobs.length ? `${jobs.length} open position${jobs.length > 1 ? 's' : ''} in Bengaluru.` : 'Offshore engineers and designers: see how to apply.'}</p></div><a class="btn btn-secondary" href="/careers/">See open positions</a></div>
</section>`;
  const site = { '@type': 'WebSite', '@id': absUrl('/#website'), url: origin() + '/', name: s.legalName, publisher: { '@id': orgId() } };
  return { path: '/', type: 'home', title: 'Offshore engineering for EPCs | Valdel Design Engineering', description: 'Offshore engineering for EPCs: jackets, wellhead and process platforms, FPSO topsides, subsea pipelines and offshore wind substations. ISO 9001:2015.', body, schema: [orgSchema(), site], search: 'home offshore engineering EPC' };
}

/* ================= CAPABILITIES ================= */
export function capabilities() {
  const vis = C.projects;
  const count = (a, s) => vis.filter((p) => p.assets.includes(a) && p.services.includes(s)).length;
  const crumbs = [['Capabilities', '/capabilities/']];
  const matrix = `<div class="matrix-tools no-print">
    <div class="field"><label for="mx-asset">Asset</label><select id="mx-asset" data-matrix-filter="asset"><option value="">All assets</option>${list(C.assets, (a) => `<option value="${a.slug}">${esc(a.name)}</option>`)}</select></div>
    <div class="field"><label for="mx-service">Service</label><select id="mx-service" data-matrix-filter="service"><option value="">All services</option>${list(C.services, (s) => `<option value="${s.slug}">${esc(s.short)}</option>`)}</select></div>
  </div>
  <div class="table-wrap"><table class="matrix" id="matrix"><caption class="sr-only">Capability matrix: asset types (rows) by services (columns). Numbers are case studies; links open them.</caption>
  <thead><tr><th scope="col"><span class="sr-only">Asset</span></th>${list(C.services, (s) => `<th scope="col" data-col="${s.slug}"><a href="/services/${s.slug}/">${esc(s.short)}</a></th>`)}</tr></thead>
  <tbody>${list(C.assets, (a) => `<tr data-row="${a.slug}"><th scope="row"><a href="/capabilities/${a.slug}/">${esc(a.name)}</a></th>${list(C.services, (s) => {
    const n = count(a.slug, s.slug);
    if (n) return `<td class="cell-proj" data-col="${s.slug}"><a href="/projects/?asset=${a.slug}&amp;service=${s.slug}" aria-label="${n} case ${n > 1 ? 'studies' : 'study'}: ${esc(s.short)} on ${esc(a.short)}">${n}</a></td>`;
    if (s.assets.includes(a.slug)) return `<td class="cell-cap" data-col="${s.slug}"><a href="/services/${s.slug}/" aria-label="${esc(s.short)} offered for ${esc(a.short)}">●</a></td>`;
    return `<td class="cell-none" data-col="${s.slug}"><span aria-label="not offered">–</span></td>`;
  })}</tr>`)}</tbody></table></div>
  <div class="legend"><span><i class="sw sw-proj"></i> Number = case studies (opens them)</span><span>● = service offered, no case study published yet</span><span>– = not a typical scope</span></div>
  `;
  const body = `${pageHero({ crumbs, eyebrow: 'Capabilities', h1: 'What we engineer, and how', lead: 'Six offshore asset types, nine services and ten disciplines. Start from an asset or a service below, or use the capability matrix at the end of the page to see which projects sit behind each combination.' })}
<section class="section section--grey"><div class="wrap"><div class="section-head"><h2>By asset</h2></div><div class="cards cards-3">${list(C.assets, (a) => `<article class="card">${icon(a.icon)}<h3><a href="/capabilities/${a.slug}/">${esc(a.name)}</a></h3><p>${esc(a.line)}</p></article>`)}</div></div></section>
<section class="section"><div class="wrap"><div class="section-head"><h2>By service</h2><a class="link-arrow" href="/disciplines/">By discipline</a></div><div class="cards">${list(C.services, (s) => `<article class="card">${icon(s.icon)}<h3><a href="/services/${s.slug}/">${esc(s.name)}</a></h3><p>${esc(s.line)}</p></article>`)}</div></div></section>
<section class="section section--grey"><div class="wrap"><div class="section-head"><h2>Capability matrix</h2><p>Assets (rows) by services (columns). A number opens the case studies behind it.</p></div>${matrix}</div></section>
${ctaBand('Have a scope that fits?', 'Send the tender package and a VDE engineer will reply with questions, a team and a plan.')}`;
  return { path: '/capabilities/', type: 'capabilities', title: 'Offshore engineering capabilities: assets × services | VDE', description: 'Capability matrix of offshore asset types and engineering services, linked to case studies: jackets, topsides, FPSO, pipelines, brownfield, wind.', body, schema: [breadcrumbSchema(crumbs)], search: 'capability matrix assets services' };
}

export function assetPage(a) {
  const crumbs = [['Capabilities', '/capabilities/'], [a.name, `/capabilities/${a.slug}/`]];
  const projs = relatedProjects((p) => p.assets.includes(a.slug));
  const svcs = C.services.filter((s) => s.assets.includes(a.slug));
  const body = `${pageHero({ crumbs, eyebrow: 'What we engineer', h1: esc(a.name), lead: esc(a.intro), aside: heroFigure(a.image, `${a.name} – VDE model`), extra: `<div class="btn-row" style="margin-top:1.5rem"><a class="btn btn-primary" href="/contact/?asset=${a.slug}#tender">Send a tender package</a></div>` })}
<section class="section"><div class="wrap split">
  <div class="prose">
    <h2>What we deliver</h2>
    <ul class="ticks cols-2">${list(a.deliverables, (d) => `<li>${esc(d)}</li>`)}</ul>
    <h2>Services for this asset</h2>
    ${chipsLinks(svcs.map((s) => [s.name, `/services/${s.slug}/`]))}
    <h2>Disciplines involved</h2>
    ${chipsLinks(a.disciplines.map((d) => [discipline(d).name, `/disciplines/${d}/`]))}
  </div>
  <aside class="facts sticky-aside" aria-labelledby="spec-h"><h2 id="spec-h">Codes and tools</h2>
    <dl><dt>Codes</dt><dd>${esc(a.codes.join(', '))}, client standards ${CONFIRM('codes list with HODs')}</dd><dt>Software</dt><dd>${esc(a.tools.join(', '))}</dd></dl>
  </aside>
</div></section>
${projectsSection(projs, `${esc(a.short)} case studies`, 'No case study published yet for this asset.')}
<section class="section"><div class="wrap"><div class="faq measure"><h2>Questions buyers ask</h2>${list(a.faq, (f) => `<details><summary>${esc(f.q)}</summary><p>${esc(f.a)}</p></details>`)}</div>${C.P ? REVIEW('Draft copy', ['Review deliverables and FAQ answers with the discipline HODs.']) : ''}</div></section>
${ctaBand(`Send a tender package for a ${esc(a.short.toLowerCase())} scope`, 'Attach the ITB or scope of work. We reply with questions, a team and a plan.', ['Send a tender package', `/contact/?asset=${a.slug}#tender`], ['Request pre-bid support', '/services/pre-bid/#request'])}`;
  const faq = { '@type': 'FAQPage', mainEntity: a.faq.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })) };
  const svc = { '@type': 'Service', name: `${a.name} engineering`, serviceType: a.name, provider: { '@id': orgId() }, description: a.intro, url: absUrl(`/capabilities/${a.slug}/`) };
  return { path: `/capabilities/${a.slug}/`, type: 'asset', title: a.seoTitle, description: a.seoDescription, body, schema: [breadcrumbSchema(crumbs), svc, faq], search: `${a.name} ${a.line} ${a.tools.join(' ')}`, kind: 'Asset' };
}

/* ================= SERVICES ================= */
export function servicesIndex() {
  const crumbs = [['Services', '/services/']];
  const body = `${pageHero({ crumbs, eyebrow: 'Services', h1: 'Engineering services from tender to as-built', lead: 'Each service can be bought on its own or combined. Most EPCs start with pre-bid engineering.' })}
<section class="section"><div class="wrap"><div class="cards">${list(C.services, (s) => `<article class="card">${icon(s.icon)}<h2 class="h3" style="font-size:var(--h5)"><a href="/services/${s.slug}/" style="text-decoration:none">${esc(s.name)}</a></h2><p>${esc(s.line)}</p></article>`)}</div>
<p style="margin-top:2rem">We also depute engineers to the client's office as a task force ${CONFIRM('task-force wording')}. See commercial models on each service page.</p></div></section>
${ctaBand('Not sure which service fits?', 'Tell us the asset and the stage. We will tell you how we would staff it.')}`;
  return { path: '/services/', type: 'services', title: 'Offshore engineering services | VDE', description: 'Pre-bid, concept and FEED, detail, installation, yard support, procurement and expediting, verification, as-built and 3D, and weight control.', body, schema: [breadcrumbSchema(crumbs)], search: 'services' };
}

export function servicePage(s) {
  const crumbs = [['Services', '/services/'], [s.name, `/services/${s.slug}/`]];
  const projs = relatedProjects((p) => p.services.includes(s.slug));
  const form = s.flagship ? `<section class="section section--grey" id="request"><div class="wrap split"><div class="form-card"><h2>Request pre-bid support</h2><p class="muted">Give us the bid due date and what your estimators need. Required fields: name, company, e-mail and message.</p>${tenderForm({ id: 'prebid', type: 'prebid', ctxService: 'pre-bid', submit: 'Request pre-bid support', prebid: true })}</div>
  <aside class="panel"><h3>What happens next</h3><ol><li>A VDE engineer reads the package and replies. ${confirmed(S().responseCommitment, 'response-time commitment')}</li><li>We confirm the deliverables and dates we can meet before your bid due date.</li><li>You get a named lead engineer and a short plan.</li></ol>${has(S().calendarUrl) ? `<a class="link-arrow" href="${esc(S().calendarUrl)}" rel="noopener">Book a call</a>` : ADD('calendar booking link')}</aside></div></section>` : '';
  const body = `${pageHero({ crumbs, eyebrow: s.flagship ? 'Flagship service' : 'Service', h1: esc(s.name), lead: esc(s.line), extra: `<div class="btn-row" style="margin-top:1.5rem"><a class="btn btn-primary" href="${s.flagship ? '#request' : `/contact/?service=${s.slug}#tender`}">${s.flagship ? 'Request pre-bid support' : 'Send a tender package'}</a></div>` })}
<section class="section"><div class="wrap split">
  <div class="prose">
    <h2>When EPCs use it</h2>
    <p class="trigger">${esc(s.trigger)}</p>
    <h2>Typical deliverables</h2>
    <ul class="ticks">${list(s.deliverables, (d) => `<li>${esc(d)}</li>`)}</ul>
    <p><strong>Turnaround:</strong> ${valOr(s.turnaround, `typical turnaround for ${s.short.toLowerCase()} (e.g. weeks from kick-off)`)}</p>
    <h2>How we run it</h2>
    <ol class="steps">${list(s.howWeRun, (h) => `<li><span>${esc(h)}</span></li>`)}</ol>
    ${C.P ? REVIEW('Draft copy', ['Confirm the "How we run it" steps with the service lead.']) : ''}
    <h2>Commercial models</h2>
    <div class="table-wrap"><table><thead><tr><th scope="col">Model</th><th scope="col">How it works</th></tr></thead><tbody>${list(COMMERCIAL, ([m, d]) => `<tr><th scope="row">${m}</th><td>${d}${m === 'Task force' ? ' ' + CONFIRM('task-force wording') : ''}</td></tr>`)}</tbody></table></div>
  </div>
  <aside class="facts sticky-aside" aria-labelledby="svc-assets-h"><h2 id="svc-assets-h">Assets</h2>
    <dl>${list(s.assets, (a) => `<dt>${icon(asset(a).icon, 'icon')}</dt><dd><a href="/capabilities/${a}/">${esc(asset(a).name)}</a></dd>`)}</dl>
  </aside>
</div></section>
${form}
${projectsSection(projs, `${esc(s.short)} projects`, 'No case study published yet for this service.')}
${ctaBand(s.flagship ? 'Tender due soon?' : `Need ${esc(s.short.toLowerCase())} engineering?`, 'Send the package. We reply with questions, a team and a plan.', s.flagship ? ['Request pre-bid support', '#request'] : ['Send a tender package', `/contact/?service=${s.slug}#tender`])}`;
  const svc = { '@type': 'Service', name: s.name, serviceType: s.name, description: s.line, provider: { '@id': orgId() }, url: absUrl(`/services/${s.slug}/`), areaServed: S().markets.confirmed ? S().markets.items : undefined };
  return { path: `/services/${s.slug}/`, type: 'service', title: s.seoTitle, description: s.seoDescription, body, schema: [breadcrumbSchema(crumbs), svc], forms: s.flagship, search: `${s.name} ${s.line} ${s.deliverables.join(' ')}`, kind: 'Service' };
}

/* ================= DISCIPLINES ================= */
export function disciplinesIndex() {
  const crumbs = [['Disciplines', '/disciplines/']];
  const body = `${pageHero({ crumbs, eyebrow: 'Disciplines', h1: 'Ten disciplines in one Bengaluru office', lead: 'Each discipline has its own lead, works in one shared model and checks its interfaces with the others before anything is issued.' })}
<section class="section"><div class="wrap"><div class="table-wrap"><table class="spec"><thead><tr><th scope="col">Discipline</th><th scope="col">What we do</th><th scope="col">Tools</th><th scope="col"><span class="sr-only">Datasheet</span></th></tr></thead>
<tbody>${list(C.disciplines, (d) => `<tr><th scope="row"><a href="/disciplines/${d.slug}/">${esc(d.name)}</a></th><td>${esc(d.scope)}</td><td class="mono">${esc(d.tools.join(', '))}</td><td><a href="/downloads/VDE-Datasheet-${d.slug}.pdf" data-track="download_datasheet" download aria-label="${esc(d.name)} datasheet (PDF)">PDF</a></td></tr>`)}</tbody></table></div></div></section>
${ctaBand('Need one discipline, or all of them?', 'We take single-discipline scopes as well as full multi-discipline packages.')}`;
  return { path: '/disciplines/', type: 'disciplines', title: 'Engineering disciplines and software | VDE', description: 'Process, mechanical, piping, electrical, instrumentation, telecom, structural, pipelines, 3D layout and project controls, and the software each uses.', body, schema: [breadcrumbSchema(crumbs)], search: 'disciplines software' };
}

export function disciplinePage(d) {
  const crumbs = [['Disciplines', '/disciplines/'], [d.name, `/disciplines/${d.slug}/`]];
  const assets = C.assets.filter((a) => a.disciplines.includes(d.slug));
  const projs = relatedProjects((p) => p.disciplines.includes(d.slug));
  const body = `${pageHero({ crumbs, eyebrow: 'Discipline', h1: esc(d.name), lead: esc(d.scope), extra: `<div class="btn-row" style="margin-top:1.5rem"><a class="btn btn-secondary" href="/downloads/VDE-Datasheet-${d.slug}.pdf" data-track="download_datasheet" download>${icon('download', '')} Datasheet (PDF)</a></div>` })}
<section class="section"><div class="wrap split">
  <div class="prose"><h2>Typical deliverables</h2><ul class="ticks cols-2">${list(d.deliverables, (x) => `<li>${esc(x)}</li>`)}</ul>
  <h2>On which assets</h2>${chipsLinks(assets.map((a) => [a.name, `/capabilities/${a.slug}/`]))}</div>
  <aside class="facts"><h2>Software</h2><dl>${list(d.tools, (t) => `<dt>Tool</dt><dd>${esc(t)}</dd>`)}</dl></aside>
</div></section>
${projectsSection(projs, `${esc(d.name)} projects`)}
${ctaBand(`Need ${esc(d.name.toLowerCase())} engineering?`, 'Send the scope. We reply with the team and how we would run it.')}`;
  return { path: `/disciplines/${d.slug}/`, type: 'discipline', title: d.seoTitle, description: d.seoDescription, body, schema: [breadcrumbSchema(crumbs)], search: `${d.name} ${d.scope} ${d.tools.join(' ')}`, kind: 'Discipline' };
}

/* ================= PROJECTS ================= */
export function projectsIndex() {
  const crumbs = [['Projects', '/projects/']];
  const P = C.projects;
  const uniq = (arr) => [...new Set(arr.filter(has))].sort();
  const facets = [
    ['asset', 'Asset type', C.assets.filter((a) => P.some((p) => p.assets.includes(a.slug))).map((a) => [a.slug, a.short])],
    ['service', 'Service', C.services.filter((s) => P.some((p) => p.services.includes(s.slug))).map((s) => [s.slug, s.short])],
    ['region', 'Region', uniq(P.map((p) => p.region)).map((r) => [r, r])],
    ['clienttype', 'Client type', uniq(P.map((p) => p.clientType)).map((r) => [r, r === 'EPC' ? 'EPC contractor' : r])],
    ['year', 'Year', uniq(P.map((p) => p.year)).map((r) => [r, r])],
    ['status', 'Status', uniq(P.map((p) => p.status)).map((r) => [r, r[0].toUpperCase() + r.slice(1)])],
    ['software', 'Software', uniq(P.flatMap((p) => p.software)).map((r) => [r, r])],
  ];
  const missing = facets.filter((f) => !f[2].length).map((f) => f[1]);
  const body = `${pageHero({ crumbs, eyebrow: 'Projects', h1: 'Offshore engineering case studies', lead: 'Each case study gives the challenge and our engineering approach. Filter by what matters to your scope; the filtered view has its own link you can share.' })}
<section class="section section--tight"><div class="wrap">
  <form class="filters" id="filters" aria-label="Filter projects">${list(facets.filter((f) => f[2].length), ([k, l, opts]) => `<div class="field"><label for="f-${k}">${l}</label><select id="f-${k}" name="${k}"><option value="">All</option>${list(opts, ([v, t]) => `<option value="${esc(v)}">${esc(t)}</option>`)}</select></div>`)}</form>
  ${missing.length ? (C.P ? ADDblock('project data needed before these filters appear', missing) : '') : ''}
  <div class="filter-summary"><span id="filter-count" aria-live="polite">${P.length} projects</span><button class="btn-link" type="button" id="filter-clear">Clear filters</button></div>
  <div class="cards cards-3" id="project-list">${list(P.sort((a, b) => a.order - b.order), (p) => projectCard(p, 'h2'))}</div>
  <p id="no-results" hidden>No case study matches these filters yet. <a href="${CTA_TENDER}">Send us your scope</a>: we may have done it under NDA.</p>
  <p class="muted" style="margin-top:2rem">Several projects are under NDA and are not listed. Ask us about work on your asset type.</p>
</div></section>
${ctaBand('Your scope not listed?', 'Some of our work is under NDA. Send the scope and we will tell you what we have done that is similar.')}`;
  return { path: '/projects/', type: 'projects', title: 'Offshore engineering projects and case studies | VDE', description: 'Case studies of VDE offshore engineering for EPC contractors: jackets, pre-bid, FEED verification, pipelines, expediting, weight control and as-built.', body, schema: [breadcrumbSchema(crumbs)], search: 'projects case studies' };
}

export function projectPage(p) {
  const crumbs = [['Projects', '/projects/'], [projTitleText(p), projUrl(p)]];
  const pairs = (x) => (Array.isArray(x) ? x.map((o) => [o.label, o.value]) : Object.entries(x || {}));
  const facts = pairs(p.facts);
  const row = (k, v, label) => (has(v) ? `<dt>${esc(k)}</dt><dd>${v}</dd>` : C.P ? `<dt>${esc(k)}</dt><dd>${ADD(label || k)}</dd>` : '');
  const related = relatedProjects((q) => q.slug !== p.slug && (q.assets.some((a) => p.assets.includes(a)) || q.services.some((s) => p.services.includes(s)))).slice(0, 3);
  const firstAsset = p.assets[0] ? asset(p.assets[0]) : null;
  const panel = `<aside class="facts sticky-aside" aria-labelledby="facts-h"><h2 id="facts-h">Project facts</h2><dl>
    <dt>EPC client</dt><dd>${epcName(p)}</dd>
    <dt>End user</dt><dd>${endUserName(p)}</dd>
    ${row('Asset type', p.assets.map((a) => `<a href="/capabilities/${a}/">${esc(asset(a).short)}</a>`).join(', '), 'asset type')}
    ${row('Region', esc([p.region, p.country].filter(has).join(' · ')), 'region / country')}
    <dt>Scope</dt><dd>${esc(p.scope)}</dd>
    ${row('Services', p.services.map((s) => `<a href="/services/${s}/">${esc(service(s).short)}</a>`).join(', '))}
    ${row('Disciplines', p.disciplines.map((d) => `<a href="/disciplines/${d}/">${esc(discipline(d).name)}</a>`).join(', '))}
    ${row('Codes', esc(p.codes.join(', ')), 'codes (API RP 2A, ISO 19902, DNV…)')}
    ${row('Software', esc(p.software.join(', ')), 'software')}
    ${list(facts, ([k, v]) => row(k, esc(v)))}
    ${row('Status', esc(p.status), 'status (completed / ongoing)')}
    ${row('Year', esc(p.year), 'year')}
  </dl></aside>`;
  const body = `${pageHero({ crumbs, eyebrow: `Case study${p.publish ? '' : ` <span class="ph">${p.status === 'award pending' ? 'AWARD PENDING' : 'NOT PUBLISHED'}</span>`}`, h1: projTitle(p), lead: esc(p.scope) })}
<section class="section"><div class="wrap split">
  <article class="prose">
    ${REVIEW('Before publishing', p.reviewNotes || [])}
    <h2>Challenge</h2><p>${esc(p.challenge)}</p>
    <h2>Engineering approach</h2><ul class="ticks">${list(p.approach, (a) => `<li>${esc(a)}</li>`)}</ul>
    ${p.images && p.images.length ? list(p.images, (im) => `<figure><img src="${esc(im.src)}" alt="${esc(im.alt)}" loading="lazy" width="${im.w || 1200}" height="${im.h || 800}"><figcaption class="muted">${esc(im.caption)}</figcaption></figure>`) : ''}
    ${p.quote && has(p.quote.text) && (p.quote.permission || C.P) ? `<blockquote class="callout"><p>“${esc(p.quote.text)}”</p><footer>— ${esc(p.quote.by)} ${p.quote.permission ? '' : CONFIRM('quote permission')}</footer></blockquote>` : ''}
  </article>
  ${panel}
</div></section>
${related.length ? projectsSection(related, 'Related projects') : ''}
${ctaBand('Have a similar scope?', `Send the tender package${firstAsset ? ` for your ${esc(firstAsset.short.toLowerCase())} scope` : ''}. We reply with questions, a team and a plan.`, ['Send a tender package', `/contact/?${firstAsset ? `asset=${firstAsset.slug}&` : ''}from=${p.slug}#tender`])}`;
  const art = { '@type': 'Article', headline: projTitleText(p).slice(0, 110), about: p.scope, author: { '@id': orgId() }, publisher: { '@id': orgId() }, url: absUrl(projUrl(p)), articleSection: 'Case study', keywords: [...p.assets, ...p.services].join(', ') };
  return { path: projUrl(p), type: 'case-study', title: `${projTitleText(p).slice(0, 52)} | VDE`, description: `${p.scope} Challenge and engineering approach. Offshore engineering case study by VDE.`.slice(0, 155), body, schema: [breadcrumbSchema(crumbs), art], ogType: 'article', search: `${projTitleText(p)} ${p.scope}`, kind: 'Project' };
}

/* ================= HOW WE WORK ================= */
export function howWeWork() {
  const s = S();
  const crumbs = [['How we work', '/how-we-work/']];
  const steps = [
    ['Handover', 'Your scope, data and standards received and logged.'], ['Kick-off', 'Scope, interfaces, deliverables list and dates agreed.'], ['Plan', 'Resources and schedule built from the deliverables list.'],
    ['Prepare', 'The discipline engineer prepares the deliverable.'], ['Check', 'A different engineer checks it. The checker is never the preparer.'], ['IDC', 'Inter-discipline check of interfaces before issue.'],
    ['Issue', 'Issued to you by transmittal, under revision control.'], ['Client review', 'Your comments logged, answered and closed.'], ['IFC', 'Issued for construction once comments are closed.'],
    ['As-built', 'Drawings and models updated to match what was built.'], ['Close-out', 'Records handed over and lessons learned recorded.'],
  ];
  const body = `${pageHero({ crumbs, eyebrow: 'How we work', h1: 'Will they deliver right first time?', lead: `Our answer is a delivery process that every project follows, checks that cannot be skipped and an ${esc(s.iso.standard)} quality management system behind both.` })}
<section class="section"><div class="wrap"><div class="section-head"><h2>The VDE delivery process</h2></div><ol class="steps">${list(steps, ([t, d]) => `<li><strong>${t}</strong><span>${d}</span></li>`)}</ol></div></section>
<section class="section section--grey"><div class="wrap grid">
  <div class="c-6"><h2>Quality controls</h2><ul class="ticks">
    <li>The checker is never the preparer.</li><li>Inter-discipline check (IDC) before every issue.</li><li>Every issue goes out by transmittal, under revision control.</li><li>Change notes validated within 2 working days.</li></ul></div>
  <div class="c-6"><h2>Progress you can audit</h2><p>Progress is measured from the deliverables list, not from hours spent. Each deliverable has weighted steps, so the percentage complete you see is the work actually done.</p>${CONFIRM('progress-measurement wording')}</div>
</div></section>
<section class="section"><div class="wrap grid">
  <div class="c-4"><h3>Document control</h3><p>Document numbering, templates and registers to your project procedures. Transmittals and revision history for every deliverable. Primavera for planning and progress.</p></div>
  <div class="c-4"><h3>Data security and NDA</h3><p>We sign NDAs before receiving tender documents. We can work on your systems over Citrix or VPN, so your data stays on your servers. Project folders are access-controlled by project team.</p></div>
  <div class="c-4"><h3>${esc(s.iso.standard)} QMS</h3><p>Certified quality management system ${has(s.iso.certificationBody) ? `(${esc(s.iso.certificationBody)}, cert. ${esc(s.iso.certificateNumber)}, valid to ${esc(s.iso.validUntil)})` : ADD('certification body, certificate number and validity')}. Procedures cover business development, projects, engineering and HR:</p><ul class="chips">${list(s.iso.procedures, (p) => `<li><span class="tag">${esc(p)}</span></li>`)}</ul></div>
</div></section>
${ctaBand('See it on your scope', 'Send a tender package and we will show you the deliverables list and plan we would run.', ['Send a tender package', CTA_TENDER], ['Request the prequalification pack', '/prequalification/#pack'])}`;
  return { path: '/how-we-work/', type: 'how', title: 'How we work: QMS, checks and document control | VDE', description: 'VDE delivery process from handover to close-out: checker never the preparer, inter-discipline check, transmittals, change control and ISO 9001:2015.', body, schema: [breadcrumbSchema(crumbs)], search: 'how we work quality QMS ISO 9001 process NDA document control' };
}

/* ================= PREQUALIFICATION ================= */
export function prequalification(today) {
  const s = S();
  const crumbs = [['Prequalification', '/prequalification/']];
  const certs = s.certificates.filter((c) => !has(c.expiry) || c.expiry >= today);
  const showCerts = certs.filter((c) => C.P || (has(c.issuer) && has(c.number) && has(c.expiry)));
  const facts = [
    ['Legal name', esc(s.legalName)], ['Formed', `${s.formed}, as the ${esc(s.groupName)}'s offshore engineering company`], ['Group heritage', `Valdel engineering since ${s.heritageSince}`],
    ['Location', `${esc(s.address.locality)}, ${esc(s.address.region)}, ${esc(s.address.country)}`], ['Quality', esc(s.iso.standard)],
    ['Engineering personnel', esc(s.team.size)],
    ...(s.statutory ? [['CIN', `<span class="mono">${esc(s.statutory.cin)}</span>`], ['Incorporated', esc(s.statutory.incorporated)], ['PAN', `<span class="mono">${esc(s.statutory.pan)}</span>`], ['GSTIN', `<span class="mono">${esc(s.statutory.gstin)}</span>`]] : [['GST / PAN / CIN', ADD('GST, PAN and incorporation (CIN) numbers')]]),
  ].filter(([, v]) => v);
  const body = `${pageHero({ crumbs, eyebrow: 'For procurement and vendor registration', h1: 'Prequalify VDE as a vendor', lead: 'Everything a buyer usually asks for, in one pack. Need a specific form or portal registration? Use the request form below.' })}
<section class="section" id="pack"><div class="wrap split">
  <div>
    <h2>Prequalification pack</h2>
    <p>Our company profile, certificates, organisation, policies and statutory details in one pack. Send us your details and our business development team e-mails the pack to you.</p>
    <div class="table-wrap"><table><thead><tr><th scope="col">What the pack contains</th></tr></thead><tbody>${list(s.prequalPack.items, (i) => `<tr><td>${esc(i.name)}${i.onRequest ? ' <span class="muted">(shared on request only, directly with your finance team)</span>' : ''}</td></tr>`)}</tbody></table></div>
  </div>
  <div class="form-card"><h2 style="font-size:var(--h4)">Request the pack</h2><p class="muted">Our BD team e-mails it to you.</p>${prequalForm()}</div>
</div></section>
<section class="section section--grey"><div class="wrap grid">
  <div class="c-6"><h2>Company details</h2><div class="facts"><dl>${list(facts, ([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`)}</dl></div></div>
  <div class="c-6"><h2>Certificates</h2>
    ${showCerts.length ? `<div class="table-wrap"><table class="spec"><thead><tr><th scope="col">Certificate</th><th scope="col">Issuer</th><th scope="col">Number</th><th scope="col">Expiry</th></tr></thead><tbody>${list(showCerts, (c) => `<tr data-expiry="${esc(c.expiry)}"><td>${has(c.file) ? `<a href="${esc(c.file)}">${esc(c.name)}</a>` : esc(c.name)}</td><td>${valOr(c.issuer, 'issuer')}</td><td>${valOr(c.number, 'number')}</td><td>${valOr(c.expiry, 'expiry date')}</td></tr>`)}</tbody></table></div><p class="muted" style="font-size:var(--t-xs);margin-top:.5rem">Expired certificates are removed from this list automatically.</p>` : '<p>Certificates are included in the prequalification pack.</p>'}
    <h2 style="margin-top:2rem">Vendor registrations</h2>
    ${s.vendorRegistrations.length ? `<ul class="ticks">${list(s.vendorRegistrations, (v) => `<li>${esc(v)}</li>`)}</ul>` : C.P ? ADDblock('vendor registrations held (e.g. Saudi Aramco, ONGC, QatarEnergy, ADNOC)') : '<p>Ask us about registrations with your portal.</p>'}
    <h2 style="margin-top:2rem">HSE and insurance</h2><p>Our HSE policy and insurance certificates are in the pack. ${ADD('insurance types and cover (e.g. professional indemnity) if they can be published')}</p>
  </div>
</div></section>
${ctaBand('Already registered us?', 'Send a tender package or RFQ directly.')}`;
  return { path: '/prequalification/', type: 'prequal', title: 'Vendor prequalification pack | Valdel Design Engineering', description: 'Prequalify VDE as an offshore engineering vendor: ISO 9001:2015 certificate, organisation, HSE, insurance and statutory details in one pack.', body, schema: [breadcrumbSchema(crumbs)], forms: true, search: 'prequalification vendor registration ISO certificate insurance HSE GST PAN', kind: 'Document' };
}

/* ================= ABOUT ================= */
export function about() {
  const s = S();
  const crumbs = [['About', '/about/']];
  const body = `${pageHero({ crumbs, eyebrow: 'About VDE', h1: `Offshore engineering since ${s.heritageSince}`, lead: `${esc(s.legalName)} was formed in ${s.formed} as the ${esc(s.groupName)}'s offshore engineering company, working directly for offshore EPC contractors. It carries 35+ years of Valdel engineering. ${esc(s.brandPromise)}` })}
<section class="section"><div class="wrap grid">
  <div class="c-7"><h2>Heritage</h2><ol class="timeline">${list(s.heritage, (h) => `<li><span class="yr">${esc(h.year)}</span>${esc(h.text)}</li>`)}</ol></div>
  <div class="c-5"><div class="facts"><h2>VDE today</h2><dl>
    <dt>Formed</dt><dd>${s.formed}</dd><dt>Office</dt><dd>${esc(s.address.locality)}, ${esc(s.address.country)}</dd><dt>Team</dt><dd>${esc(s.team.size)} engineering personnel</dd><dt>Experience</dt><dd>${esc(s.team.seniorShare)} with ${esc(s.team.seniorDefinition)}</dd><dt>Growth</dt><dd>${esc(s.team.growthTarget)} by ${esc(s.team.growthBy)}</dd><dt>Quality</dt><dd>${esc(s.iso.standard)}</dd></dl></div>
  <p style="margin-top:1.5rem"><a class="link-arrow" href="/about/leadership/">Leadership and lead engineers</a></p></div>
</div></section>
<section class="section section--grey"><div class="wrap grid">
  <div class="c-6"><h2>Our office</h2><p>${esc(fullAddress(s.address))} ${s.address.confirmed ? '' : ADD('full address')}</p>
  ${has(s.mapUrl) ? `<a class="link-arrow" href="${esc(s.mapUrl)}" rel="noopener">Open in maps</a>` : ADD('map pin link')}
  ${officeFigure()}</div>
  <div class="c-6"><h2>Valdel Group</h2><p>VDE is the offshore company of the ${esc(s.groupName)}. For onshore and downstream work (refineries, petrochemicals, terminals and cross-country pipelines) see the group company.</p>
  <p><a class="link-arrow" href="${esc(s.groupUrl)}" rel="noopener">Valdel Group</a></p><p>Onshore / downstream engineering → <a href="${esc(s.onshoreUrl)}" rel="noopener">${esc(s.onshoreName)}</a></p></div>
</div></section>
${ctaBand('Work with us', 'Send a tender package, or prequalify us as a vendor.', ['Send a tender package', CTA_TENDER], ['Prequalification', '/prequalification/'])}`;
  return { path: '/about/', type: 'about', title: 'About Valdel Design Engineering: offshore since 1990', description: `VDE was formed in ${s.formed} as the Valdel Group's offshore engineering company, with Valdel engineering heritage since ${s.heritageSince}. Bengaluru, India.`, body, schema: [breadcrumbSchema(crumbs)], search: 'about heritage history timeline valdel group' };
}

export function leadership() {
  const crumbs = [['About', '/about/'], ['Leadership', '/about/leadership/']];
  const people = C.people.filter((p) => p.leadership && (p.consent || C.P));
  const fieldRow = (k, v, lbl) => (has(v) ? `<dt>${k}</dt><dd>${esc(v)}</dd>` : C.P ? `<dt>${k}</dt><dd>${ADD(lbl)}</dd>` : '');
  const body = `${pageHero({ crumbs, eyebrow: 'About', h1: 'Leadership and lead engineers', lead: 'The people who set the design basis, check the work and answer for it.' })}
<section class="section"><div class="wrap">
  ${people.length ? `<div class="cards">${list(people, (p) => `<article class="person">${has(p.photo) ? `<img src="${esc(p.photo)}" alt="${esc(p.name)}" width="400" height="400" loading="lazy">` : C.P ? `<div class="photo">${ADD('photo')}</div>` : ''}<h2 style="font-size:var(--h5)">${esc(p.name)} ${p.consent ? '' : CONFIRM('consent to publish')}</h2><p class="role">${esc(p.role)}</p><div class="facts" style="padding:0;background:none;border:0"><dl>${fieldRow('Years offshore', p.yearsOffshore, 'years offshore')}</dl></div></article>`)}</div>
  ${C.P ? ADDblock('discipline lead engineers (one card each, with consent)') : ''}` : '<p>Profiles of our leadership and discipline leads will be published here.</p>'}
</div></section>
${ctaBand('Talk to an engineer', 'Send your scope and a discipline lead will reply.', ['Talk to an engineer', CTA_TENDER])}`;
  return { path: '/about/leadership/', type: 'leadership', title: 'Leadership and lead engineers | VDE', description: 'The leadership and discipline lead engineers of Valdel Design Engineering: offshore experience, key projects and qualifications.', body, schema: [breadcrumbSchema(crumbs)], search: 'leadership team engineers' };
}

/* ================= CAREERS ================= */
export function careers() {
  const s = S();
  const crumbs = [['Careers', '/careers/']];
  const tools = [...new Set(C.disciplines.flatMap((d) => d.tools))].filter((t) => !/Specs/.test(t));
  const body = `${pageHero({ crumbs, eyebrow: 'Careers', h1: `We are growing to ${esc(s.team.growthTarget)} engineers by ${esc(s.team.growthBy)}`, lead: `Offshore engineering for EPC contractors worldwide, from our office in ${esc(s.address.locality)}. ${esc(s.team.seniorShare)} of the offshore team has ${esc(s.team.seniorDefinition)}: you learn from people who have done it.` })}
<section class="section"><div class="wrap">
  <div class="section-head"><h2>Open positions</h2></div>
  ${C.jobs.length ? `<p>${C.jobs.length} open position${C.jobs.length > 1 ? 's' : ''} in ${[...new Set(C.jobs.map((j) => j.discipline))].length} disciplines. Each needs a Bachelor's or Master's degree in Engineering, or a Diploma; FPSO topsides experience is highly desirable.</p>
  <nav class="chips" aria-label="Disciplines">${list([...new Set(C.jobs.map((j) => j.discipline))], (d) => `<a class="tag" href="#jobs-${d.toLowerCase().replace(/[^a-z0-9]+/g, '-')}">${esc(d)} (${C.jobs.filter((j) => j.discipline === d).length})</a>`)}</nav>
  ${list([...new Set(C.jobs.map((j) => j.discipline))], (d) => `<h3 id="jobs-${d.toLowerCase().replace(/[^a-z0-9]+/g, '-')}" style="margin-top:2rem">${esc(d)}</h3><ul class="job-list">${list(C.jobs.filter((j) => j.discipline === d), (j) => `<li><div><h4 style="margin:0;font-size:var(--h5)"><a href="/careers/${esc(j.code)}/" style="text-decoration:none">${esc(j.title)}</a> ${j.example ? '<span class="ph">EXAMPLE – never published</span>' : ''}</h4><span class="muted">${has(j.experience) ? `${esc(j.experience)} · ` : ''}${esc(j.location)} · <span class="mono">${esc(j.code)}</span></span></div><a class="btn btn-secondary btn-sm" href="/careers/${esc(j.code)}/" aria-label="View ${esc(j.title)}">View</a></li>`)}</ul>`)}` : ''}
  ${C.jobs.filter((j) => !j.example).length ? '' : `<p>No positions are listed right now. We still want to hear from experienced offshore engineers and designers: send your CV to <a href="mailto:${esc(s.careersEmail)}?subject=${encodeURIComponent('Open application – [discipline]')}" data-track="email_click">${esc(s.careersEmail)}</a> with your discipline in the subject line. ${ADD('current open positions with position codes (from HR requisitions)')}</p>`}
  <p class="notice">To apply by e-mail, write to <a href="mailto:${esc(s.careersEmail)}" data-track="email_click">${esc(s.careersEmail)}</a> and put the position code in the subject line.</p>
</div></section>
<section class="section section--grey"><div class="wrap"><div class="section-head"><h2>Life at VDE</h2></div><div class="grid">
  <div class="c-3"><h3>Project variety</h3><p>Jackets, process platforms, FPSO modules, subsea pipelines, brownfield and offshore wind substations for EPCs in several regions.</p></div>
  <div class="c-3"><h3>Software</h3><ul class="chips">${list(tools.slice(0, 16), (t) => `<li><span class="tag">${esc(t)}</span></li>`)}</ul></div>
  <div class="c-3"><h3>Training</h3><p>Every deliverable is checked by a senior engineer, so you learn on real work. ${ADD('training programme details (courses, software certifications, mentoring)')}</p></div>
  <div class="c-3"><h3>Growth plan</h3><p>From ${esc(s.team.size)} today to ${esc(s.team.growthTarget)} by ${esc(s.team.growthBy)}: new lead and senior roles open as we grow.</p></div>
</div>${officeFigure()}</div></section>
<section class="section" id="apply"><div class="wrap split"><div class="form-card"><h2>Apply</h2>${applyForm(null)}</div><aside class="panel"><h3>What happens next</h3><p>HR reviews every application against open and upcoming requisitions and replies if there is a match.</p></aside></div></section>`;
  return { path: '/careers/', type: 'careers', title: 'Careers in offshore engineering, Bengaluru | VDE', description: `Offshore engineering jobs in Bengaluru. VDE is growing to ${s.team.growthTarget} engineers by ${s.team.growthBy}. Open positions, software, training and how to apply.`, body, schema: [breadcrumbSchema(crumbs)], forms: true, search: 'careers jobs vacancies apply' };
}

export function jobPage(j) {
  const s = S();
  const crumbs = [['Careers', '/careers/'], [j.title, `/careers/${j.code}/`]];
  const body = `${pageHero({ crumbs, eyebrow: `Position ${esc(j.code)}${j.example ? ' <span class="ph">EXAMPLE – layout only, never published</span>' : ''}`, h1: esc(j.title), lead: `${esc(j.discipline)} · ${esc(j.location)}${has(j.experience) ? ` · ${esc(j.experience)}` : ''}` })}
<section class="section"><div class="wrap split"><div class="prose"><p>${esc(j.description)}</p>
${j.responsibilities?.length ? `<h2>What you will do</h2><ul class="ticks">${list(j.responsibilities, (r) => `<li>${esc(r)}</li>`)}</ul>` : ''}
${j.requirements?.length ? `<h2>What you bring</h2><ul class="ticks">${list(j.requirements, (r) => `<li>${esc(r)}</li>`)}</ul>` : ''}
<p class="notice">Apply by e-mail to <a href="mailto:${esc(s.careersEmail)}?subject=${encodeURIComponent(j.code + ' – ' + j.title)}" data-track="email_click">${esc(s.careersEmail)}</a> with <strong>${esc(j.code)}</strong> in the subject line, or use the form.</p></div>
<div class="form-card" id="apply"><h2>Apply</h2>${applyForm(j)}</div></div></section>`;
  const jp = { '@type': 'JobPosting', title: j.title, description: j.description, identifier: { '@type': 'PropertyValue', name: s.legalName, value: j.code }, datePosted: j.datePosted || undefined, validThrough: j.validThrough || undefined, employmentType: j.employmentType, hiringOrganization: { '@id': orgId(), name: s.legalName }, jobLocation: { '@type': 'Place', address: { '@type': 'PostalAddress', addressLocality: 'Bengaluru', addressRegion: 'Karnataka', addressCountry: 'IN' } } };
  return { path: `/careers/${j.code}/`, type: 'job', title: `${j.title.replace(/\s*\(.*\)$/, '')} (${j.code}) | VDE careers`.slice(0, 60), description: `${j.title}, ${j.discipline}, ${j.location}. Apply with position code ${j.code}.`.slice(0, 155), body, schema: [breadcrumbSchema(crumbs), jp], forms: true, search: `${j.title} ${j.discipline} ${j.code}`, kind: 'Job', noindex: !!j.example };
}

/* ================= INSIGHTS ================= */
export function insights() {
  const crumbs = [['Insights', '/insights/']];
  const items = C.news;
  const body = `${pageHero({ crumbs, eyebrow: 'Insights', h1: 'Technical notes and news', lead: 'Short notes from our engineers, and project news we are cleared to share.' })}
<section class="section"><div class="wrap">${items.length ? `<div class="cards cards-3">${list(items, (n) => `<article class="card"><p class="tag">${esc(n.date)}</p><h2 style="font-size:var(--h5)"><a href="/insights/${esc(n.slug)}/">${esc(n.title)}</a></h2><p>${esc(n.summary)}</p></article>`)}</div>` : `<p>No articles yet.</p>${ADD('first technical notes (optional at launch)')}`}</div></section>`;
  return { path: '/insights/', type: 'insights', title: 'Insights: offshore engineering notes and news | VDE', description: 'Technical notes on offshore structural, pipeline and topside engineering, and VDE project news.', body, schema: [breadcrumbSchema(crumbs)], noindex: !items.length, search: 'insights news articles' };
}
export function newsPage(n) {
  const crumbs = [['Insights', '/insights/'], [n.title, `/insights/${n.slug}/`]];
  const body = `${pageHero({ crumbs, eyebrow: esc(n.date), h1: esc(n.title), lead: esc(n.summary) })}<section class="section"><div class="wrap prose">${n.html || ''}</div></section>${ctaBand('Talk to an engineer', '', ['Talk to an engineer', CTA_TENDER])}`;
  return { path: `/insights/${n.slug}/`, type: 'article', title: `${n.title.slice(0, 52)} | VDE`, description: (n.summary || '').slice(0, 155), body, schema: [breadcrumbSchema(crumbs), { '@type': 'Article', headline: n.title, datePublished: n.date, author: { '@id': orgId() } }], ogType: 'article', search: n.title, kind: 'News' };
}

/* ================= CONTACT ================= */
export function contact() {
  const s = S();
  const crumbs = [['Contact', '/contact/']];
  const bd = C.people.filter((p) => p.bd && (p.consent || C.P));
  const a = s.address;
  const body = `${pageHero({ crumbs, eyebrow: 'Contact', h1: 'Send a tender package', lead: `Attach the ITB or scope of work, or send a link to your document share. ${confirmed(s.responseCommitment, 'response-time commitment')}` })}
<section class="section"><div class="wrap split">
  <div>
    <nav class="tabs" aria-label="Choose a form"><a href="#tender" aria-current="true">Tender package / RFQ</a><a href="#general">General enquiry</a></nav>
    <div class="form-card" id="tender"><h2>Tender package / RFQ</h2><p class="muted">Four fields are required. Everything else helps us reply faster.</p>${tenderForm()}</div>
    <div class="form-card" id="general" style="margin-top:2rem;border-top-color:var(--navy)"><h2>General enquiry</h2><p class="muted">For anything that is not a tender: partnerships, media, suppliers.</p>${generalForm()}</div>
  </div>
  <aside class="facts sticky-aside" aria-labelledby="office-h"><h2 id="office-h">Office</h2><dl>
    <dt>Address</dt><dd>${esc(s.legalName)}<br>${esc(fullAddress(a))} ${a.confirmed ? '' : ADD('full address')}</dd>
    <dt>Map</dt><dd>${has(s.mapUrl) ? `<a href="${esc(s.mapUrl)}" rel="noopener">Open in maps</a>` : ADD('map pin')}</dd>
    <dt>Phone</dt><dd>${has(s.phone) ? `<a href="tel:${esc(s.phone.replace(/\s/g, ''))}" data-track="phone_click">${esc(s.phone)}</a>` : ADD('phone')}</dd>
    <dt>Hours</dt><dd>${has(s.officeHours) ? esc(s.officeHours) : ADD('office hours (IST)')}</dd>
    ${list(bd, (p) => `<dt>${esc(p.role)}</dt><dd>${esc(p.name)}<br><a href="mailto:${esc(p.email)}" data-track="email_click">${esc(p.email)}</a> ${p.consent ? '' : CONFIRM('show publicly?')}</dd>`)}
    <dt>Careers</dt><dd><a href="mailto:${esc(s.careersEmail)}" data-track="email_click">${esc(s.careersEmail)}</a></dd>
  </dl></aside>
</div></section>`;
  const cp = { '@type': 'ContactPage', url: absUrl('/contact/'), about: { '@id': orgId() } };
  return { path: '/contact/', type: 'contact', title: 'Send a tender package or RFQ | Valdel Design Engineering', description: 'Send VDE a tender package or RFQ for offshore engineering, or a general enquiry. Secure upload up to 100 MB, NDA on request. Bengaluru, India.', body, schema: [breadcrumbSchema(crumbs), cp], forms: true, search: 'contact tender RFQ enquiry office address phone' };
}

export function thanks() {
  const s = S();
  const bd = C.people.find((p) => p.bd && (p.consent || C.P));
  const body = `${pageHero({ crumbs: [['Contact', '/contact/'], ['Thank you', '/contact/thanks/']], eyebrow: 'Received', h1: 'Thank you. We have your enquiry.', lead: `<span data-thanks-msg>${confirmed(s.responseCommitment, 'response-time commitment') || 'A VDE engineer will reply by e-mail.'}</span>` })}
<section class="section"><div class="wrap split"><div class="prose">
  <h2>What happens next</h2>
  <ol><li>Your enquiry is logged and sent to our business development team.</li><li>${bd ? `${esc(bd.name)}, ${esc(bd.role)}, ${bd.consent ? '' : CONFIRM('BD contact shown here')}` : 'A business development lead'} reviews it with the discipline leads.</li><li>We reply with questions, a team and a plan.</li></ol>
  <p data-nda-note hidden>You asked for an NDA first: our mutual NDA template is in your confirmation e-mail. ${has(s.ndaTemplateUrl) ? '' : ADD('NDA template')}</p>
  ${has(s.calendarUrl) ? `<p><a class="btn btn-secondary" href="${esc(s.calendarUrl)}" rel="noopener">Book a call</a></p>` : `<p>${ADD('calendar link for a call (e.g. Microsoft Bookings)')}</p>`}
</div><aside class="panel"><h3>While you wait</h3><ul class="ticks"><li><a href="/projects/">Browse case studies</a></li><li><a href="/how-we-work/">See how we work</a></li><li><a href="/downloads/VDE-Capability-Statement.pdf" data-track="download_capability" download>Download the capability statement</a></li></ul></aside></div></section>`;
  return { path: '/contact/thanks/', type: 'thanks', title: 'Thank you | Valdel Design Engineering', description: 'Your enquiry has reached VDE business development.', body, noindex: true };
}

/* ================= LEGAL ================= */
export function legal(kind) {
  const s = S();
  const g = s.grievanceOfficer;
  const ret = s.uploadRetentionDays;
  const pages = {
    privacy: ['Privacy notice', `<p>This notice explains how ${esc(s.legalName)} ("VDE", "we") processes personal data collected through this website, under India's Digital Personal Data Protection Act, 2023 (DPDP Act). VDE is the Data Fiduciary.</p>
<h2>What we collect</h2><ul><li><strong>Enquiries and tender packages:</strong> name, company, business e-mail, optional phone, project details and any documents you upload.</li><li><strong>Prequalification requests:</strong> e-mail and company.</li><li><strong>Job applications:</strong> name, e-mail, experience, CV and any details in it.</li><li><strong>Analytics (only with your consent):</strong> pages visited and events such as downloads, in aggregate. No advertising cookies.</li></ul>
<h2>Why we collect it</h2><p>To answer your enquiry, prepare a proposal, register as your vendor, assess your job application and improve this website. The legal basis is your consent, given when you submit a form, and our legitimate use under section 7 of the DPDP Act where you have voluntarily provided the data for that purpose.</p>
<h2>How long we keep it</h2><ul><li>Enquiries: as long as the business relationship lasts, and up to 3 years after the last contact.</li><li>Uploaded tender files: deleted automatically after ${esc(ret.value)} days ${ret.confirmed ? '' : CONFIRM('upload retention')}.</li><li>CVs: up to 12 months.</li></ul>
<h2>Who processes it for us</h2><p>Our website host and form back-end (Cloudflare), our e-mail provider and, with your consent, our analytics provider. ${CONFIRM('list of processors and where data is stored')} We do not sell personal data.</p>
<h2>Your rights</h2><p>You can ask to access, correct, complete or erase your personal data, withdraw consent at any time, nominate another person to exercise your rights, and raise a grievance. Withdrawing consent does not affect processing already done.</p>
<h2>Grievance officer</h2><p>${has(g.name) ? `${esc(g.name)}, <a href="mailto:${esc(g.email)}">${esc(g.email)}</a>` : ADD('grievance officer name and e-mail')}. If you are not satisfied with our response, you may complain to the Data Protection Board of India.</p>
${C.P ? REVIEW('Legal', ['Have counsel review this notice before launch.']) : ''}`],
    terms: ['Terms of use', `<p>This website is operated by ${esc(s.legalName)}. By using it you accept these terms.</p><h2>Information on this site</h2><p>Content is for general information about our services. It is not an offer, and it does not create a contract. Project information is published with our clients' permission or anonymised.</p><h2>Intellectual property</h2><p>Text, drawings, models and images on this site belong to VDE or are used with permission. Do not reuse them without written consent.</p><h2>Documents you send us</h2><p>We treat tender documents as confidential, use them only to prepare our response and store them privately. Where you ask for an NDA, its terms apply.</p><h2>Liability</h2><p>We take care to keep this site accurate but do not guarantee it is complete or current. We are not liable for loss arising from use of the site.</p><h2>Law</h2><p>These terms are governed by the laws of India; the courts of Bengaluru have jurisdiction.</p>${C.P ? REVIEW('Legal', ['Have counsel review these terms before launch.']) : ''}`],
    cookies: ['Cookie notice', `<p>We use as few cookies as possible.</p><div class="table-wrap"><table><thead><tr><th scope="col">Name</th><th scope="col">Purpose</th><th scope="col">Type</th><th scope="col">Duration</th></tr></thead><tbody>
<tr><td class="mono">vde_consent</td><td>Remembers your analytics choice (browser local storage, not a cookie)</td><td>Essential</td><td>12 months</td></tr>
<tr><td class="mono">cf_*, __cf_bm</td><td>Spam and bot protection on forms (Cloudflare Turnstile)</td><td>Essential</td><td>Session – 30 min</td></tr>
<tr><td class="mono">Analytics</td><td>${s.analytics.provider === 'plausible' ? 'Plausible Analytics sets no cookies and stores no personal data; it is still loaded only after you accept.' : 'Google Analytics 4 cookies (_ga, _ga_*), only after you accept.'}</td><td>Analytics (optional)</td><td>${s.analytics.provider === 'plausible' ? 'None' : 'Up to 13 months'}</td></tr>
</tbody></table></div><p style="margin-top:1rem">Nothing non-essential runs before you choose. Change your choice at any time: <button class="btn-link" type="button" data-consent-open>cookie settings</button>.</p>${CONFIRM('analytics provider choice')}`],
  };
  const [h, html] = pages[kind];
  const body = `${pageHero({ crumbs: [[h, `/${kind}/`]], h1: h, lead: `Last updated ${new Date().toISOString().slice(0, 10)}.` })}<section class="section"><div class="wrap prose">${html}</div></section>`;
  return { path: `/${kind}/`, type: 'legal', title: `${h} | Valdel Design Engineering`, description: `${h} for the Valdel Design Engineering website${kind === 'privacy' ? ', under India’s DPDP Act 2023' : ''}.`, body, search: h };
}

export function notFound() {
  const body = `${pageHero({ h1: 'Page not found', lead: 'The page may have moved. Try the search (press /) or one of these:' })}<section class="section"><div class="wrap"><ul class="ticks"><li><a href="/capabilities/">Capabilities</a></li><li><a href="/projects/">Projects</a></li><li><a href="/contact/">Send a tender package</a></li></ul></div></section>`;
  return { path: '/404.html', file: '404.html', type: '404', title: 'Page not found | VDE', description: 'Page not found.', body, noindex: true };
}

/* ================= DESIGN SYSTEM ================= */
export function designSystem() {
  const sw = [['--red', '#E30613', 'CTAs, key accents'], ['--red-dark', '#B8050F', 'hover, errors'], ['--navy', '#002060', 'headings, header'], ['--ink', '#191C26', 'body text'], ['--muted', '#5F6473', 'secondary text'], ['--line', '#D5D8E0', 'borders'], ['--grey', '#F2F3F7', 'panels'], ['--white', '#FFFFFF', 'background'], ['--ok', '#1C6B3A', 'status: completed'], ['--warn', '#8A5A00', 'status: ongoing']];
  const type = [['h1', 'var(--h1)', 'Barlow Condensed 700'], ['h2', 'var(--h2)', 'Barlow Condensed 600'], ['h3', 'var(--h4)', 'Barlow Condensed 600'], ['h4', 'var(--h5)', 'Barlow Condensed 600'], ['lead', 'var(--t-lg)', 'Public Sans 400'], ['body', 'var(--t-md)', 'Public Sans 400'], ['small', 'var(--t-xs)', 'Public Sans 400'], ['mono', '.875rem', 'JetBrains Mono']];
  const sample = C.projects[0];
  const body = `${pageHero({ eyebrow: 'Internal', h1: 'Design system', lead: 'Tokens and components used on every page. Source: /css/site.css. Not indexed.' })}
<section class="section"><div class="wrap stack">
<h2>Colour</h2><div class="swatches">${list(sw, ([n, v, u]) => `<div class="swatch"><div class="chip" style="background:${v}"></div><div>${n}<br>${v}<br><span class="muted">${u}</span></div></div>`)}</div>
<p class="muted">Contrast on white: red 4.9:1, navy 15.2:1, ink 16.9:1, muted 6.0:1 (all WCAG 2.2 AA for normal text). White on red 4.9:1.</p>
<h2>Type scale</h2>${list(type, ([n, sz, f]) => `<div class="type-row"><code>${n} · ${f}</code><div style="font-size:${sz};font-family:${/Barlow/.test(f) ? 'var(--f-head)' : /Mono/.test(f) ? 'var(--f-mono)' : 'var(--f-body)'};font-weight:${/700/.test(f) ? 700 : /600/.test(f) ? 600 : 400};color:${n.startsWith('h') ? 'var(--navy)' : 'inherit'};line-height:1.1">Offshore jacket ${n === 'mono' ? 'API RP 2A · 1,250 t' : 'engineering'}</div></div>`)}
<h2>Spacing</h2><p class="mono">--s1 4px · --s2 8px · --s3 12px · --s4 16px · --s5 24px · --s6 32px · --s7 48px · --s8 64px · --s9 96px. 12-column grid, max width 76rem, gutter clamp(1rem, 3vw, 2rem).</p>
<h2>Buttons</h2><div class="btn-row"><a class="btn btn-primary" href="#">Send a tender package</a><a class="btn btn-secondary" href="#">Download capability statement</a><a class="btn btn-primary btn-sm" href="#">Small</a><a class="link-arrow" href="#">Text link</a></div>
<h2>Cards</h2><div class="cards cards-3">${projectCard(sample)}<article class="card">${icon('jacket')}<h3><a href="#">Asset card</a></h3><p>One line, then a link.</p><a class="link-arrow" href="#">See projects</a></article></div>
<h2>Counters</h2></div></section>${counters()}<section class="section"><div class="wrap stack">
<h2>Lifecycle</h2><ol class="lifecycle">${list(['Concept', 'Pre-bid', 'FEED', 'Detail'], (t, i) => `<li><a href="#"><span class="n">0${i + 1}</span><span class="t">${t}</span></a></li>`)}</ol>
<h2>Table</h2><div class="table-wrap"><table class="spec"><thead><tr><th>Discipline</th><th>Tools</th></tr></thead><tbody><tr><td>Offshore structural</td><td>SACS, STAAD.Pro</td></tr><tr><td>Pipelines</td><td>OrcaFlex, OFFPIPE</td></tr></tbody></table></div>
<h2>Timeline</h2><ol class="timeline"><li><span class="yr">1990</span>First event</li><li><span class="yr">2022</span>Latest event</li></ol>
<h2>Form</h2><div class="form-card">${generalForm()}</div>
<h2>Icons</h2><div class="btn-row">${list(['jacket', 'process', 'fpso', 'pipeline', 'brownfield', 'wind', 'prebid', 'feed', 'detail', 'installation', 'yard', 'procurement', 'verification', 'asbuilt', 'weight', 'd-process', 'd-mechanical', 'd-piping', 'd-electrical', 'd-instrument', 'd-telecom', 'd-structural', 'd-pipeline', 'd-model', 'd-controls'], (n) => `<span title="${n}" style="color:var(--navy)">${icon(n)}</span>`)}</div>
<h2>Draft markers</h2><p>${C.P ? ADD('example') + ' ' + CONFIRM('example') : 'Markers appear only in the preview build.'}</p>
</div></section>`;
  return { path: '/design-system/', type: 'design', title: 'Design system | VDE', description: 'VDE website design system.', body, noindex: true };
}

/* ================= PRINT DOCUMENTS ================= */
export function printLayout(title, pages) {
  return `<!DOCTYPE html><html lang="en-GB"><head><meta charset="utf-8"><title>${esc(title)}</title><meta name="robots" content="noindex"><link rel="stylesheet" href="/css/print.css"></head><body>${pages}</body></html>`;
}
function printHead(sub) {
  return `<header class="doc-head">${logo('VALDEL Design Engineering')}<div class="doc-sub">${sub}</div></header>`;
}
function printFoot(n, of) {
  const s = S();
  return `<footer class="doc-foot"><span>${esc(s.legalName)} · ${esc(s.address.locality)}, India · ${esc(s.iso.standard)}</span><span>${esc(origin().replace(/^https?:\/\//, ''))}</span><span>${n} / ${of}</span></footer>`;
}
export function capabilityStatement() {
  const s = S();
  const items = s.counters.items.filter((c) => c.confirmed || C.P);
  const projs = C.projects.filter((p) => p.publish || C.P).slice(0, 6);
  const contactLine = C.people.filter((p) => p.bd && (p.consent || C.P)).map((p) => `${esc(p.name)}, ${esc(p.role)} – ${esc(p.email)}${p.consent ? '' : C.P ? ' <span class="ph">[CONFIRM]</span>' : ''}`).join('<br>') || `Send a tender package: ${esc(origin().replace(/^https?:\/\//, ''))}/contact`;
  const p1 = `<section class="page">${printHead('Capability statement')}
<h1>${esc(s.tagline)}</h1><p class="lead">${esc(s.heroSub)}</p>
<div class="kpis">${list(items, (c) => `<div><b>${esc(c.value)}</b><span>${esc(c.label)}${c.confirmed ? '' : C.P ? ' <span class="ph">[CONFIRM]</span>' : ''}</span></div>`)}</div>
<div class="two"><div><h2>What we engineer</h2><ul class="dl">${list(C.assets, (a) => `<li><b>${esc(a.name)}</b> ${esc(a.line)}</li>`)}</ul></div>
<div><h2>Services</h2><ul class="dl">${list(C.services, (x) => `<li><b>${esc(x.name)}</b> ${esc(x.line)}</li>`)}<li><b>Task force</b> Engineers deputed to the client's office.${C.P ? ' <span class="ph">[CONFIRM]</span>' : ''}</li></ul></div></div>
<h2>Who we are</h2><p>${esc(s.legalName)} was formed in ${s.formed} as the ${esc(s.groupName)}'s offshore company, working directly for offshore EPC contractors. Valdel has engineered offshore since ${s.heritageSince}. ${esc(s.team.size)} engineering personnel in ${esc(s.address.locality)}; ${esc(s.team.seniorShare)} of the offshore team has ${esc(s.team.seniorDefinition)}. ${esc(s.brandPromise)}</p>
${printFoot(1, 2)}</section>`;
  const p2 = `<section class="page">${printHead('Capability statement')}
<h2>Disciplines and software</h2><table><thead><tr><th>Discipline</th><th>What we do</th><th>Tools</th></tr></thead><tbody>${list(C.disciplines, (d) => `<tr><td><b>${esc(d.name)}</b></td><td>${esc(d.scope)}</td><td class="mono">${esc(d.tools.join(', '))}</td></tr>`)}</tbody></table>
<h2>Codes we work to</h2><p class="mono small">${esc(s.codes.items.join(' · '))}${s.codes.confirmed ? '' : C.P ? ' <span class="ph">[CONFIRM]</span>' : ''}</p>
<h2>Selected projects</h2><table><thead><tr><th>Project</th><th>Client</th></tr></thead><tbody>${list(projs, (p) => `<tr><td>${projTitle(p)}</td><td>${epcName(p)}</td></tr>`)}</tbody></table>
<div class="two"><div><h2>Quality</h2><p>${esc(s.iso.standard)} certified QMS. Checker is never the preparer; inter-discipline check before issue; transmittals and change control; change notes validated within 2 working days.</p></div>
<div><h2>Contact</h2><p class="small">${contactLine}<br>Careers: ${esc(s.careersEmail)}</p></div></div>
${printFoot(2, 2)}</section>`;
  return { path: '/capability-statement/', print: true, html: printLayout('VDE capability statement', p1 + p2) };
}
export function datasheet(d) {
  const s = S();
  const assets = C.assets.filter((a) => a.disciplines.includes(d.slug));
  const projs = C.projects.filter((p) => (p.publish || C.P) && p.disciplines.includes(d.slug)).slice(0, 4);
  const html = `<section class="page">${printHead('Discipline datasheet')}
<p class="eyebrow">Discipline</p><h1>${esc(d.name)}</h1><p class="lead">${esc(d.scope)}</p>
<div class="two"><div><h2>Typical deliverables</h2><ul>${list(d.deliverables, (x) => `<li>${esc(x)}</li>`)}</ul></div>
<div><h2>Software</h2><p class="mono">${esc(d.tools.join(' · '))}</p><h2>Assets</h2><ul>${list(assets, (a) => `<li>${esc(a.name)}</li>`)}</ul></div></div>
${projs.length ? `<h2>Project references</h2><ul>${list(projs, (p) => `<li>${projTitle(p)} – ${epcName(p)}</li>`)}</ul>` : ''}
<h2>How we deliver</h2><p>${esc(s.iso.standard)} QMS. Every deliverable is checked by an engineer other than its preparer and inter-discipline checked before issue. ${esc(s.team.size)} engineering personnel in ${esc(s.address.locality)}.</p>
<p class="cta">Send a tender package: ${esc(origin().replace(/^https?:\/\//, ''))}/contact</p>
${printFoot(1, 1)}</section>`;
  return { path: `/disciplines/${d.slug}/datasheet/`, print: true, html: printLayout(`VDE datasheet – ${d.name}`, html) };
}
