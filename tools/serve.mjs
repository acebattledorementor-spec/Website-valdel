// Local server: node tools/serve.mjs [dist|preview] [port]
// Serves the static build and runs the real /api functions against a local disk store (.local-data/).
// Local only: binds to 127.0.0.1 and skips Cloudflare Access on the BD endpoints.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { Readable } from 'node:stream';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { localEnv } from './local-env.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dirName = process.argv[2] || 'dist';
const port = +(process.argv[3] || 8080);
const DIR = path.join(ROOT, dirName);
const env = localEnv(ROOT);
const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.avif': 'image/avif', '.woff2': 'font/woff2', '.pdf': 'application/pdf', '.xml': 'application/xml', '.txt': 'text/plain', '.yml': 'text/yaml', '.mp4': 'video/mp4' };

const api = {
  '/api/submit': async (req) => (await import(pathToFileURL(path.join(ROOT, 'functions/api/submit.js')))).onRequestPost({ request: req, env }),
  '/api/leads-export': async (req) => (await import(pathToFileURL(path.join(ROOT, 'functions/api/leads-export.js')))).exportLeads(req, env),
};

export function start(dir = DIR, p = port) {
  dir = path.resolve(dir); // normalise separators so the traversal check below works for any input form
  const server = http.createServer(async (req, res) => {
    const url = new URL(req.url, `http://localhost:${p}`);
    try {
      if (api[url.pathname]) {
        const request = new Request(url, { method: req.method, headers: req.headers, body: req.method === 'GET' || req.method === 'HEAD' ? undefined : Readable.toWeb(req), duplex: 'half' });
        const r = await api[url.pathname](request);
        res.writeHead(r.status, Object.fromEntries(r.headers));
        res.end(Buffer.from(await r.arrayBuffer()));
        return;
      }
      let f = path.join(dir, decodeURIComponent(url.pathname));
      if (f !== dir && !f.startsWith(dir + path.sep)) { res.writeHead(403); res.end(); return; }
      if (fs.existsSync(f) && fs.statSync(f).isDirectory()) {
        if (!url.pathname.endsWith('/')) { res.writeHead(301, { location: url.pathname + '/' + url.search }); res.end(); return; }
        f = path.join(f, 'index.html');
      }
      if (!fs.existsSync(f)) { res.writeHead(404, { 'content-type': TYPES['.html'] }); res.end(fs.existsSync(path.join(dir, '404.html')) ? fs.readFileSync(path.join(dir, '404.html')) : 'Not found'); return; }
      res.writeHead(200, { 'content-type': TYPES[path.extname(f)] || 'application/octet-stream' });
      fs.createReadStream(f).pipe(res);
    } catch (e) {
      console.error(e); res.writeHead(500); res.end(String(e.message));
    }
  });
  return new Promise((ok) => server.listen(p, '127.0.0.1', () => ok(server)));
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  start().then(() => console.log(`Serving ${dirName}/ at http://localhost:${port}  (forms stored in .local-data/, e-mail logged only)`));
}
