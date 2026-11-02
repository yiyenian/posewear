// Mock ComfyUI 服务器：模拟 /system_stats /upload/image /prompt /history /view，
// 用于本地与线上联调 PoseWear 的「本地 ComfyUI」服务商（无需真实 ComfyUI）。
// 用法：node scripts/mock-comfyui.js [端口]（默认 8188）
const http = require('http');
const PORT = +process.argv[2] || 8188;
const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAYAAACp8Z5+AAAAFUlEQVR42mNk+M/wn4EIwESMolGFAQAKDABXyQF6OAAAAABJRU5ErkJggg==', 'base64');
const started = Date.now();
const jobs = {};
let n = 0;
http.createServer((req, res) => {
  const u = new URL(req.url, 'http://x');
  const cors = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': '*',
  };
  if (req.method === 'OPTIONS') { res.writeHead(204, cors); return res.end(); }
  const json = (o, s = 200) => { res.writeHead(s, { 'Content-Type': 'application/json', ...cors }); res.end(JSON.stringify(o)); };
  if (u.pathname === '/system_stats') return json({ system: { comfyui_version: 'mock-0.3.40', os: 'mock' }, devices: [{ name: 'MockGPU 4090', type: 'cuda' }] });
  if (u.pathname === '/upload/image' && req.method === 'POST') {
    let body = []; req.on('data', c => body.push(c));
    return req.on('end', () => { console.log('[mock] upload', body.length, 'bytes'); json({ name: 'posewear-ref.jpg', subfolder: '', type: 'input' }); });
  }
  if (u.pathname === '/prompt' && req.method === 'POST') {
    let body = []; req.on('data', c => body.push(c));
    return req.on('end', () => {
      let wf = null; try { wf = JSON.parse(Buffer.concat(body).toString()); } catch (e) {}
      if (!wf || !wf.prompt) return json({ error: { message: 'bad request' } }, 400);
      const id = 'mock-' + (++n);
      jobs[id] = { at: Date.now() + 2500, wf: wf.prompt };
      console.log('[mock] prompt', id, 'nodes:', Object.keys(wf.prompt).join(','));
      json({ prompt_id: id, number: n, node_errors: null });
    });
  }
  const m = u.pathname.match(/^\/history\/(.+)$/);
  if (m) {
    const j = jobs[m[1]];
    if (!j) return json({});
    if (Date.now() < j.at) return json({ [m[1]]: { status: { status_str: 'running', completed: false } } });
    // 找出带 text 输入的节点回显（调试用）
    const textNode = Object.entries(j.wf || {}).find(([, v]) => v.inputs && 'text' in v.inputs);
    console.log('[mock] done', m[1], 'prompt text:', textNode && textNode[1].inputs.text.slice(0, 60).replace(/\n/g, ' '));
    return json({ [m[1]]: { status: { status_str: 'success', completed: true, messages: [] }, outputs: { '9': { images: [{ filename: 'mock-out.png', subfolder: '', type: 'output' }] } } } });
  }
  if (u.pathname === '/view') { res.writeHead(200, { 'Content-Type': 'image/png', ...cors }); return res.end(PNG); }
  res.writeHead(404, cors); res.end('not found');
}).listen(PORT, () => console.log('mock comfyui on http://127.0.0.1:' + PORT));
