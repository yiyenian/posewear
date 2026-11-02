// 本地 CORS 转发代理（仅用于验证）：8189 → 8188，等价于 ComfyUI 带 --enable-cors-header "*" 启动的跨域效果。
// 用法：node scripts/cors-proxy.js [本地端口] [目标端口]
const http = require('http');
const LPORT = +process.argv[2] || 8189, TPORT = +process.argv[3] || 8188;
const CORS = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS', 'Access-Control-Allow-Headers': '*', 'Access-Control-Allow-Private-Network': 'true' };
http.createServer((req, res) => {
  const h2 = { ...req.headers };
  delete h2.origin; delete h2.referer; delete h2['sec-fetch-site']; delete h2['sec-fetch-mode'];
  const out = http.request({ host: '127.0.0.1', port: TPORT, path: req.url, method: req.method, headers: { ...h2, host: '127.0.0.1:' + TPORT } }, r => {
    const h = { ...r.headers, ...CORS };
    res.writeHead(r.statusCode, h); r.pipe(res);
  });
  out.on('error', e => { res.writeHead(502, CORS); res.end('proxy error: ' + e.message); });
  if (req.method === 'OPTIONS') { res.writeHead(204, CORS); return res.end(); }
  req.pipe(out);
}).listen(LPORT, () => console.log(`cors-proxy http://127.0.0.1:${LPORT} -> http://127.0.0.1:${TPORT}`));
