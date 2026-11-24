// End-to-end test of the form back-end and the Valdel One lead export.
//   1. posts sample forms through the real functions/api/submit.js (local disk store)
//   2. checks validation, honeypot and job-application exclusion
//   3. exports the .xlsx through functions/api/leads-export.js
//   4. asks Valdel One's own mi.py to read it (needs ../valdel-one/.venv), and round-trips a save like "Accept" does
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { diskR2 } from './local-env.mjs';
import { onRequestPost } from '../functions/api/submit.js';
import { exportLeads } from '../functions/api/leads-export.js';
import { LEAD_COLS } from '../functions/_lib/leads.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const TMP = path.join(ROOT, 'build-cache', 'test');
fs.rmSync(TMP, { recursive: true, force: true });
fs.mkdirSync(TMP, { recursive: true });
const env = { LEADS: diskR2(path.join(TMP, 'store')), SITE_ORIGIN: 'http://localhost' };

let failures = 0;
const check = (cond, msg) => { console.log(`${cond ? 'PASS' : 'FAIL'}  ${msg}`); if (!cond) failures++; };
async function post(fields, file) {
  const fd = new FormData();
  for (const [k, v] of Object.entries(fields)) [].concat(v).forEach((x) => fd.append(k, x));
  if (file) fd.append('file', new Blob([file.data]), file.name);
  const r = await onRequestPost({ request: new Request('http://localhost/api/submit', { method: 'POST', body: fd, headers: { accept: 'application/json' } }), env });
  return { status: r.status, json: await r.json() };
}

const base = { page_url: 'http://localhost/contact/', website: '' };
const t1 = await post({ ...base, form_type: 'tender', name: 'A. Engineer', company: 'Example EPC Ltd', email: 'a.engineer@example-epc.com', message: 'Detail engineering for two 4-legged jackets.\nIFC needed by Q3.', project: 'Example field WHP-2 & WHP-3', asset: 'wellhead-platforms-jackets', region: 'Middle East', services: ['detail-engineering', 'weight-control'], end_user: 'Example NOC', bid_due_date: '2026-12-15', est_scope: '18,000 man-hours', nda: 'yes' }, { name: 'ITB volume 1.pdf', data: '%PDF-1.4 test' });
check(t1.status === 200 && t1.json.ok && /^WEB-\d{8}-[A-Z0-9]{6}$/.test(t1.json.id), `tender accepted (${t1.json.id})`);
const t2 = await post({ ...base, form_type: 'prebid', name: 'B. Estimator', company: 'Other EPC', email: 'b@other-epc.com', message: 'Weight estimate and MTO for an OSS jacket.', asset: 'offshore-wind', bid_due_date: '2026-12-01' });
check(t2.json.ok, 'pre-bid request accepted');
const t3 = await post({ ...base, form_type: 'prequal', name: 'D. Buyer', email: 'buyer@operator.com', company: 'Operator Co' });
check(t3.json.ok && !t3.json.download, 'prequal request accepted, no download link (BD e-mails the pack)');
const t3b = await post({ ...base, form_type: 'prequal', email: 'buyer@operator.com' });
check(t3b.status === 400, 'prequal request without name and company rejected');
const t4 = await post({ ...base, form_type: 'job_apply', name: 'C. Designer', email: 'c@example.com', message: 'E3D designer, 8 years.', consent: 'yes' }, { name: 'cv.pdf', data: '%PDF cv' });
check(t4.json.ok, 'job application accepted');
const bad1 = await post({ ...base, form_type: 'tender', name: 'X', company: 'Y', email: 'not-an-email', message: 'm' });
check(bad1.status === 400 && !bad1.json.ok, 'invalid e-mail rejected server-side');
const bad2 = await post({ ...base, form_type: 'tender', name: 'X', company: 'Y', email: 'x@y.com' });
check(bad2.status === 400, 'missing required message rejected');
const bad3 = await post({ ...base, form_type: 'tender', name: 'X', company: 'Y', email: 'x@y.com', message: 'm' }, { name: 'malware.exe', data: 'MZ' });
check(bad3.status === 400 && /not accepted/.test(bad3.json.error), 'disallowed file type rejected');
const bad4 = await post({ ...base, form_type: 'job_apply', name: 'X', email: 'x@y.com', message: 'm' });
check(bad4.status === 400, 'job application without consent rejected');
const spam = await post({ ...base, form_type: 'tender', name: 'Bot', company: 'Bot', email: 'bot@bot.com', message: 'buy', website: 'http://spam' });
check(spam.json.ok && !spam.json.id, 'honeypot submission silently dropped');

const stored = (await env.LEADS.list({ prefix: 'leads/' })).objects.length;
check(stored === 4, `4 records stored (got ${stored})`);
const up = (await env.LEADS.list({ prefix: 'uploads/' })).objects.map((o) => o.key);
check(up.length === 2 && up.every((k) => /^uploads\/WEB-/.test(k)), 'uploads stored privately under uploads/<lead id>/');

// export
const today = new Date().toISOString().slice(0, 10);
const res = await exportLeads(new Request(`http://localhost/api/leads-export?since=${today}`), env);
const xlsxPath = path.join(TMP, `website_leads_${today}.xlsx`);
fs.writeFileSync(xlsxPath, Buffer.from(await res.arrayBuffer()));
check(res.headers.get('x-lead-count') === '3', `export has 3 leads, job application excluded (got ${res.headers.get('x-lead-count')})`);

// Valdel One reads it
const py = path.resolve(ROOT, '..', 'valdel-one', '.venv', 'Scripts', 'python.exe');
const v1 = path.resolve(ROOT, '..', 'valdel-one');
if (!fs.existsSync(py)) {
  console.log(`SKIP  Valdel One check: ${py} not found`);
} else {
  const script = `
import sys, json, shutil
sys.path.insert(0, r"${v1}")
import mi
from openpyxl import load_workbook
src = r"${xlsxPath}"
wb, ws, col, rows = mi._read(src)
hdr = [c.value for c in ws[1]]
out = {"sheet": ws.title, "header_ok": hdr == mi.LEAD_COLS, "rows": len(rows),
       "client": [mi._client_name(r)[0] for r in rows],
       "pending": all(r.get("Status") in mi.PENDING for r in rows),
       "first": {k: rows[0].get(k) for k in ["Lead ID","Category","EPC / Contractor","End User","Project","Facility","Region","Sector","Service","Project Status","Timeline","Source Link"]}}
# round trip like mi.mark(): write Status back and save with openpyxl
cp = src.replace(".xlsx", "_roundtrip.xlsx"); shutil.copy(src, cp)
wb2, ws2, col2, rows2 = mi._read(cp)
ws2.cell(row=rows2[0]["_row"], column=col2["Status"], value="Accepted"); wb2.save(cp)
out["roundtrip_status"] = mi._read(cp)[3][0]["Status"]
lists = load_workbook(r"${v1}\\data\\BDOS_MASTER.xlsx", read_only=True)["13_Lists"]
lr = list(lists.iter_rows(values_only=True)); h = lr[0]
pick = lambda name: {r[h.index(name)] for r in lr[1:] if r[h.index(name)] is not None}
out["picklists_ok"] = all((not r.get(k)) or r.get(k) in pick(n) for r in rows for k, n in [("Facility","Facility"),("Region","Region"),("Sector","Sector"),("Service","Service"),("Project Status","Project Status")])
print(json.dumps(out, default=str))
`;
  const r = JSON.parse(execFileSync(py, ['-c', script], { encoding: 'utf8' }).trim().split('\n').pop());
  check(r.sheet === 'Leads' && r.header_ok, 'Valdel One mi.py reads sheet "Leads" with the exact LEAD_COLS header');
  check(r.rows === 3 && r.pending, 'Valdel One sees 3 pending leads');
  check(r.client.includes('Example EPC Ltd'), 'Valdel One matches the client from "EPC / Contractor"');
  check(r.picklists_ok, 'Facility / Region / Sector / Service / Project Status match Valdel One picklists');
  check(r.roundtrip_status === 'Accepted', 'file survives the openpyxl save that Valdel One does on Accept');
  console.log('      first lead as Valdel One sees it:', JSON.stringify(r.first));
}
check(LEAD_COLS.length === 32, 'LEAD_COLS has 32 columns');
console.log(failures ? `\n${failures} check(s) failed` : '\nAll checks passed');
process.exit(failures ? 1 : 0);
