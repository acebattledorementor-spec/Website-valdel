// GET /api/file?key=uploads/<id>/<name> – BD-only download of an uploaded tender file (Cloudflare Access).
import { requireAccess } from '../_lib/access.js';

export async function onRequestGet({ request, env }) {
  const denied = await requireAccess(request, env);
  if (denied) return denied;
  const key = new URL(request.url).searchParams.get('key') || '';
  if (!/^uploads\/WEB-\d{8}-[A-Z0-9]{6}\/[A-Za-z0-9._-]+$/.test(key)) return new Response('Bad key', { status: 400 });
  const obj = await env.LEADS.get(key);
  if (!obj) return new Response('Not found (uploads are deleted after the retention period)', { status: 404 });
  return new Response(obj.body, { headers: { 'content-type': 'application/octet-stream', 'content-disposition': obj.httpMetadata?.contentDisposition || 'attachment', 'cache-control': 'no-store', 'x-scan-status': obj.customMetadata?.scan || 'unknown' } });
}
