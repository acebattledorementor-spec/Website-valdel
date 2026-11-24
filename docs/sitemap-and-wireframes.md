# Sitemap and wireframes

The wireframes below are the structure of the built pages; the preview build (`npm run serve:preview`) is the
high-fidelity version. Desktop uses a 12-column grid (max 76 rem); mobile is a single column below 960 px.

## Sitemap (50 pages in production)

```
/                                   Home
├── /capabilities/                  Capability matrix (asset × service), filterable
│   └── /capabilities/<asset>/      wellhead-platforms-jackets · process-platforms · fpso-topsides
│                                   subsea-pipelines · brownfield · offshore-wind
├── /services/                      Service index
│   └── /services/<service>/        pre-bid (flagship, with form) · concept-feed · detail-engineering
│                                   installation-engineering · yard-support · procurement-expediting
│                                   verification · as-built-3d · weight-control
├── /disciplines/                   10 disciplines, software, datasheet PDFs
│   └── /disciplines/<discipline>/  one page each (+ /datasheet/ print page → PDF, noindex)
├── /projects/                      Case-study library, faceted filters in the URL
│   └── /projects/<slug>/           Case study: Challenge → Approach + fact panel
├── /how-we-work/                   Delivery process, quality checks, document control, NDA, QMS
├── /prequalification/              Gated pack, company details, certificates, vendor-docs form
├── /about/                         Heritage timeline, VDE today, office, Valdel Group / onshore link
│   └── /about/leadership/          Leadership and lead engineers (published with consent)
├── /careers/                       Open positions, life at VDE, apply form (DPDP consent)
│   └── /careers/<code>/            Job page with JobPosting schema
├── /insights/                      Notes and news (noindex until the first article)
├── /contact/                       Tender package / RFQ form · general enquiry · office
│   └── /contact/thanks/            Confirmation: response commitment, BD contact, calendar link
├── /privacy/  /terms/  /cookies/   Legal (DPDP Act 2023)
└── /design-system/                 Internal reference (noindex)
Downloads: /downloads/VDE-Capability-Statement.pdf · /downloads/VDE-Datasheet-<discipline>.pdf
```

Header (all pages): logo · Capabilities · Projects · How we work · Prequalification · About · Careers · search (/) ·
**Send a tender package**. Every service is 1 click from home (lifecycle strip, footer) and 2 from any page.

---

## Home

```
DESKTOP                                                     MOBILE (≤ 960 px)
┌──────────────────────────────────────────────────────┐   ┌────────────────────┐
│ LOGO  Capabilities Projects How… Preq… About Careers │   │ LOGO        [⌕][≡] │
│                                  [⌕] [SEND A TENDER] │   ├────────────────────┤
├──────────────────────────────────────────────────────┤   │ H1 Offshore        │
│ H1 Offshore engineering for    ┌──────────────────┐  │   │ engineering for…   │
│ EPC contractors – from tender  │ FIG. real E3D /  │  │   │ sub-line           │
│ to installation.               │ SACS render      │  │   │ [SEND A TENDER]    │
│ sub-line (assets, ISO 9001)    │ (caption block)  │  │   │ [↓ CAPABILITY]     │
│ [SEND A TENDER] [↓ CAPABILITY] └──────────────────┘  │   │ [render]           │
├──────────┬──────────┬──────────┬─────────────────────┤   ├─────────┬──────────┤
│ 15+ proj │ 50+ eng  │ 55% 15y+ │ 7 awards  (as of …) │   │ 15+     │ 50+      │
├──────────┴──────────┴──────────┴─────────────────────┤   │ 55%     │ 7        │
│ [EPC manager] [Procurement] [Operator] [Engineer]    │   ├─────────┴──────────┤
│  4 role doors, each with a primary link              │   │ door 1 … door 4    │
├──────────────────────────────────────────────────────┤   │ (stacked)          │
│ Six asset types: 3 × 2 cards (icon, line, projects→) │   │ asset cards ×6     │
├──────────────────────────────────────────────────────┤   │ lifecycle: swipe → │
│ 01 Concept → 02 Pre-bid → … → 08 As-built (links)    │   │ case studies ×3    │
├──────────────────────────────────────────────────────┤   │ client names       │
│ 3 featured case studies (tags, title, scope line)    │   │ why VDE ×4         │
│ Client strip (permission only, greyscale)            │   │ prequal band       │
│ Why EPCs choose VDE: 4 proof points with evidence    │   │ careers band       │
│ Prequalification band            [GET THE PACK]      │   │ footer             │
│ Careers band (navy): growing to ~90  [POSITIONS]     │   └────────────────────┘
│ Footer: address, assets, services, BD, group/onshore │
└──────────────────────────────────────────────────────┘
```

## Capability matrix (`/capabilities/`)

```
┌──────────────────────────────────────────────────────┐   MOBILE: filters stack; the matrix
│ crumbs · H1 What we engineer, and how · lead         │   scrolls sideways with the asset
│ [Asset ▾] [Service ▾]   (dims other rows / columns)  │   column sticky on the left.
│ ┌────────────┬──────┬──────┬──────┬─────┬── … ──┐    │
│ │            │Prebid│ FEED │Detail│Inst.│  …    │    │
│ │ Wellhead   │ [1]  │ [1]  │ [1]  │  ●  │       │    │   [n] = n case studies → /projects?asset&service
│ │ Process    │  ●   │ [1]  │  ●   │  ●  │       │    │   ●   = offered → service page
│ │ …          │      │      │      │     │       │    │   –   = not a typical scope
│ └────────────┴──────┴──────┴──────┴─────┴───────┘    │
│ By asset: 6 cards · By service: 9 cards · CTA band    │
└──────────────────────────────────────────────────────┘
```

## Asset page (`/capabilities/<asset>/`)

```
┌──────────────────────────────────────────────────────┐   MOBILE: single column; facts panel
│ crumbs · H1 asset · intro · [SEND A TENDER]  [render]│   follows the deliverables.
├────────────────────────────────────┬─────────────────┤
│ What we deliver (2-column ticks)   │ CODES & TOOLS   │
│ Services for this asset (chips)    │ API RP 2A, ISO… │
│ Disciplines involved (chips)       │ SACS, Tekla…    │
├────────────────────────────────────┴─────────────────┤
│ <Asset> case studies (auto-filtered cards)           │
│ Questions buyers ask (3–5 FAQ, FAQPage schema)       │
│ CTA: Send a tender package for a <asset> scope       │
└──────────────────────────────────────────────────────┘
```

## Service page (`/services/<service>/`)

```
┌──────────────────────────────────────────────────────┐
│ crumbs · H1 service · one-sentence line · [CTA]      │
├────────────────────────────────────┬─────────────────┤
│ When EPCs use it (trigger, red rule)│ ASSETS          │
│ Typical deliverables · Turnaround  │ icon + link ×n  │
│ How we run it (numbered steps)     │                 │
│ Commercial models table            │                 │
├────────────────────────────────────┴─────────────────┤
│ PRE-BID ONLY: Request pre-bid support form           │
│   (name, company, e-mail, message, BID DUE DATE …)   │
│ Related projects · CTA band                          │
└──────────────────────────────────────────────────────┘
```

## Projects list (`/projects/`)

```
┌──────────────────────────────────────────────────────┐   MOBILE: filters in a 2-up grid,
│ H1 Offshore engineering case studies                  │   cards stacked.
│ [Asset▾][Service▾][Region▾][Client type▾][Year▾]     │
│ [Status▾][Software▾]      (state kept in the URL)    │
│ 7 projects                              Clear filters │
│ [card] [card] [card]                                 │
│ [card] [card] [card] …                               │
│ "Some work is under NDA" · CTA band                  │
└──────────────────────────────────────────────────────┘
```

## Case study (`/projects/<slug>/`)

```
┌──────────────────────────────────────────────────────┐
│ crumbs · CASE STUDY · H1 title · scope               │
├────────────────────────────────────┬─────────────────┤
│ Challenge (2–3 sentences)          │ PROJECT FACTS   │
│ Engineering approach (bullets)     │ EPC · End user  │
│ Visuals with captions              │ Asset · Region  │
│                                    │ Scope · Services│
│ Visuals with captions              │ Disciplines     │
│ Client quote (with permission)     │ Codes · Software│
│                                    │ Water depth …   │
├────────────────────────────────────┴─────────────────┤
│ Related projects · CTA: Send a tender package for a  │
│ similar scope (asset pre-selected in the form)       │
└──────────────────────────────────────────────────────┘
```

## Prequalification (`/prequalification/`)

```
┌──────────────────────────────────────────────────────┐
│ H1 Prequalify VDE as a vendor                        │
├────────────────────────────────────┬─────────────────┤
│ Pack contents table                │ GET THE PACK    │
│ (document · in the pack)           │ e-mail*, company│
│                                    │ → signed link   │
├────────────────────────┬───────────┴─────────────────┤
│ Company details panel  │ Certificates (issuer, no.,  │
│ (legal name, GST/PAN…) │ expiry; expired auto-hidden)│
│                        │ Vendor registrations · HSE  │
├────────────────────────┴─────────────────────────────┤
│ Request vendor registration documents form           │
└──────────────────────────────────────────────────────┘
```

## Careers (`/careers/`)

```
┌──────────────────────────────────────────────────────┐
│ H1 We are growing to about 90 engineers by mid-2027  │
│ Open positions list (code · discipline · location)   │
│ How to apply by e-mail (code in subject)             │
│ Life at VDE: variety · software · training · growth  │
│ Apply form: name, e-mail, code, note,                │
│   PERSONAL DATA NOTICE + consent tick → CV upload    │
└──────────────────────────────────────────────────────┘
```

## Contact (`/contact/`)

```
┌──────────────────────────────────────────────────────┐   MOBILE: tabs become two buttons;
│ H1 Send a tender package · response commitment       │   office panel after the forms.
├────────────────────────────────────┬─────────────────┤
│ [TENDER PACKAGE / RFQ] [GENERAL]   │ OFFICE          │
│ Name* Company* E-mail* Project     │ address, map,   │
│ Message*                           │ phone, hours IST│
│ ▸ Add project details (optional):  │ BD contacts     │
│   asset, region, services, end     │ careers e-mail  │
│   user, bid date, timeline, scope, │                 │
│   file ≤100 MB or share link, NDA  │                 │
│ Confidentiality + privacy notice   │                 │
│ [SEND TENDER PACKAGE]              │                 │
│ General enquiry (4 fields)         │                 │
└────────────────────────────────────┴─────────────────┘
```
