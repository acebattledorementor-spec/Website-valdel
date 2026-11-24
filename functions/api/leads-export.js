// GET /api/leads-export?since=YYYY-MM-DD[&until=YYYY-MM-DD]
// BD-only (Cloudflare Access). Returns an .xlsx in Valdel One's MI lead-inbox format (sheet "Leads"),
// ready to drop into valdel-one/data/mi_inbox/. Job applications are excluded.
import { buildXlsx } from '../_lib/xlsx.js';
import { LEAD_COLS, toLeadRow, isLead } from '../_lib/leads.js';
import { requireAccess } from '../_lib/access.js';

export async function onRequestGet({ request, env }) {
  const denied = await requireAccess(request, env);
  if (denied) return denied;
  return exportLeads(request, env);
}

export async function exportLeads(request, env) {
  const url = new URL(request.url);
  const today = new Date().toISOString().slice(0, 10);
  const since = /^\d{4}-\d{2}-\d{2}$/.test(url.searchParams.get('since') || '') ? url.searchParams.get('since') : new Date(Date.now() - 7 * 864e5).toISOString().slice(0, 10);
  const until = /^\d{4}-\d{2}-\d{2}$/.test(url.searchParams.get('until') || '') ? url.searchParams.get('until') : today;
  const recs = [];
  let cursor;
  do {
    const page = await env.LEADS.list({ prefix: 'leads/', cursor });
    for (const o of page.objects) {
      const obj = await env.LEADS.get(o.key);
      if (!obj) continue;
      const rec = JSON.parse(await obj.text());
      const day = rec.receivedAt.slice(0, 10);
      if (day >= since && day <= until && isLead(rec)) recs.push(rec);
    }
    cursor = page.truncated ? page.cursor : undefined;
  } while (cursor);
  recs.sort((a, b) => a.receivedAt.localeCompare(b.receivedAt));
  const bytes = buildXlsx([LEAD_COLS, ...recs.map(toLeadRow)], 'Leads');
  return new Response(bytes, {
    headers: {
      'content-type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'content-disposition': `attachment; filename="website_leads_${since}_to_${until}.xlsx"`,
      'cache-control': 'no-store',
      'x-lead-count': String(recs.length),
    },
  });
}
