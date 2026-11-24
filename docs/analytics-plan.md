# Analytics plan

**Provider:** Plausible Analytics (cookieless, EU-hosted, no personal data) is the default. GA4 with consent
mode is supported as an alternative (set `analytics.provider` to `ga4` in the CMS). **[CONFIRM]** provider.

**Consent:** nothing non-essential loads before the visitor chooses. The banner offers *Accept analytics* /
*Essential only*; the choice is kept in local storage (`vde_consent`) and can be changed from the footer
("Cookie settings"). Events fired before consent are queued and dropped if consent is refused.

**Set-up:** create the site in Plausible, then in the CMS → Company facts → analytics set `domain` to the site
domain. For tagged events use the script `https://plausible.io/js/script.tagged-events.js` (default).
In Plausible, add each event below as a *custom event goal*.

## Events

| Event | Fired when | Properties | Code |
|---|---|---|---|
| `tender_form_start` | first focus in the tender or pre-bid form | `form` | site.js forms |
| `tender_form_submit` | tender form accepted by the server | `form` | site.js forms |
| `prebid_form_submit` | pre-bid request accepted | `form` | site.js forms |
| `file_upload` | a file is chosen in any upload field | `form`, `mb` | site.js forms |
| `download_capability` | capability statement link clicked | – | `data-track` |
| `download_datasheet` | discipline datasheet clicked | `file` | `data-track` |
| `prequal_request` | prequalification pack requested (BD e-mails it) | `form` | site.js forms |
| `job_apply` | application accepted | `form` | site.js forms |
| `form_submit` | general / vendor-docs form accepted | `form` | site.js forms |
| `email_click` | any `mailto:` link | `to` | delegated click |
| `phone_click` | any `tel:` link | – | delegated click |
| `cta_click` | header / hero / band CTAs | `cta`, `label` | `data-track="cta…"` |
| `case_study_view` | case study page load | `slug` | page type |
| `scroll_50`, `scroll_90` | 50 % / 90 % of a case study read | `slug` | page type |
| `filter_used` | project filter or matrix filter changed | filter values | site.js filters |
| `search_query` | search typed (debounced 0.9 s) | `q` (≤ 60 chars), `results` | site.js search |

Every event also carries `page` (path). In the preview build events are logged to the browser console
instead, so they can be checked without an analytics account.

## Monthly dashboard (first working day of the month, owner: BD) **[CONFIRM owner]**

1. **Leads by source** – Plausible goal conversions for `tender_form_submit`, `prebid_form_submit`,
   `prequal_request`, split by *Source / UTM* and *Entry page*. Cross-check with the Lead IDs in the
   month's Valdel One MI-inbox files (Category = "Website enquiry").
2. **Top pages before an enquiry** – Plausible *Funnels*: any page → `/contact/` → `tender_form_submit`;
   and the *Entry page* breakdown filtered on the submit goal.
3. **Form drop-off** – funnel `tender_form_start` → `tender_form_submit`. For per-field drop-off, the server
   logs which required field failed validation (HTTP 400 message); review the Pages Functions logs monthly.
4. **Content performance** – `case_study_view` with `scroll_90` rate per slug; top `search_query` terms with
   0 results (content gaps).
5. **Downloads** – capability statement, datasheets, prequalification pack.

Targets for the first 6 months **[CONFIRM]**: tender + pre-bid submissions per month, prequal downloads,
case-study 90 % scroll rate.
