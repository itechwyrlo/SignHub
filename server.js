// Simple development server with SPA routing support
// Run with: node server.js

import { createServer } from 'http';
import { readFileSync, existsSync, statSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join, extname } from 'path';
import { createReadStream } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const PORT = 5500; // Default Live Server port
const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.eot': 'application/vnd.ms-fontobject',
};

function getMimeType(filePath) {
  const ext = extname(filePath).toLowerCase();
  return MIME_TYPES[ext] || 'application/octet-stream';
}

function serveFile(filePath, res) {
  if (!existsSync(filePath)) {
    return false;
  }

  const stat = statSync(filePath);
  if (!stat.isFile()) {
    return false;
  }

  const mimeType = getMimeType(filePath);
  res.writeHead(200, { 'Content-Type': mimeType });
  createReadStream(filePath).pipe(res);
  return true;
}

const server = createServer((req, res) => {
  let filePath = join(__dirname, req.url === '/' ? 'index.html' : req.url);

  // Remove query string
  filePath = filePath.split('?')[0];

  // Security: prevent directory traversal
  if (!filePath.startsWith(__dirname)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  // Try to serve the requested file
  if (serveFile(filePath, res)) {
    return;
  }

  // If file doesn't exist and it's not a file request (no extension or looks like a route),
  // serve index.html for SPA routing
  const hasExtension = extname(filePath) !== '';
  if (!hasExtension || req.url.startsWith('/dashboard') || req.url.startsWith('/login') || req.url.startsWith('/signup')) {
    const indexPath = join(__dirname, 'index.html');
    if (existsSync(indexPath)) {
      res.writeHead(200, { 'Content-Type': 'text/html' });
      createReadStream(indexPath).pipe(res);
      return;
    }
  }

  // 404 Not Found
  res.writeHead(404);
  res.end('Not Found');
});

server.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
  console.log(`📁 Serving files from: ${__dirname}`);
  console.log(`✨ SPA routing enabled - all routes will serve index.html`);
});

