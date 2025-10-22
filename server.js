const http = require('http');
const fs = require('fs');
const path = require('path');

// Leitura simples do .env local (sem depender de libs)
const envPath = path.join(__dirname, '.env');
let SUPABASE_URL = '';
let SUPABASE_ANON_KEY = '';
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  envContent.split(/\r?\n/).forEach(line => {
    const [key, ...rest] = line.split('=');
    const value = rest.join('=');
    if (key === 'SUPABASE_URL') SUPABASE_URL = value.trim();
    if (key === 'SUPABASE_ANON_KEY') SUPABASE_ANON_KEY = value.trim();
  });
}

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.json': 'application/json; charset=utf-8',
};

const server = http.createServer((req, res) => {
  // Normaliza a URL para ignorar querystring
  const pathname = req.url.split('?')[0];

  if (pathname === '/api/env.js') {
    const payload = { SUPABASE_URL, SUPABASE_ANON_KEY };
    res.writeHead(200, {
      'Content-Type': 'application/javascript; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': 'geolocation=(), microphone=(), camera=()'
    });
    res.end(`window.__ENV = ${JSON.stringify(payload)};`);
    return;
  }

  // Serve arquivos estáticos
  let filePath = pathname;
  if (filePath === '/' || filePath === '') filePath = '/index.html';
  const fullPath = path.join(__dirname, filePath);

  fs.stat(fullPath, (err, stats) => {
    if (err || !stats.isFile()) {
      // SPA fallback
      const indexPath = path.join(__dirname, 'index.html');
      fs.readFile(indexPath, (err2, data) => {
        if (err2) {
          res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
          return res.end('Arquivo não encontrado.');
        }
        res.writeHead(200, { 'Content-Type': mimeTypes['.html'] });
        res.end(data);
      });
      return;
    }

    const ext = path.extname(fullPath);
    const contentType = mimeTypes[ext] || 'application/octet-stream';
    fs.readFile(fullPath, (err3, data) => {
      if (err3) {
        res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
        return res.end('Erro interno ao servir o arquivo.');
      }
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(data);
    });
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});