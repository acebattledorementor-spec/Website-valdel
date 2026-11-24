// Verifies the Cloudflare Access JWT on BD-only endpoints (/api/leads-export, /api/file).
// Put those paths behind a Cloudflare Access application, then set ACCESS_TEAM_DOMAIN
// (e.g. valdel.cloudflareaccess.com) and ACCESS_AUD (the application's audience tag).
// Without both settings every request is refused: the endpoints are never open by accident.

let certCache = null;
const b64urlToBytes = (s) => Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((s.length + 3) % 4)), (c) => c.charCodeAt(0));

export async function requireAccess(request, env) {
  if (!env.ACCESS_TEAM_DOMAIN || !env.ACCESS_AUD) return deny('Access is not configured for this endpoint.');
  const jwt = request.headers.get('cf-access-jwt-assertion');
  if (!jwt) return deny('Sign-in required.');
  try {
    const [h, p, s] = jwt.split('.');
    const header = JSON.parse(new TextDecoder().decode(b64urlToBytes(h)));
    const claims = JSON.parse(new TextDecoder().decode(b64urlToBytes(p)));
    if (!certCache || certCache.at < Date.now() - 3600e3) {
      const r = await fetch(`https://${env.ACCESS_TEAM_DOMAIN}/cdn-cgi/access/certs`);
      certCache = { at: Date.now(), keys: (await r.json()).keys };
    }
    const jwk = certCache.keys.find((k) => k.kid === header.kid);
    if (!jwk) return deny('Unknown signing key.');
    const key = await crypto.subtle.importKey('jwk', jwk, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['verify']);
    const ok = await crypto.subtle.verify('RSASSA-PKCS1-v1_5', key, b64urlToBytes(s), new TextEncoder().encode(`${h}.${p}`));
    const aud = [].concat(claims.aud);
    if (!ok || !aud.includes(env.ACCESS_AUD) || claims.exp * 1000 < Date.now() || claims.iss !== `https://${env.ACCESS_TEAM_DOMAIN}`) return deny('Invalid sign-in.');
    return null; // allowed
  } catch {
    return deny('Invalid sign-in.');
  }
}
const deny = (msg) => new Response(msg, { status: 403, headers: { 'cache-control': 'no-store' } });
