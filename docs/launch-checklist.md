# Launch checklist

Work top to bottom. Items marked **VDE** need content or a decision from VDE; the rest is set-up.
Run `npm run build:preview` first: [open-items-report.md](open-items-report.md) lists every open content item.

## 1. Content and permissions (VDE)

- [ ] Domain decided (e.g. `offshore.valdel.com`); set in CMS → Company facts → domain, tick *confirmed*
- [ ] Full office address, phone, LinkedIn URL, map link, office hours (IST)
- [ ] Vector logo files (SVG) replace the interim wordmark in `src/lib.mjs` (`logo()`) and `src/static/img/logo.svg`
- [ ] ISO 9001:2015 certificate: number, body, expiry; certificate PDF
- [ ] Track-record counters (15+ projects, 7 active awards) confirmed and dated ("as of …")
- [ ] **Written permission** for each client name / logo; tick *permission* per client and per project
- [ ] Each case study reviewed by its project lead; fact-panel figures added (real figures only)
- [ ] Shell Manatee kept `publish = false` until award and permission
- [ ] Real images: model renders and photos cleared for publication, with captions and alt text
- [ ] Leadership bios with written consent; decide which BD contacts appear publicly
- [ ] Response-time commitment ("replies within 1 working day"), calendar link, mutual NDA template
- [ ] Upload retention (90 days?), CV retention, enquiry retention; grievance officer name and e-mail
- [ ] Prequalification pack ready for BD to e-mail on request; vendor registrations; insurance
- [ ] Open positions with position codes (HR)
- [ ] Target markets / regions for SEO; design codes list reviewed by HODs; capability matrix reviewed
- [ ] Privacy notice and terms reviewed by counsel

## 2. Repository and CMS

- [ ] Create the GitHub repository (private) and push this folder (`.gitignore` excludes builds and local data)
- [ ] Set `backend.repo` in `src/static/admin/config.yml`
- [ ] GitHub OAuth for Decap: create a GitHub OAuth app and deploy an OAuth proxy (e.g. the open-source
      `decap-proxy` Cloudflare Worker); set `backend.base_url`. Give editors write access to the repo
- [ ] Decide who can publish (editorial workflow: editors draft, a reviewer publishes)

## 3. Cloudflare

- [ ] Pages project from the GitHub repo. Build command: `npm run build` · Output: `dist` · Node 20+
- [ ] Note: PDFs are generated locally (`npm run pdf`) and cached in `build-cache/`; for CI either commit
      `build-cache/dist/downloads/` (remove it from `.gitignore`) or upload the PDFs to `src/static/downloads/`
- [ ] Custom domain + HTTPS; HSTS is sent by `_headers` (preload only once the domain is final)
- [ ] R2 bucket `vde-website-leads` (private, no public access); binding `LEADS`
- [ ] R2 **lifecycle rule**: delete objects under `uploads/` after 90 days **[CONFIRM period]**
- [ ] KV namespace for rate limiting; binding `RATE`
- [ ] Turnstile widget for the domain; site key in CMS (`turnstileSiteKey`), secret as `TURNSTILE_SECRET`
- [ ] E-mail: Resend (or compatible) account, sender domain verified (SPF/DKIM on `valdelec.com`);
      secrets `MAIL_API_KEY`, `MAIL_FROM`, `BD_INBOX`, `HR_INBOX`
- [ ] `NDA_TEMPLATE_URL`, `SITE_ORIGIN`
- [ ] Virus scanning of uploads **[CONFIRM provider]**: set `SCAN_URL`/`SCAN_KEY` to a scanning service
      (e.g. a ClamAV container or a commercial scanning API that returns `{"clean": true|false}`). Until then
      uploads are marked "not scanned" in the BD e-mail; BD opens them only on a scanned workstation
- [ ] Cloudflare Zero Trust **Access** application protecting `/api/leads-export*`, `/api/file*` and `/admin*`
      (BD and web editors only). Set `ACCESS_TEAM_DOMAIN` and `ACCESS_AUD`
- [ ] Access **service token** for the weekly lead pull
- [ ] WAF rate-limiting rule on `/api/submit` (backs up the KV limit)

## 4. Valdel One lead inbox

- [ ] On the Valdel One PC, create a scheduled task (weekly, e.g. Monday 08:00):
      `node tools\pull-leads.mjs` with `SITE_ORIGIN`, `CF_ACCESS_CLIENT_ID`, `CF_ACCESS_CLIENT_SECRET`
      (and `MI_INBOX` if Valdel One is not in `..\valdel-one`)
- [ ] First run: `node tools\pull-leads.mjs --since <launch date>`; open Valdel One → Market Intelligence and
      check the leads appear (Category "Website enquiry")
- [ ] `npm test` passes (it reads the export with Valdel One's own `mi.py`)

## 5. Quality gates before go-live

- [ ] `npm run build` shows no warnings except PDFs; `npm run pdf` run after content changes
- [ ] Lighthouse (mobile) ≥ 95 in all four categories on Home, a case study, Contact
- [ ] Core Web Vitals: LCP < 2.5 s, INP < 200 ms, CLS < 0.1 (PageSpeed Insights after launch)
- [ ] Keyboard-only walk-through: menu, search (/), filters, forms, cookie banner; visible focus everywhere
- [ ] Screen reader spot check (NVDA) of Home, Contact, a case study
- [ ] Submit each form on the live site: BD / HR e-mail arrives, auto-reply arrives, record in R2,
      NDA reply link correct, prequal request reaches BD
- [ ] Production build checked: no [ADD] / [CONFIRM] markers, no unconfirmed client names
      (the build warns if any appear)
- [ ] `robots.txt` and `sitemap.xml` correct; submit the sitemap in Google Search Console and Bing
- [ ] Google Business Profile for the Bengaluru office **(VDE)**
- [ ] Rich results test: Organization, Service, FAQPage, BreadcrumbList, JobPosting
- [ ] Open Graph preview checked in LinkedIn Post Inspector

## 6. After launch

- [ ] Uptime monitoring (e.g. Cloudflare health check or UptimeRobot) on `/` and `/api/submit` (405 = up)
- [ ] Named owner for site updates and for the monthly analytics dashboard **[CONFIRM]**
- [ ] Backups: the Git repository is the content backup; enable R2 object versioning or a weekly export
      of `leads/` for the enquiry records
- [ ] Review certificates monthly (expired ones hide automatically, but renewals must be uploaded)
