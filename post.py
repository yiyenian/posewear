# v10 构建后处理：哈希资源、静态详情页、SEO 文件、_headers（由 build.py exec）
SITE=os.environ.get('POSEWEAR_SITE','https://posewear.pages.dev').rstrip('/')  # 部署到自己的域名时改这里
h8=lambda b:hashlib.sha256(b if isinstance(b,bytes) else b.encode()).hexdigest()[:10]
os.makedirs(f'{D}/assets',exist_ok=True)
for f in os.listdir(f'{D}/assets'): os.remove(f'{D}/assets/{f}')
A={}
def put(name,data):
  b=data.encode() if isinstance(data,str) else data
  base,ext=name.rsplit('.',1);n=f'assets/{base}.{h8(b)}.{ext}';open(f'{D}/{n}','wb').write(b);A[name]=n;return n
put('poses.json',PJ);put('costumes.json',CJ);put('portraits.json',RJ)
for f in ['style.css','zip.js','extras.js','studio.js']: put(f,open(f'src/{f}','rb').read())
app=open('src/app.js').read().replace("'poses.json'","'/"+A['poses.json']+"'").replace("'costumes.json'","'/"+A['costumes.json']+"'").replace("'portraits.json'","'/"+A['portraits.json']+"'")
put('app.js',app)
VER='posewear-v10-'+h8(''.join(A.values()))
idx=open('src/index.html').read()
for f in ['style.css','app.js','zip.js','extras.js','studio.js']:
  idx=idx.replace(f'"{f}"',f'"/{A[f]}"')
idx=idx.replace('href="poses.json"',f'href="/{A["poses.json"]}"')
open(f'{D}/index.html','w').write(idx)
for f in ['style.css','app.js','zip.js','extras.js','studio.js']:
  if os.path.exists(f'{D}/{f}'): os.remove(f'{D}/{f}')
sw=open('src/sw.js').read().replace("const V='posewear-v9'",f"const V='{VER}'")
sw=sw.replace("['./','index.html','style.css','app.js','studio.js','extras.js','zip.js','favicon.svg']",json.dumps(['/','/favicon.svg']+['/'+A[f] for f in ['style.css','app.js','studio.js','extras.js','zip.js','poses.json']]))
open(f'{D}/sw.js','w').write(sw)
import base64
inl=re.findall(r'<script>(.*?)</script>',idx,re.S)
SH=' '.join("'sha256-"+base64.b64encode(hashlib.sha256(x.encode()).digest()).decode()+"'" for x in inl)
# ---------- 静态详情页 ----------
for d in ['pose','costume','portrait']:
  if os.path.exists(f'{D}/{d}'): shutil.rmtree(f'{D}/{d}')
CSS='''body{margin:0;font:15px/1.7 -apple-system,BlinkMacSystemFont,"PingFang SC","Microsoft YaHei",sans-serif;color:#111;background:#fff}a{color:inherit}
header{display:flex;align-items:center;gap:10px;padding:14px 20px;border-bottom:1px solid #f0f0f0}header a{text-decoration:none;font-weight:700;display:flex;align-items:center;gap:8px}
.mk{width:26px;height:26px;color:#ff2442;display:grid;place-items:center}.mk svg{width:26px;height:26px}
main{max-width:1040px;margin:0 auto;padding:24px 20px;display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:32px}
@media(max-width:760px){main{grid-template-columns:1fr}}
.im img{width:100%;height:auto;border-radius:16px;background:#f5f5f5;display:block}
h1{font-size:24px;margin:0 0 6px}.mu{color:#666;font-size:13px}.bc{font-size:13px;color:#666;margin-bottom:12px}
.box{background:#f5f5f5;border-radius:14px;padding:14px 16px;margin:14px 0}.box small{color:#666}
.go{display:inline-block;background:#d81b3a;color:#fff;border-radius:999px;padding:10px 22px;text-decoration:none;font-weight:600;margin:6px 8px 6px 0}
.rel{grid-column:1/-1}.rel ul{list-style:none;padding:0;display:grid;grid-template-columns:repeat(auto-fill,minmax(120px,1fr));gap:12px}.rel img{width:100%;height:auto;border-radius:10px;background:#f5f5f5;display:block}.rel a{text-decoration:none;font-size:13px}
footer{text-align:center;color:#666;font-size:12px;padding:30px 20px;border-top:1px solid #f0f0f0}
h1{overflow-wrap:anywhere}
@media(prefers-color-scheme:dark){body{color:#eee;background:#111}header,footer{border-color:#262626}.mu,.bc,.box small,footer{color:#9a9a9a}.box{background:#1d1d1d}.im img,.rel img{background:#1d1d1d}.go[style]{background:#eee!important;color:#111!important}}
:root{color-scheme:light dark}'''
LOGO='<span class="mk"><svg viewBox="0 0 32 32" aria-hidden="true"><circle cx="16" cy="6.6" r="4" fill="currentColor"/><path d="M16 13.4 3.4 25.6h25.2z" fill="none" stroke="currentColor" stroke-width="3.4" stroke-linejoin="round"/></svg></span>'
E=lambda s:H.escape(str(s),quote=True)
def page(kind,it,rel):
  P=kind=='pose'
  if kind=='portrait':
    ttl=f"{it['ti']} · 人像脸模参考";img=it['m'];w,h=1080,round(1080*it['h']/it['w']);th=it['t']
    desc=f"{it['sec']} · {it['len']}{'，'+it['st'] if it['st'] else ''}。AI 生成的虚构人物，可作 AI 绘图/视频的人物面部参考，CC0。";meta=f"{it['sec']} · {it['len']} · 编号 {it['no']}";en=it['en']
  elif P:
    ttl=f"{it['zh']} · {it['cat']}姿势参考";img=it['angles'][0]['i'];w,h=900,1200;th=it['angles'][0]['t']
    desc=f"{it['zh']}。{it['line']} · {it['cat']}，共 {len(it['angles'])} 个拍摄角度（{'、'.join(a['zh'] for a in it['angles'])}）。附中英文提示词，可直接用于绘图或出图。"
    meta=f"{it['line']} · {it['cat']} · 编号 {it['no']}";en=f"{it['en']}, {it['lineEn']}"
  else:
    ttl=f"{it['ti']} · {it['cat']}穿搭参考";img=it['m'];w,h=1080,1620;th=it['t']
    desc=it['zh'];meta=f"{it['cat']} · 编号 {it['id']}";en=it['en']
  url=f"{SITE}/{kind}/{it['id']}/"
  ld={"@context":"https://schema.org","@type":"ImageObject","name":ttl,"description":desc,"contentUrl":f"{SITE}/{img}","thumbnailUrl":f"{SITE}/{th}","url":url,"width":w,"height":h,"isPartOf":{"@type":"WebSite","name":"衣姿 PoseWear","url":SITE+'/'},"creditText":"AI Pose Gallery / AI Costume Gallery (@giaaibusi)"}
  rl=''.join(f'<li><a href="/{kind}/{r["id"]}/"><img src="/{r["angles"][0]["t"] if P else r["t"]}" alt="{E(r["zh"] if P else r["ti"])}" width="{300 if P else 360 if kind=="costume" else 400}" height="{400 if P else 540 if kind=="costume" else 500}" loading="lazy">{E(r["zh"] if P else r["ti"])}</a></li>' for r in rel)
  lab={'pose':'姿势库','costume':'服装库','portrait':'人像库'}[kind]
  return f'''<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>{E(ttl)} | 衣姿 PoseWear</title><meta name="description" content="{E(desc[:150])}"><link rel="canonical" href="{url}">
<meta property="og:type" content="article"><meta property="og:title" content="{E(ttl)}"><meta property="og:description" content="{E(desc[:150])}"><meta property="og:image" content="{SITE}/{img}"><meta property="og:url" content="{url}"><meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="/favicon.svg" type="image/svg+xml"><style>{CSS}</style>
<script type="application/ld+json">{json.dumps(ld,ensure_ascii=False)}</script></head><body>
<header><a href="/">{LOGO}衣姿 PoseWear</a></header>
<main><div class="im"><img src="/{img}" alt="{E(ttl)}" width="{w}" height="{h}"></div>
<div><div class="bc"><a href="/">首页</a> › <a href="/#{kind}">{lab}</a> › {E(it.get('cat') or it.get('len'))}</div><h1>{E(it['zh'] if P else it['ti'])}</h1><div class="mu">{E(meta)}</div>
<div class="box"><small>中文描述</small><p>{E(desc)}</p></div><div class="box"><small>英文提示词 · PROMPT</small><p>{E(en)}</p></div>
<a class="go" href="/#{kind}/{it['id']}">在衣姿中打开</a><a class="go" style="background:#111" href="/#studio">去试穿</a></div>
<section class="rel"><h2>同类{'姿势' if P else '穿搭' if kind=='costume' else '人像'}</h2><ul>{rl}</ul></section></main>
<footer>{'图片来自 AI Portrait Gallery（作者 @agi_aibusi，CC0 1.0），AI 生成的虚构人物。' if kind=='portrait' else '图片来自 AI Pose Gallery / AI Costume Gallery（原作者 @giaaibusi）'}，中文描述由本站整理。<a href="/">返回首页</a></footer></body></html>'''
open(f'{D}/404.html','w').write(f'''<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>页面不存在 | 衣姿 PoseWear</title><meta name="robots" content="noindex"><link rel="icon" href="/favicon.svg" type="image/svg+xml"><style>{CSS}
.nf{{max-width:480px;margin:12vh auto;text-align:center;padding:0 20px}}.nf b{{font-size:64px;color:#d81b3a;display:block;line-height:1}}</style></head><body><header><a href="/">{LOGO}衣姿 PoseWear</a></header>
<div class="nf"><b>404</b><h1>这个页面不存在</h1><p class="mu">链接可能写错了，或者内容已经调整。</p><a class="go" href="/">回到首页</a><a class="go" style="background:#111" href="/#costume">看看服装库</a></div></body></html>''')
CSP=("default-src 'self'; script-src 'self' "+SH+"; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; "
 "connect-src 'self' data: blob: https://api.openai.com https://generativelanguage.googleapis.com https://*.volces.com https://*.bytepluses.com https://oaidalleapiprodscus.blob.core.windows.net https://*.googleusercontent.com http://localhost:* http://127.0.0.1:*; "
 "worker-src 'self'; manifest-src 'self'; media-src 'self' blob:; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; upgrade-insecure-requests")
IMM='  Cache-Control: public, max-age=31536000, immutable\n'
open(f'{D}/_headers','w').write(f'''/*
  Content-Security-Policy: {CSP}
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  X-Frame-Options: DENY
  Strict-Transport-Security: max-age=31536000; includeSubDomains
  Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()
  Cross-Origin-Opener-Policy: same-origin
/assets/*
{IMM}/p/*
{IMM}/c/*
{IMM}/r/*
{IMM}/o/*
{IMM}/icon-*
  Cache-Control: public, max-age=86400
/og.png
  Cache-Control: public, max-age=86400
/sw.js
  Cache-Control: no-cache
/
  Cache-Control: public, max-age=0, must-revalidate
/index.html
  Cache-Control: public, max-age=0, must-revalidate
/pose/*
  Cache-Control: public, max-age=600
/costume/*
  Cache-Control: public, max-age=600
/portrait/*
  Cache-Control: public, max-age=600
''')
# ---------- Vercel 响应头（vercel.json，部署到 Vercel 时生效；Cloudflare 会忽略此文件）----------
SEC=[('Content-Security-Policy',CSP),('X-Content-Type-Options','nosniff'),('Referrer-Policy','strict-origin-when-cross-origin'),
 ('X-Frame-Options','DENY'),('Strict-Transport-Security','max-age=31536000; includeSubDomains'),
 ('Permissions-Policy','camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()'),
 ('Cross-Origin-Opener-Policy','same-origin')]
VH=[{'source':'/(.*)','headers':[{'key':k,'value':v} for k,v in SEC]},
 {'source':'/(assets|p|c|r|o)/(.*)','headers':[{'key':'Cache-Control','value':'public, max-age=31536000, immutable'}]},
 {'source':'/icon-(.*)','headers':[{'key':'Cache-Control','value':'public, max-age=31536000, immutable'}]},
 {'source':'/og.png','headers':[{'key':'Cache-Control','value':'public, max-age=3600'}]},
 {'source':'/robots.txt','headers':[{'key':'Cache-Control','value':'public, max-age=3600'}]},
 {'source':'/sitemap_index.xml','headers':[{'key':'Cache-Control','value':'public, max-age=3600'}]},
 {'source':'/sitemap.xml','headers':[{'key':'Cache-Control','value':'public, max-age=3600'}]},
 {'source':'/sitemap-pose.xml','headers':[{'key':'Cache-Control','value':'public, max-age=3600'}]},
 {'source':'/sitemap-costume.xml','headers':[{'key':'Cache-Control','value':'public, max-age=3600'}]},
 {'source':'/sitemap-portrait.xml','headers':[{'key':'Cache-Control','value':'public, max-age=3600'}]},
 {'source':'/sitemap-pages.xml','headers':[{'key':'Cache-Control','value':'public, max-age=3600'}]},
 {'source':'/sw.js','headers':[{'key':'Cache-Control','value':'no-cache'}]},
 {'source':'/','headers':[{'key':'Cache-Control','value':'public, max-age=0, must-revalidate'}]},
 {'source':'/index.html','headers':[{'key':'Cache-Control','value':'public, max-age=0, must-revalidate'}]},
 {'source':'/(pose|costume|portrait|en|tag)/(.*)','headers':[{'key':'Cache-Control','value':'public, max-age=600'}]}]
open(f'{D}/vercel.json','w').write(json.dumps({'headers':VH},ensure_ascii=False,indent=1))
exec(open('seo.py').read())
