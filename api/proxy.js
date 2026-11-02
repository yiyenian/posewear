// 衣姿 PoseWear 转发代理（Vercel Edge 版，自 functions/api/proxy.js 移植）：
// 只转发、不记录、不存储任何请求内容或密钥。
// 限制：① 只接受本站页面发起的请求（Origin / Referer 同源）；② 只转发到官方接口域名，
// 自定义中转必须带 x-proxy-custom: 1 且路径符合图片接口格式；③ 结果图片只从官方结果 CDN 下载；④ 每 IP 频率限制。
export const config = { runtime: 'edge' };
const API_PATH=/^\/(api\/v3|v\d+(beta|alpha)?)\/(images\/(edits|generations)|models(\/[^/]+(:generateContent)?)?)$/;
const OFFICIAL=[/^api\.openai\.com$/,/^generativelanguage\.googleapis\.com$/,/^ark\.[a-z0-9-]+\.volces\.com$/,/^ark\.[a-z0-9-]+\.bytepluses\.com$/];
const IMG_HOSTS=[/^oaidalleapiprodscus\.blob\.core\.windows\.net$/,/(^|\.)volces\.com$/,/(^|\.)bytepluses\.com$/,/(^|\.)googleusercontent\.com$/];
const DROP=['host','x-target-url','x-proxy-kind','x-proxy-custom','cookie','origin','referer','x-forwarded-for','x-forwarded-proto','x-real-ip','x-vercel-forwarded-for','x-vercel-ip-city','x-vercel-ip-country','x-vercel-ip-country-region','content-length','sec-fetch-site','sec-fetch-mode','sec-fetch-dest'];
// Edge 实例内存限流（尽力而为）；正式防护建议在 Vercel 控制台为 /api/proxy 加速率限制规则。
const RL=new Map(),WIN=60e3,MAX_API=20,MAX_IMG=40;
function limited(ip,kind){const now=Date.now(),k=kind+'|'+ip;let e=RL.get(k);if(!e||now-e.t>WIN){e={t:now,n:0};RL.set(k,e)}e.n++;
  if(RL.size>5000)for(const[x,v]of RL)if(now-v.t>WIN)RL.delete(x);return e.n>(kind==='img'?MAX_IMG:MAX_API)}
function sameSite(req){const self=new URL(req.url).host;for(const h of['origin','referer']){const v=req.headers.get(h);if(v){try{return new URL(v).host===self}catch(e){return false}}}return false}
export default async function handler(request){
  if(request.method==='OPTIONS')return new Response(null,{status:204});
  if(!['GET','POST'].includes(request.method))return j(405,'只支持 GET / POST');
  if(!sameSite(request))return j(403,'只接受本站页面发起的请求');
  let t;try{t=new URL(request.headers.get('x-target-url')||'')}catch(e){return j(400,'缺少或无效的 x-target-url')}
  if(t.protocol!=='https:'||t.username||t.password||(t.port&&t.port!=='443'))return j(400,'目标地址必须是标准 https 地址');
  const ip=(request.headers.get('x-real-ip')||request.headers.get('x-forwarded-for')||'0').split(',')[0].trim()||'0';
  const img=request.headers.get('x-proxy-kind')==='image';
  if(img){if(request.method!=='GET')return j(405,'图片下载只支持 GET');
    if(!IMG_HOSTS.some(r=>r.test(t.hostname)))return j(403,'该图片地址不在允许范围内');
    if(limited(ip,'img'))return j(429,'请求过于频繁，请稍后再试');
    const r=await fetch(t.toString(),{redirect:'manual'}).catch(()=>null);const ct=r&&r.headers.get('content-type')||'';
    if(!r||!r.ok||!/^image\//.test(ct))return j(502,'结果图片下载失败');return new Response(r.body,{headers:{'content-type':ct,'cache-control':'no-store','x-content-type-options':'nosniff'}})}
  const official=OFFICIAL.some(r=>r.test(t.hostname)),custom=request.headers.get('x-proxy-custom')==='1';
  if(!official&&!custom)return j(403,'该地址不是官方接口；自定义中转需在设置中选择「自定义」');
  const path=t.pathname.replace(/\/+$/,'');
  if(official?!API_PATH.test(path):!/\/(images\/(edits|generations)|models(\/[^/]+(:generateContent)?)?)$/.test(path))return j(403,'该路径不允许通过代理转发');
  if(custom&&/^(localhost|127\.|10\.|192\.168\.|169\.254\.|\[)/.test(t.hostname))return j(403,'不能转发到内网地址');
  if(limited(ip,'api'))return j(429,'请求过于频繁，请稍后再试');
  const h=new Headers();for(const[k,v] of request.headers){const l=k.toLowerCase();if(!DROP.includes(l)&&!l.startsWith('x-vercel-')&&!l.startsWith('cf-'))h.set(k,v)}
  try{const r=await fetch(t.toString(),{method:request.method,headers:h,body:request.method==='POST'?request.body:undefined,redirect:'manual'});
    const oh=new Headers();['content-type'].forEach(k=>r.headers.get(k)&&oh.set(k,r.headers.get(k)));oh.set('cache-control','no-store');
    return new Response(r.body,{status:r.status,headers:oh})}
  catch(e){return j(502,'代理无法连接目标服务')}
}
const j=(s,m)=>new Response(JSON.stringify({error:{message:m}}),{status:s,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store'}});
