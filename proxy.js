/**
 * Simple CORS Proxy for Ollama
 * 
 * This solves CORS issues when your React app tries to call Ollama.
 * Run this in a separate terminal: node proxy.js
 */

const http = require('http');
const https = require('https');
const url = require('url');

const OLLAMA_URL = 'http://localhost:11434';
const PROXY_PORT = 8080;

const server = http.createServer((req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // Proxy the request
  const targetUrl = OLLAMA_URL + req.url;
  const parsedUrl = url.parse(targetUrl);
  
  const options = {
    hostname: parsedUrl.hostname,
    port: parsedUrl.port,
    path: parsedUrl.path,
    method: req.method,
    headers: req.headers
  };

  const proxyReq = http.request(options, (proxyRes) => {
    res.writeHead(proxyRes.statusCode, proxyRes.headers);
    proxyRes.pipe(res);
  });

  proxyReq.on('error', (err) => {
    console.error('Proxy error:', err);
    res.writeHead(500);
    res.end('Proxy error: ' + err.message);
  });

  req.pipe(proxyReq);
});

server.listen(PROXY_PORT, () => {
  console.log(`🚀 CORS Proxy running on http://localhost:${PROXY_PORT}`);
  console.log(`📡 Proxying to Ollama at ${OLLAMA_URL}`);
  console.log(`\n⚙️  Update your React app to use: http://localhost:${PROXY_PORT}`);
});
