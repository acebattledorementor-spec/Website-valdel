// Local stand-ins for Cloudflare bindings, so the real functions/ code runs on a developer PC.
// R2 is emulated on disk under .local-data/ (git-ignored). E-mail is logged, not sent.
import fs from 'node:fs';
import path from 'node:path';
import { Readable } from 'node:stream';

export function diskR2(dir) {
  const full = (k) => path.join(dir, ...k.split('/'));
  const toBytes = async (v) => {
    if (typeof v === 'string') return Buffer.from(v);
    if (v instanceof Uint8Array) return Buffer.from(v);
    if (v && typeof v.getReader === 'function') return Buffer.from(await new Response(v).arrayBuffer());
    if (v && typeof v.arrayBuffer === 'function') return Buffer.from(await v.arrayBuffer());
    throw new Error('unsupported R2 value');
  };
  return {
    async put(key, value, opts = {}) {
      const f = full(key); fs.mkdirSync(path.dirname(f), { recursive: true });
      fs.writeFileSync(f, await toBytes(value));
      fs.writeFileSync(f + '.meta.json', JSON.stringify({ httpMetadata: opts.httpMetadata || {}, customMetadata: opts.customMetadata || {} }));
    },
    async get(key) {
      const f = full(key); if (!fs.existsSync(f)) return null;
      const meta = fs.existsSync(f + '.meta.json') ? JSON.parse(fs.readFileSync(f + '.meta.json', 'utf8')) : {};
      const buf = fs.readFileSync(f);
      return { ...meta, body: Readable.toWeb(Readable.from(buf)), text: async () => buf.toString('utf8'), arrayBuffer: async () => buf };
    },
    async list({ prefix = '' } = {}) {
      const base = full(prefix.replace(/\/$/, ''));
      const objects = [];
      if (fs.existsSync(base)) (function walk(d) { for (const n of fs.readdirSync(d)) { const p = path.join(d, n); if (fs.statSync(p).isDirectory()) walk(p); else if (!n.endsWith('.meta.json')) objects.push({ key: path.relative(dir, p).split(path.sep).join('/') }); } })(base);
      return { objects: objects.sort((a, b) => a.key.localeCompare(b.key)), truncated: false };
    },
  };
}

export function localEnv(root) {
  return { LEADS: diskR2(path.join(root, '.local-data')), SITE_ORIGIN: 'http://localhost', BD_INBOX: 'bd@example.invalid', HR_INBOX: 'hr@example.invalid' };
}
