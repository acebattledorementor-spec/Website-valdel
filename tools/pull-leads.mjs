// Weekly lead pull, run on the Valdel One PC (Windows Task Scheduler).
// Outbound only: Valdel One is never exposed to the internet. The script downloads new website
// leads from /api/leads-export (behind Cloudflare Access, using a service token) and drops the .xlsx
// into Valdel One's MI inbox, where BD accepts or dismisses each lead.
//
//   set SITE_ORIGIN=https://offshore.valdel.com
//   set CF_ACCESS_CLIENT_ID=...   set CF_ACCESS_CLIENT_SECRET=...   (Cloudflare Zero Trust service token)
//   set MI_INBOX=C:\...\valdel-one\data\mi_inbox                    (optional, defaults to ../valdel-one/data/mi_inbox)
//   node tools/pull-leads.mjs [--since YYYY-MM-DD]
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const origin = process.env.SITE_ORIGIN;
const inbox = process.env.MI_INBOX || path.resolve(ROOT, '..', 'valdel-one', 'data', 'mi_inbox');
const stateFile = path.join(ROOT, 'build-cache', 'pull-leads-state.json');
if (!origin || !process.env.CF_ACCESS_CLIENT_ID || !process.env.CF_ACCESS_CLIENT_SECRET) {
  console.error('Set SITE_ORIGIN, CF_ACCESS_CLIENT_ID and CF_ACCESS_CLIENT_SECRET.');
  process.exit(2);
}
const argSince = process.argv.indexOf('--since') > -1 ? process.argv[process.argv.indexOf('--since') + 1] : null;
const state = fs.existsSync(stateFile) ? JSON.parse(fs.readFileSync(stateFile, 'utf8')) : {};
const today = new Date().toISOString().slice(0, 10);
// start the day after the last pull, so no lead is exported twice
const since = argSince || (state.lastUntil ? new Date(Date.parse(state.lastUntil) + 864e5).toISOString().slice(0, 10) : new Date(Date.now() - 7 * 864e5).toISOString().slice(0, 10));
const until = new Date(Date.now() - 864e5).toISOString().slice(0, 10); // yesterday: today's leads are still arriving
if (since > until) { console.log(`Nothing to pull (since ${since} > until ${until}).`); process.exit(0); }

const res = await fetch(`${origin}/api/leads-export?since=${since}&until=${until}`, {
  headers: { 'CF-Access-Client-Id': process.env.CF_ACCESS_CLIENT_ID, 'CF-Access-Client-Secret': process.env.CF_ACCESS_CLIENT_SECRET },
});
if (!res.ok) { console.error(`Export failed: HTTP ${res.status} ${await res.text()}`); process.exit(1); }
const count = +(res.headers.get('x-lead-count') || 0);
if (count > 0) {
  fs.mkdirSync(inbox, { recursive: true });
  const file = path.join(inbox, `website_leads_${since}_to_${until}.xlsx`);
  fs.writeFileSync(file, Buffer.from(await res.arrayBuffer()));
  console.log(`${count} lead(s) -> ${file}`);
} else {
  console.log(`No new website leads ${since} to ${until}.`);
}
fs.mkdirSync(path.dirname(stateFile), { recursive: true });
fs.writeFileSync(stateFile, JSON.stringify({ lastUntil: until, lastRun: today, lastCount: count }, null, 2));
