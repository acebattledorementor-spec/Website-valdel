# VDE offshore website

Website for **Valdel Design Engineering Pvt. Ltd.**, the offshore engineering company of the Valdel Group.
Static site, built by a small Node script with **no npm dependencies**, hosted on Cloudflare Pages, with
forms handled by Cloudflare Pages Functions and content edited in Decap CMS.

The brief is [VDE_Offshore_Website_Prompt.md](VDE_Offshore_Website_Prompt.md).

## Quick start

Requires Node 20 or later. Nothing to install.

```
npm run build:preview   # preview/  – draft build: every [ADD] / [CONFIRM] item is visible
npm run build           # dist/     – production build: unconfirmed items hidden or anonymised
npm run pdf             # capability statement + 10 discipline datasheets (needs Chrome or Edge)
npm run serve:preview   # http://localhost:8081  (forms work locally, stored in .local-data/)
npm run serve           # http://localhost:8080
npm test                # end-to-end test of forms and the Valdel One lead export
```

## Two builds, one rule

The brief says: never publish an unconfirmed client name, logo or figure. Every such item in `content/` carries
a flag (`permission`, `confirmed`, `consent`, `publish`):

| Build | What happens to an unconfirmed item |
|---|---|
| `preview/` | shown with a yellow **[ADD]**, **[CONFIRM]** or **[REVIEW]** marker; pages are `noindex` |
| `dist/` | hidden, or replaced by its anonymised form (e.g. "Offshore EPC contractor") |

`npm run build:preview` writes [docs/open-items-report.md](docs/open-items-report.md): the list of everything
VDE still has to add or confirm, with the pages it affects. The production build also fails loudly (as a warning
list) if an unconfirmed client name appears on any page or PDF.

## Folders

```
content/            all text and data (edited in the CMS at /admin)
  site.json         company facts, counters, certificates, clients (+ permission ticks), contacts
  assets.json       6 asset types          services.json   9 services
  disciplines.json  10 disciplines         people.json     leadership and BD contacts
  projects/*.json   case studies           jobs/*.json     open positions     news/*.json   insights
src/
  build.mjs         the build: renders pages, sitemap, search index, headers, QA checks
  lib.mjs           layout, components, forms, icons, draft-marker helpers
  pages.mjs         one function per page template, plus the print documents
  static/           css, js (15 KB), fonts (self-hosted), admin (Decap CMS), images
functions/          Cloudflare Pages Functions
  api/submit.js         every form posts here: validation, spam checks, private storage, e-mail
  api/leads-export.js   BD-only .xlsx export in Valdel One's MI-inbox format
  api/file.js           BD-only download of uploaded tender files
  _lib/                 xlsx writer, lead mapping, Cloudflare Access check
tools/              serve (local), make-pdfs, test-lead-export, pull-leads (weekly, on the Valdel One PC)
docs/               wireframes, analytics plan, launch checklist, how-to-update guide
```

## Checks the build runs every time

- every title ≤ 60 characters, every description ≤ 155, exactly one `<h1>` per page
- every internal link resolves; no `href="#"` placeholders; every `<img>` has `alt`
- every service page is ≤ 3 clicks from the home page (currently 1)
- production: no client name without a permission tick on any page or PDF
- content integrity: every asset / service / discipline slug a project uses exists

## Related documents

- [docs/sitemap-and-wireframes.md](docs/sitemap-and-wireframes.md) – sitemap and desktop / mobile wireframes
- `/design-system/` on the preview site – colour, type, spacing and component reference
- [docs/analytics-plan.md](docs/analytics-plan.md) – events, consent, monthly dashboard
- [docs/launch-checklist.md](docs/launch-checklist.md) – Cloudflare set-up and go-live steps
- [docs/how-to-update.md](docs/how-to-update.md) – one-page guide for VDE staff
- [docs/open-items-report.md](docs/open-items-report.md) – generated list of [ADD] / [CONFIRM] items
