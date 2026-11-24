// POST /api/submit – every website form posts here (Cloudflare Pages Function).
// Bindings / secrets (Cloudflare dashboard → Pages project → Settings):
//   LEADS            R2 bucket, private. leads/<id>.json, uploads/<id>/<file>
//   RATE             KV namespace for rate limiting (optional but recommended)
//   TURNSTILE_SECRET Cloudflare Turnstile secret key
//   MAIL_API_KEY     e-mail API key (Resend-compatible), MAIL_FROM e.g. "VDE website <web@valdelec.com>"
//   BD_INBOX         comma-separated BD addresses; HR_INBOX for job applications
//   SITE_ORIGIN      e.g. https://offshore.valdel.com ; NDA_TEMPLATE_URL (link sent when NDA is ticked)
//   SCAN_URL / SCAN_KEY  optional virus-scanning endpoint for uploads (see docs/launch-checklist.md)
import { FORM_LABELS } from '../_lib/leads.js';

const LIMITS = { short: 200, message: 5000 };
const REQUIRED = {
  tender: ['name', 'company', 'email', 'message'], prebid: ['name', 'company', 'email', 'message'], general: ['name', 'company', 'email', 'message'],
  prequal: ['name', 'company', 'email'], vendor_docs: ['name', 'company', 'email', 'message'], job_apply: ['name', 'email', 'message'],
};
const FILE_RULES = {
  tender: { ext: ['pdf', 'dwg', 'dxf', 'xlsx', 'xls', 'docx', 'doc', 'zip'], mb: 100 },
  prebid: { ext: ['pdf', 'dwg', 'dxf', 'xlsx', 'xls', 'docx', 'doc', 'zip'], mb: 100 },
  job_apply: { ext: ['pdf', 'doc', 'docx'], mb: 10 },
};
const TEXT_FIELDS = ['name', 'company', 'email', 'message', 'project', 'asset', 'region', 'end_user', 'bid_due_date', 'timeline', 'est_scope', 'share_link', 'nda', 'portal', 'deadline', 'position', 'experience', 'consent', 'context', 'page_url'];
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export async function onRequestPost({ request, env }) {
  const wantsJson = (request.headers.get('accept') || '').includes('application/json');
  const reply = (status, body, redirect) => (wantsJson || !redirect
    ? new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } })
    : Response.redirect(new URL(redirect, request.url).toString(), 303));
  const fail = (msg, status = 400) => reply(status, { ok: false, error: msg });

  let form;
  try { form = await request.formData(); } catch { return fail('The form could not be read.'); }
  const type = String(form.get('form_type') || '');
  if (!REQUIRED[type]) return fail('Unknown form.');

  // honeypot: bots fill the hidden "website" field. Pretend success, store nothing.
  if (String(form.get('website') || '').trim()) return reply(200, { ok: true }, `/contact/thanks/?type=${type}`);

  // rate limit: 8 submissions per IP per hour
  const ip = request.headers.get('cf-connecting-ip') || 'local';
  if (env.RATE) {
    const key = `rl:${ip}:${new Date().toISOString().slice(0, 13)}`;
    const n = parseInt((await env.RATE.get(key)) || '0', 10);
    if (n >= 8) return fail('Too many submissions from your network. Please try again in an hour or e-mail us.', 429);
    await env.RATE.put(key, String(n + 1), { expirationTtl: 3700 });
  }

  // Turnstile (spam protection)
  if (env.TURNSTILE_SECRET) {
    const token = form.get('cf-turnstile-response');
    const v = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', { method: 'POST', body: new URLSearchParams({ secret: env.TURNSTILE_SECRET, response: String(token || ''), remoteip: ip }) }).then((r) => r.json()).catch(() => ({ success: false }));
    if (!v.success) return fail('Spam check failed. Please reload the page and try again.');
  }

  // server-side validation
  const fields = {};
  for (const k of TEXT_FIELDS) {
    const v = form.get(k);
    if (v !== null && typeof v === 'string' && v.trim()) fields[k] = v.trim().slice(0, k === 'message' ? LIMITS.message : LIMITS.short * (k === 'page_url' || k === 'share_link' ? 5 : 1));
  }
  const services = form.getAll('services').map(String).filter((s) => /^[a-z0-9-]{2,40}$/.test(s)).slice(0, 12);
  if (services.length) fields.services = services;
  for (const k of REQUIRED[type]) if (!fields[k]) return fail(`Please fill in: ${k.replace('_', ' ')}.`);
  if (!EMAIL.test(fields.email || '')) return fail('Please enter a valid e-mail address.');
  if (fields.share_link && !/^https?:\/\//i.test(fields.share_link)) return fail('The share link must start with https://');
  if (type === 'job_apply' && fields.consent !== 'yes') return fail('Please confirm the personal data notice.');

  const id = `WEB-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${crypto.randomUUID().slice(0, 6).toUpperCase()}`;
  const rec = { id, type, receivedAt: new Date().toISOString(), country: request.cf?.country || '', fields };

  // file upload: private storage only, never publicly linkable
  const file = form.get('file');
  if (file && typeof file === 'object' && file.size > 0) {
    const rule = FILE_RULES[type];
    if (!rule) return fail('Files cannot be attached to this form.');
    const ext = (file.name.split('.').pop() || '').toLowerCase();
    if (!rule.ext.includes(ext)) return fail(`File type .${ext} is not accepted. Use ${rule.ext.join(', ').toUpperCase()}.`);
    if (file.size > rule.mb * 1048576) return fail(`The file is larger than ${rule.mb} MB. Send a link to your document share instead.`);
    const safe = file.name.replace(/[^A-Za-z0-9._-]+/g, '_').slice(-120);
    const key = `uploads/${id}/${safe}`;
    let scan = 'not scanned';
    if (env.SCAN_URL) {
      try {
        const r = await fetch(env.SCAN_URL, { method: 'POST', headers: { authorization: `Bearer ${env.SCAN_KEY || ''}`, 'content-type': 'application/octet-stream', 'x-filename': safe }, body: file.stream() });
        const j = await r.json();
        scan = j.clean === true ? 'clean' : j.clean === false ? 'INFECTED' : 'scan error';
      } catch { scan = 'scan error'; }
      if (scan === 'INFECTED') return fail('The file was rejected by our virus scan. Please send a clean copy or a share link.');
    }
    if (env.LEADS) await env.LEADS.put(key, file.stream(), { httpMetadata: { contentType: 'application/octet-stream', contentDisposition: `attachment; filename="${safe}"` }, customMetadata: { leadId: id, scan } });
    rec.file = { key, name: safe, size: file.size, scan };
  }

  if (env.LEADS) await env.LEADS.put(`leads/${id}.json`, JSON.stringify(rec), { httpMetadata: { contentType: 'application/json' } });


  // notify BD (or HR) and confirm to the sender. Mail failures never lose the record: it is already stored.
  const origin = env.SITE_ORIGIN || new URL(request.url).origin;
  const to = (type === 'job_apply' ? env.HR_INBOX : env.BD_INBOX) || '';
  const lines = Object.entries(fields).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`);
  if (rec.file) lines.push(`file: ${rec.file.name} (${Math.round(rec.file.size / 1024)} KB, ${rec.file.scan}) – open: ${origin}/api/file?key=${encodeURIComponent(rec.file.key)} (BD login required)`);
  await mail(env, { to: to.split(',').map((s) => s.trim()).filter(Boolean), reply_to: fields.email, subject: `[Website] ${FORM_LABELS[type]} – ${fields.company || fields.name || fields.email}${fields.project ? ` – ${fields.project}` : ''} (${id})`, text: `${FORM_LABELS[type]} received ${rec.receivedAt}\nLead ID: ${id}\n\n${lines.join('\n')}\n` });
  const ack = type === 'job_apply'
    ? `Thank you for applying to Valdel Design Engineering. HR has your application${fields.position ? ` for ${fields.position}` : ''} and will reply if there is a match.\n\nReference: ${id}`
    : type === 'prequal'
      ? `Thank you for your interest in Valdel Design Engineering. Our business development team will e-mail you the prequalification pack shortly.

Reference: ${id}`
      : `Thank you. Your ${FORM_LABELS[type].toLowerCase()} has reached the VDE business development team. A VDE engineer will reply.\n${fields.nda === 'yes' ? `\nYou asked for an NDA before sharing documents. Our mutual NDA template: ${env.NDA_TEMPLATE_URL || '(BD will send it)'}\n` : ''}\nReference: ${id}`;
  await mail(env, { to: [fields.email], subject: `Valdel Design Engineering – we have your ${type === 'job_apply' ? 'application' : 'enquiry'} (${id})`, text: ack });

  return reply(200, { ok: true, id }, `/contact/thanks/?type=${type}${fields.nda === 'yes' ? '&nda=1' : ''}`);
}

export const onRequestGet = () => new Response('Method not allowed', { status: 405, headers: { allow: 'POST' } });

async function mail(env, { to, subject, text, reply_to }) {
  if (!env.MAIL_API_KEY || !to.length) { console.log('[mail skipped]', subject, '→', to.join(', ')); return; }
  try {
    const r = await fetch(env.MAIL_API_URL || 'https://api.resend.com/emails', { method: 'POST', headers: { authorization: `Bearer ${env.MAIL_API_KEY}`, 'content-type': 'application/json' }, body: JSON.stringify({ from: env.MAIL_FROM, to, subject, text, reply_to }) });
    if (!r.ok) console.log('[mail failed]', r.status, await r.text());
  } catch (e) { console.log('[mail error]', e.message); }
}

