# SEO：静态首页内容、分类/标签页、详情页、英文版、分站点地图、IndexNow 密钥（由 post.py exec）
import datetime,time
TODAY=datetime.date.today().isoformat()
MT=lambda p:datetime.date.fromtimestamp(os.path.getmtime(p)).isoformat()
LM={'pose':MT(f'{R}/pose/data.json'),'costume':MT(f'{R}/costume/data.json'),'portrait':MT(f'{R}/portrait/data.json' if os.path.exists(f'{R}/portrait/data.json') else f'{R}/portrait/images.js')}
for d in ['en','tag']:
  if os.path.exists(f'{D}/{d}'): shutil.rmtree(f'{D}/{d}')
if not os.path.exists('indexnow.key'):
  import secrets;open('indexnow.key','w').write(secrets.token_hex(16))
INK=open('indexnow.key').read().strip();open(f'{D}/{INK}.txt','w').write(INK)
SRCS={'pose':('AI Pose Gallery','https://ai-pose-gallery.pages.dev','@giaaibusi','https://x.com/giaaibusi'),
 'costume':('AI Costume Gallery','https://ai-costume-gallery.pages.dev','@giaaibusi','https://x.com/giaaibusi'),
 'portrait':('AI Portrait Gallery','https://ai-portrait-gallery.pages.dev','@agi_aibusi','https://x.com/agi_aibusi')}
CC0='https://creativecommons.org/publicdomain/zero/1.0/'
# ---- 分类定义 ----
PCAT={'可爱':('cute','Cute'),'坐姿':('sitting','Sitting'),'站姿':('standing','Standing'),'跪立':('kneeling','Kneeling'),'躺卧':('lying','Lying down'),'侧坐·鸭子坐':('side-sitting','Side sitting'),'蹲姿':('squatting','Squatting'),'前倾':('leaning-forward','Leaning forward'),'后仰':('leaning-back','Leaning back'),'扭身':('twisting','Twisting')}
CCAT={'春季':('spring','Spring'),'夏季':('summer','Summer'),'秋季':('autumn','Autumn'),'冬季':('winter','Winter'),'派对礼服':('party','Party dresses'),'泳装':('swimsuit','Swimwear')}
RSEC={'正脸':('front-face','Front face'),'生活照':('lifestyle','Lifestyle')}
RLEN={'短发':('short-hair','Short hair'),'中长发':('medium-hair','Medium hair'),'半长发':('shoulder-length-hair','Shoulder-length hair'),'长发':('long-hair','Long hair')}
COLS={'黑':'black','白':'white','红':'red','粉':'pink','蓝':'blue','藏青':'navy','棕':'brown','米':'beige','象牙白':'ivory','灰':'grey','绿':'green','黄':'yellow','紫':'purple','金':'gold','银':'silver','卡其':'khaki','酒红':'burgundy','橙':'orange','奶油':'cream','薄荷':'mint','薰衣草':'lavender','橄榄':'olive'}
ITEMK={'连衣裙':'dress','半身裙':'skirt','短裤':'shorts','长裤':'trousers','牛仔裤':'jeans','大衣':'coat','夹克':'jacket','开衫':'cardigan','衬衫':'blouse','毛衣':'sweater','吊带':'camisole','泳衣':'swimsuit','靴子':'boots','高跟鞋':'high heels','运动鞋':'sneakers','凉鞋':'sandals','连裤袜':'tights','长筒袜':'stockings'}
cz=lambda k:k if k.endswith('白') else k+'色'
NA=sum(len(p['angles']) for p in poses.values());SP=[p for p in PL if not p.get('a')];NA_PUB=sum(len(p['angles']) for p in SP);SC=[c for c in cos if not c.get('a')];SR=pors
def ctags(c):
  w=' '+c['kw']+' ';e=' '+c['en'].replace(',',' ')+' '
  return [('item',z,ITEMK[z]) for z in ITEMK if ' '+ITEMK[z]+' ' in e]+[('col',z,COLS[z]) for z in COLS if ' '+COLS[z]+' ' in w]
TAGS={}
for c in SC:
  for k,z,en in ctags(c): TAGS.setdefault(en.replace(' ','-'),{'k':k,'zh':z if k=='item' else cz(z),'en':en,'L':[]})['L'].append(c)
TAGS={s:t for s,t in TAGS.items() if len(t['L'])>=4}
cap=lambda s:s[:1].upper()+s[1:]
def en_title(kind,it):
  if kind=='pose': return cap(it['en'])
  if kind=='costume':
    ps=[x.strip() for x in it['en'].split(',')][1:3];return cap(' + '.join(ps)) if ps else cap(it['en'])
  return cap(it['en'].split(',')[1].strip())+' portrait'
def zh_title(kind,it): return it['zh'] if kind=='pose' else it['ti']
def thumb(kind,it): return it['angles'][0]['t'] if kind=='pose' else it['t']
def big(kind,it): return it['angles'][0]['i'] if kind=='pose' else it['m']
TW={'pose':(300,400),'costume':(360,540),'portrait':(400,500)}
def catof(kind,it):
  if kind=='pose': return ('pose',PCAT[it['cat']][0],it['cat'],PCAT[it['cat']][1])
  if kind=='costume': return ('costume',CCAT[it['cat']][0],it['cat'],CCAT[it['cat']][1])
  return ('portrait',RLEN[it['len']][0],it['len'],RLEN[it['len']][1])
HAS_EN={'pose','costume'}  # 人像详情页数量太大，英文版只做分类页（Pages 文件数上限）
LAB={'zh':{'pose':'姿势','costume':'服装','portrait':'人像','tag':'标签','home':'首页'},'en':{'pose':'Poses','costume':'Outfits','portrait':'Portraits','tag':'Tags','home':'Home'}}
CSS2=CSS+'''
.bc ol{list-style:none;margin:0;padding:0;display:flex;flex-wrap:wrap;gap:4px}.bc li+li:before{content:"›";margin-right:4px;color:#aaa}.bc a{text-decoration:none}.bc a:hover{text-decoration:underline}
.tg{list-style:none;padding:0;display:flex;flex-wrap:wrap;gap:8px;margin:10px 0}.tg a{font-size:13px;background:#f5f5f5;border-radius:999px;padding:4px 12px;text-decoration:none}.tg a:hover{background:#ececec}
header nav{margin-left:auto;display:flex;gap:16px;font-size:14px}header nav a{font-weight:500;color:#555}
.wrap{max-width:1180px;margin:0 auto;padding:24px 20px}.wrap h1{font-size:28px}.lead{color:#555;max-width:720px;margin:6px 0 18px}
.cg{list-style:none;padding:0;display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:20px 14px}.cg a{text-decoration:none;font-size:13px;display:block}.cg img{width:100%;height:auto;border-radius:12px;background:#f5f5f5;display:block;margin-bottom:6px}.cg span{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.pg{display:flex;gap:8px;justify-content:center;margin:28px 0}.pg a,.pg b{padding:6px 14px;border-radius:999px;background:#f5f5f5;text-decoration:none;font-size:14px}.pg b{background:#111;color:#fff}
.sec h2{font-size:18px;margin:28px 0 10px}pre{white-space:pre-wrap;margin:0;font:inherit}
@media(prefers-color-scheme:dark){.tg a,.pg a,.cg img{background:#1d1d1d}header nav a{color:#bbb}.lead{color:#aaa}.pg b{background:#eee;color:#111}}'''
def url(lang,path): return SITE+('/en' if lang=='en' else '')+path
def alts(path,en=True):
  if not en: return f'<link rel="canonical" href="{url("zh",path)}">'
  return f'<link rel="alternate" hreflang="zh-CN" href="{url("zh",path)}"><link rel="alternate" hreflang="en" href="{url("en",path)}"><link rel="alternate" hreflang="x-default" href="{url("zh",path)}">'
def crumbs_ld(lang,cr,bid=None): return {"@type":"BreadcrumbList",**({"@id":bid} if bid else {}),"itemListElement":[{"@type":"ListItem","position":i+1,"name":n,**({"item":SITE+u} if u else {})} for i,(n,u) in enumerate(cr)]}
def crumbs_html(cr): return '<nav class="bc" aria-label="breadcrumb"><ol>'+''.join(f'<li>{"<a href=\""+u+"\">"+E(n)+"</a>" if u else "<span aria-current=\"page\">"+E(n)+"</span>"}</li>' for n,u in cr)+'</ol></nav>'
def shell(lang,path,title,desc,body,ld,en=True,og=None,ogt='website'):
  P='/en' if lang=='en' else ''
  nav=(f'<nav><a href="{P}/pose/">{LAB[lang]["pose"]}</a><a href="{P}/costume/">{LAB[lang]["costume"]}</a><a href="{P}/portrait/">{LAB[lang]["portrait"]}</a>'+
    (f'<a href="/en{path}" hreflang="en" lang="en">EN</a>' if lang=='zh' and en else f'<a href="{path}" hreflang="zh-CN" lang="zh-CN">中文</a>' if lang=='en' else '')+'</nav>')
  foot=('Images from AI Pose Gallery / AI Costume Gallery (by @giaaibusi) and AI Portrait Gallery (by @agi_aibusi, CC0 1.0). All AI-generated. <a href="/en/">PoseWear home</a>' if lang=='en' else
    '图片来自 AI Pose Gallery / AI Costume Gallery（原作者 @giaaibusi）与 AI Portrait Gallery（@agi_aibusi，CC0 1.0），均为 AI 生成图，中文描述由本站整理。<a href="/">返回首页</a>')
  return f'''<!doctype html><html lang="{'en' if lang=='en' else 'zh-CN'}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>{E(title)}</title><meta name="description" content="{E(desc[:160])}"><link rel="canonical" href="{url(lang,path)}">{alts(path) if en else ''}
<meta property="og:type" content="{ogt}"><meta property="og:site_name" content="衣姿 PoseWear"><meta property="og:title" content="{E(title)}"><meta property="og:description" content="{E(desc[:160])}"><meta property="og:image" content="{SITE}/{og or 'og.png'}"><meta property="og:url" content="{url(lang,path)}"><meta property="og:locale" content="{'en_US' if lang=='en' else 'zh_CN'}"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:description" content="{E(desc[:160])}">
<link rel="icon" href="/favicon.svg" type="image/svg+xml"><style>{CSS2}</style>
<script type="application/ld+json">{json.dumps({"@context":"https://schema.org","@graph":ld},ensure_ascii=False,separators=(',',':'))}</script></head><body>
<header><a href="{P}/">{LOGO}衣姿 PoseWear</a>{nav}</header>
{body}
<footer>{foot}</footer></body></html>'''
def W(path,html):
  os.makedirs(f'{D}{path}',exist_ok=True);open(f'{D}{path}index.html','w').write(html)
SM={'pose':[],'costume':[],'portrait':[],'pages':[]}
def add(sm,path,lm,imgs=(),en=True):
  SM[sm].append((url('zh',path),lm,imgs))
  if en: SM[sm].append((url('en',path),lm,imgs))
def cardli(lang,kind,it,href=None):
  t=en_title(kind,it) if lang=='en' else zh_title(kind,it);w,h=TW[kind]
  href=href or (('/en' if lang=='en' and kind in HAS_EN else '')+f'/{kind}/{it["id"]}/')
  return f'<li><a href="{href}"><img src="/{thumb(kind,it)}" alt="{E(t)}" width="{w}" height="{h}" loading="lazy" decoding="async"><span>{E(t)}</span></a></li>'
# ---- 详情页 ----
def detail(lang,kind,it,rel):
  zh=lang=='zh';P='/en' if not zh else '';src=SRCS[kind];ck,slug,cz_,cen=catof(kind,it)
  tz=zh_title(kind,it);te=en_title(kind,it);t=tz if zh else te
  img=big(kind,it);th=thumb(kind,it)
  if kind=='portrait': w,h=1080,round(1080*it['h']/it['w'])
  elif kind=='pose': w,h=900,1200
  else: w,h=1080,1620
  angs=it.get('angles',[])
  if kind=='pose':
    prz=f"{it['zh']}，{it['line']}，{it['cat']}。";pzh=f"{it['zh']}，{it['line']}，{it['cat']}姿势";pre=f"{it['en']}, {it['lineEn']}"
    desc=(f"{it['zh']}：{it['line']} · {it['cat']}姿势参考，{len(angs)} 个拍摄角度（{'、'.join(a['zh'] for a in angs)}），附中英文提示词。" if zh else
      f"{te} — {it['lineEn']} pose reference ({cen.lower()}), {len(angs)} camera angles ({', '.join(a['en'] for a in angs)}), with an English prompt.")
    ttl=f"{tz} · {it['cat']}姿势参考 | 衣姿 PoseWear" if zh else f"{te} – {cen} Pose Reference | PoseWear"
  elif kind=='costume':
    prz=it['zh'];pre=it['en'];pzh=f"{it['cat']}穿搭，"+it['zh'].rstrip('。').replace('。','，')
    desc=(f"{it['ti']}：{it['cat']}穿搭参考图。{it['zh']}附英文提示词，可在线 AI 试穿。" if zh else f"{te} – {cen.lower()} outfit reference image with an AI prompt: {it['en']}. Try it on online.")
    ttl=f"{tz} · {it['cat']}穿搭参考 | 衣姿 PoseWear" if zh else f"{te} – {cen} Outfit Reference | PoseWear"
  else:
    prz=it['zh'];pre=it['en'];pzh=it['zh'].rstrip('。').replace('。','，')
    desc=f"{it['ti']}：{it['sec']}人像脸模参考（{it['len']}{'，'+it['st'] if it['st'] else ''}）。AI 生成的虚构人物，CC0 1.0，附中英文提示词。"
    ttl=f"{tz} · 人像脸模参考 {it['no']} | 衣姿 PoseWear"
  path=f'/{kind}/{it["id"]}/'
  cr=[(LAB[lang]['home'],P+'/'),(LAB[lang][kind],f'{P}/{kind}/'),(cz_ if zh else cen,f'{P}/{kind}/{slug}/'),(t,None)]
  kws=[cz_,cen]+([it['line'],it['lineEn']] if kind=='pose' else [])+([x[1] if x[0]=='item' else cz(x[1]) for x in ctags(it)] if kind=='costume' else [])+([it['sec'],it['st']] if kind=='portrait' else [])
  kws=[k for k in kws if k]
  creator={"@type":"Person","name":src[2],"url":src[3]}
  io={"@type":"ImageObject","@id":url(lang,path)+'#image',"name":t,"description":desc,"contentUrl":f"{SITE}/{img}","thumbnailUrl":f"{SITE}/{th}","url":url(lang,path),"width":w,"height":h,
      "encodingFormat":"image/webp","inLanguage":'en' if not zh else 'zh-CN',"keywords":', '.join(kws),"creator":creator,"creditText":f"{src[0]} ({src[2]})","acquireLicensePage":src[1],
      "isPartOf":{"@type":"WebSite","name":"衣姿 PoseWear","url":SITE+'/'},"dateModified":LM[kind]}
  if kind=='portrait': io.update({"license":CC0,"copyrightNotice":"CC0 1.0 (public domain dedication) by @agi_aibusi"})
  tags=[]
  if kind=='costume': tags=[(x[1] if x[0]=='item' else cz(x[1]),x[2]) for x in ctags(it) if x[2].replace(' ','-') in TAGS]
  tg='<div class="tg">'+f'<a href="{P}/{kind}/{slug}/">{E(cz_ if zh else cen)}</a>'+''.join(f'<a href="{P}/tag/{en.replace(" ","-")}/">{E(z if zh else en)}</a>' for z,en in tags)+(f'<a href="/portrait/{RSEC[it["sec"]][0]}/">{E(it["sec"])}</a>' if kind=='portrait' else '')+'</div>'
  if kind=='pose':
    ang=('<div class="box"><small>'+('拍摄角度' if zh else 'Camera angles')+'</small><ul>'+''.join(f'<li><a href="/{a["i"]}">{E(a["zh"] if zh else a["en"])}</a> · <code>{E(a["en"])}</code></li>' for a in angs)+'</ul></div>')
  else: ang=''
  lic=('<p class="mu">'+(f'许可：<a href="{CC0}" rel="license">CC0 1.0</a>，可商用、可修改，无需署名；原作者希望不要原样批量转载。来源：<a href="{src[1]}" rel="noopener">{src[0]}</a>（<a href="{src[3]}" rel="noopener">{src[2]}</a>）。' if kind=='portrait' else
       (f'来源：<a href="{src[1]}" rel="noopener">{src[0]}</a>，原作者 <a href="{src[3]}" rel="noopener">{src[2]}</a>。原站未标明授权，转载或商用请先联系原作者。' if zh else
        f'Source: <a href="{src[1]}" rel="noopener">{src[0]}</a> by <a href="{src[3]}" rel="noopener">{src[2]}</a>. No license is stated by the source; ask the author before reuse.'))+'</p>')
  boxes=(f'<div class="box"><small>中文描述</small><p>{E(prz)}</p></div><div class="box"><small>中文提示词</small><p>{E(pzh)}</p></div><div class="box"><small>英文提示词 · PROMPT</small><p>{E(pre)}</p></div>' if zh else
         f'<div class="box"><small>PROMPT</small><p>{E(pre)}</p></div><div class="box" lang="zh-CN"><small>中文提示词 · Chinese prompt</small><p>{E(pzh)}</p></div>')
  rl=''.join(cardli(lang,kind,r) for r in rel)
  body=f'''<main><div class="im"><img src="/{img}" alt="{E(t)}" width="{w}" height="{h}" fetchpriority="high"></div>
<div>{crumbs_html(cr)}<h1>{E(t)}</h1><div class="mu">{E((it['line']+' · '+it['cat'] if zh else it['lineEn']+' · '+cen) if kind=='pose' else (cz_ if zh else cen))} · {'编号' if zh else 'No.'} {E(it.get('no') or it['id'])}</div>{tg}
{boxes}{ang}
<a class="go" href="/#{kind}/{it['id']}">{'在衣姿中打开' if zh else 'Open in PoseWear'}</a><a class="go" style="background:#111" href="/#studio">{'去试穿' if zh else 'Try on'}</a>{lic}</div>
<section class="rel"><h2>{('同类'+('姿势' if kind=='pose' else '穿搭' if kind=='costume' else '人像')) if zh else 'More like this'}</h2><ul>{rl}</ul></section></main>'''
  BID=url(lang,path)+'#breadcrumb';ld=[io,crumbs_ld(lang,cr,BID),{"@type":"WebPage","@id":url(lang,path),"url":url(lang,path),"name":ttl,"inLanguage":'zh-CN' if zh else 'en',"primaryImageOfPage":{"@id":url(lang,path)+'#image'},"breadcrumb":{"@id":BID}}]
  return shell(lang,path,ttl,desc,body,ld,en=kind in HAS_EN,og=img,ogt='article')
for kind,L in [('pose',SP),('costume',SC),('portrait',SR)]:
  ck=lambda x:catof(kind,x)[1]
  for i,it in enumerate(L):
    same=[x for x in L if ck(x)==ck(it) and x['id']!=it['id']];pos=sum(1 for x in L[:i] if ck(x)==ck(it));rel=(same[pos:]+same[:pos])[:8]
    imgs=[a['i'] for a in it['angles']] if kind=='pose' else [it['m']]
    for lang in (['zh','en'] if kind in HAS_EN else ['zh']):
      W(('/en' if lang=='en' else '')+f'/{kind}/{it["id"]}/',detail(lang,kind,it,rel))
    add(kind,f'/{kind}/{it["id"]}/',LM[kind],[(SITE+'/'+x,zh_title(kind,it)) for x in imgs],en=kind in HAS_EN)
# ---- 分类 / 标签 / 栏目页 ----
PER=96
INTRO={'pose':('{c}姿势参考图，共 {n} 个姿势，每个都有正面、俯拍、仰拍等多个角度，附中英文提示词，画画、拍照和 AI 出图都能用。','{c} pose references: {n} poses, each shot from several camera angles, with English prompts for drawing, photography and AI image generation.'),
 'costume':('{c}穿搭参考图，共 {n} 套，每套都有中文描述和英文提示词，可以在衣姿里上传照片在线试穿。','{c} outfit references: {n} looks, each with a description and an English prompt. Upload a photo to try them on in PoseWear.'),
 'portrait':('{c}人像脸模参考，共 {n} 张，AI 生成的虚构人物，CC0 1.0，可作 AI 绘图和视频的人物面部参考。','{c} face references: {n} AI-generated fictional people, CC0 1.0, for consistent characters in AI images and video.'),
 'tag':('带「{c}」的穿搭参考图，共 {n} 套，附中英文提示词。','Outfit references with {c}: {n} looks with English prompts.')}
def listing(lang,kind,base,slug,cz_,cen,L,kindi=None,en=True,sm='pages'):
  zh=lang=='zh';P='/en' if not zh else '';kindi=kindi or kind;n=len(L);c=cz_ if zh else cen
  pages=max(1,-(-n//PER))
  for pg in range(1,pages+1):
    path=f'{base}{slug}/'+(f'{pg}/' if pg>1 else '')
    cr=[(LAB[lang]['home'],P+'/'),(LAB[lang][kind],f'{P}{base}'),(c,None if pg==1 else f'{P}{base}{slug}/')]+([(f'第 {pg} 页' if zh else f'Page {pg}',None)] if pg>1 else [])
    ttl=(f"{c}{'' if kind=='tag' else {'pose':'姿势','costume':'穿搭','portrait':'人像'}[kind]}参考图{'' if pg==1 else f'（第 {pg} 页）'} | 衣姿 PoseWear" if zh else f"{c} {'Outfit' if kind in('costume','tag') else {'pose':'Pose','portrait':'Portrait'}[kind]} References{'' if pg==1 else f' – Page {pg}'} | PoseWear")
    desc=INTRO[kind][0 if zh else 1].format(c=c,n=n)
    items=L[(pg-1)*PER:pg*PER]
    pgn=''
    if pages>1: pgn='<nav class="pg" aria-label="pagination">'+''.join(f'<b>{i}</b>' if i==pg else f'<a href="{P}{base}{slug}/{"" if i==1 else str(i)+"/"}">{i}</a>' for i in range(1,pages+1))+'</nav>'
    body=f'<div class="wrap">{crumbs_html(cr)}<h1>{E(ttl.split(" | ")[0])}</h1><p class="lead">{E(desc)}</p><ul class="cg">{"".join(cardli(lang,kindi,it) for it in items)}</ul>{pgn}</div>'
    ld=[{"@type":"CollectionPage","@id":url(lang,path),"url":url(lang,path),"name":ttl,"description":desc,"inLanguage":'zh-CN' if zh else 'en',"isPartOf":{"@type":"WebSite","name":"衣姿 PoseWear","url":SITE+'/'}},crumbs_ld(lang,cr),
        {"@type":"ItemList","numberOfItems":len(items),"itemListElement":[{"@type":"ListItem","position":i+1,"url":SITE+('/en' if not zh and kindi in HAS_EN else '')+f'/{kindi}/{it["id"]}/'} for i,it in enumerate(items)]}]
    W(P+path,shell(lang,path,ttl,desc,body,ld,en=en))
    if lang=='zh': add(sm,path,LM[kindi],en=en)
CATS={'pose':[(PCAT[k][0],k,PCAT[k][1],[p for p in SP if p['cat']==k]) for k in PCAT],
 'costume':[(CCAT[k][0],k,CCAT[k][1],[c for c in SC if c['cat']==k]) for k in CCAT],
 'portrait':[(RSEC[k][0],k,RSEC[k][1],[r for r in SR if r['sec']==k]) for k in RSEC]+[(RLEN[k][0],k,RLEN[k][1],[r for r in SR if r['len']==k]) for k in RLEN]}
for lang in ['zh','en']:
  for kind,cs in CATS.items():
    for slug,z,e,L in cs: listing(lang,kind,f'/{kind}/',slug,z,e,L)
  for slug,t in TAGS.items(): listing(lang,'tag','/tag/',slug,t['zh'],t['en'],t['L'],kindi='costume')
NAMES={'pose':('姿势参考图库','Pose Reference Library'),'costume':('服装穿搭参考图库','Outfit Reference Library'),'portrait':('人像脸模参考图库','Portrait Face References'),'tag':('穿搭标签','Outfit Tags')}
CNT={'pose':len(SP),'costume':len(SC),'portrait':len(SR),'tag':len(TAGS)}
def hub(lang,kind):
  zh=lang=='zh';P='/en' if not zh else '';path=f'/{kind}/';nm=NAMES[kind][0 if zh else 1]
  cs=[(s,z,e,len(L)) for s,z,e,L in CATS[kind]] if kind!='tag' else [(s,t['zh'],t['en'],len(t['L'])) for s,t in sorted(TAGS.items(),key=lambda x:-len(x[1]['L']))]
  desc={'pose':('按分类浏览 {n} 个姿势参考，每个姿势都有多个拍摄角度和中英文提示词。','Browse {n} pose references by category, each with several camera angles and prompts.'),
   'costume':('按季节和场合浏览 {n} 套服装穿搭参考，附中英文提示词，可在线 AI 试穿。','Browse {n} outfit references by season and occasion, with prompts and online AI try-on.'),
   'portrait':('按类型和发长浏览 {n} 张人像脸模参考，CC0 1.0。','Browse {n} CC0 portrait face references by type and hair length.'),
   'tag':('按单品和颜色浏览穿搭参考，共 {n} 个标签。','Browse outfits by garment and colour: {n} tags.')}[kind][0 if zh else 1].format(n=CNT[kind])
  cr=[(LAB[lang]['home'],P+'/'),(LAB[lang][kind],None)]
  first={s:L[0] for s,z,e,L in CATS[kind]} if kind!='tag' else {s:t['L'][0] for s,t in TAGS.items()}
  ki='costume' if kind=='tag' else kind
  li=''.join(f'<li><a href="{P}/{kind}/{s}/"><img src="/{thumb(ki,first[s])}" alt="{E(z if zh else e)}" width="{TW[ki][0]}" height="{TW[ki][1]}" loading="lazy" decoding="async"><span>{E(z if zh else e)} · {n}</span></a></li>' for s,z,e,n in cs)
  extra='' if kind!='costume' else f'<p><a href="{P}/tag/">{"按单品和颜色浏览 →" if zh else "Browse by garment and colour →"}</a></p>'
  body=f'<div class="wrap">{crumbs_html(cr)}<h1>{E(nm)}</h1><p class="lead">{E(desc)}</p><ul class="cg">{li}</ul>{extra}</div>'
  ld=[{"@type":"CollectionPage","url":url(lang,path),"name":nm,"description":desc,"inLanguage":'zh-CN' if zh else 'en'},crumbs_ld(lang,cr)]
  W(P+path,shell(lang,path,f'{nm} | 衣姿 PoseWear' if zh else f'{nm} | PoseWear',desc,body,ld))
  if zh: add('pages',path,TODAY)
for lang in ['zh','en']:
  for k in NAMES: hub(lang,k)
# ---- 英文首页 ----
def featured(lang,n=12):return ''.join(cardli(lang,'costume',c) for c in SC[:n])
catlinks=lambda lang:''.join(f'<li><a href="{"/en" if lang=="en" else ""}/{k}/{s}/">{E(z if lang=="zh" else e)}</a></li>' for k in ['pose','costume'] for s,z,e,L in CATS[k])
en_desc=f"PoseWear: {len(SP)} pose sets ({NA_PUB} angle images), {len(SC):,} outfits and {len(SR):,} CC0 portraits, all with English and Chinese prompts — plus online AI try-on."
ENLD=[{"@type":"WebSite","@id":SITE+'/en/#website',"url":SITE+'/en/',"name":"PoseWear","alternateName":"衣姿 PoseWear","inLanguage":"en","description":en_desc,"potentialAction":{"@type":"SearchAction","target":{"@type":"EntryPoint","urlTemplate":SITE+'/?t=costume&q={search_term_string}'},"query-input":"required name=search_term_string"}},
 {"@type":"WebApplication","name":"PoseWear","url":SITE+'/en/',"applicationCategory":"DesignApplication","operatingSystem":"Any (web browser)","browserRequirements":"Requires JavaScript","inLanguage":["zh-CN","en"],"offers":{"@type":"Offer","price":"0","priceCurrency":"USD"},"description":en_desc}]
body=f'''<div class="wrap"><h1>Pose, outfit and portrait references with prompts</h1><p class="lead">{E(en_desc)} Favourite and combine references, copy prompts for Stable Diffusion or Midjourney, or upload your own photo to try an outfit on.</p>
<p><a class="go" href="/#costume">Open the gallery</a><a class="go" style="background:#111" href="/#studio">Try on online</a></p>
<section class="sec"><h2>Browse by category</h2><ul class="tg">{catlinks("en")}<li><a href="/en/portrait/">Portraits</a></li><li><a href="/en/tag/">Outfit tags</a></li></ul></section>
<section class="sec"><h2>Outfits</h2><ul class="cg">{featured("en")}</ul></section>
<section class="sec"><h2>Poses</h2><ul class="cg">{"".join(cardli("en","pose",p) for p in SP[:12])}</ul></section>
<section class="sec"><h2>About the images</h2><p class="lead">The code is open source (MIT, <a href="https://github.com/atuizz/posewear">GitHub</a>). Pose and outfit images come from AI Pose Gallery / AI Costume Gallery by <a href="https://x.com/giaaibusi">@giaaibusi</a> — no license is stated, so ask the author before reuse. Portraits come from AI Portrait Gallery by <a href="https://x.com/agi_aibusi">@agi_aibusi</a> under <a href="{CC0}" rel="license">CC0 1.0</a>. The app interface is in Chinese, with prompts available in English.</p></section></div>'''
W('/en/',shell('en','/','PoseWear – Pose & Outfit Reference Library with AI Prompts and Online Try-On',en_desc,body,ENLD))
add('pages','/',TODAY)
# ---- 中文首页：标题、描述、真实数字、前 N 项静态卡片、JSON-LD、hreflang ----
HC=dict(pose=len(SP),ang=NA_PUB,cos=len(SC),por=len(SR));HA=dict(pose=len(poses),ang=NA,cos=len(cos),por=len(pors))  # 首页计数唯一来源；改公开数：HC=dict(pose=len(SP),ang=NA_PUB,cos=len(SC),por=len(SR))
zh_desc=f"衣姿 PoseWear：{HC['pose']} 组姿势（{HC['ang']:,} 张角度图）、{HC['cos']:,} 套服装、{HC['por']:,} 张人像参考图，附中英文提示词，可上传照片在线 AI 试穿。免费，无需注册。"
zhttl='衣姿 PoseWear · 姿势、服装、人像参考图库 | 中英文提示词 + 在线 AI 试穿'
idx=open(f'{D}/index.html').read()
idx=re.sub(r'<title>.*?</title>',f'<title>{zhttl}</title>',idx,1)
idx=re.sub(r'<meta name="description" content="[^"]*">',f'<meta name="description" content="{E(zh_desc)}">',idx,1)
idx=re.sub(r'<meta property="og:title" content="[^"]*">','<meta property="og:title" content="衣姿 PoseWear：姿势、服装、人像参考图库">',idx,1)
idx=re.sub(r'<meta property="og:description" content="[^"]*">',f'<meta property="og:description" content="{E(zh_desc)}">',idx,1)
idx=idx.replace('<meta name="twitter:card" content="summary_large_image">',f'<meta name="twitter:card" content="summary_large_image"><meta name="twitter:description" content="{E(zh_desc)}">',1)
idx=idx.replace('<link rel="canonical" href="https://posewear.pages.dev/">',alts('/'))
LD=[{"@type":"WebSite","@id":SITE+'/#website',"url":SITE+'/',"name":"衣姿 PoseWear","alternateName":["PoseWear","衣姿"],"inLanguage":"zh-CN","description":zh_desc,
  "potentialAction":{"@type":"SearchAction","target":{"@type":"EntryPoint","urlTemplate":SITE+'/?t=costume&q={search_term_string}'},"query-input":"required name=search_term_string"}},
 {"@type":"WebApplication","name":"衣姿 PoseWear","url":SITE+'/',"applicationCategory":"DesignApplication","operatingSystem":"Any (web browser)","browserRequirements":"Requires JavaScript","inLanguage":["zh-CN","en"],
  "offers":{"@type":"Offer","price":"0","priceCurrency":"CNY"},"description":zh_desc,"image":SITE+'/og.png',"isAccessibleForFree":True,"featureList":["姿势参考图（多角度）","服装穿搭参考图","人像脸模参考（CC0）","中英文提示词","在线 AI 试穿"]}]
idx=idx.replace('</head>',f'<script type="application/ld+json">{json.dumps({"@context":"https://schema.org","@graph":LD},ensure_ascii=False,separators=(",",":"))}</script></head>',1)
HOME_COUNTS=[('288','pose'),('1439','ang'),('1407','cos'),('1499','por')]
for a,k in HOME_COUNTS:
  idx=idx.replace(f'<b data-n="{a}">0</b>',f'<b data-n="{HC[k]}" data-na="{HA[k]}">{HC[k]:,}</b>')
def ssr(p):
  t=p['zh'];a=p['angles'];return (f'<article class="card ssr"><div class="ph pose done"><a href="/pose/{p["id"]}/" class="ssl"><img class="ld" src="/{a[0]["t"]}" alt="{E(t)}" width="300" height="400" decoding="async"{"" if SP.index(p)<4 else " loading=\"lazy\""}></a><span class="badge">{p["no"]}</span></div>'
    f'<div class="info"><h3><a href="/pose/{p["id"]}/">{E(t)}</a></h3><div class="sub">{E(p["cat"])} · {len(a)} 个角度</div><div class="tags"><span class="tag">{E(p["line"])}</span><span class="tag c">{E(p["cat"])}</span></div></div></article>')
g=re.search(r'(<main id="grid"[^>]*>)(.*?)(</main>)',idx,re.S)
idx=idx[:g.start(2)]+''.join(ssr(p) for p in SP[:12])+idx[g.end(2):]
nav='<nav class="seoc" aria-label="分类浏览"><div><h4>姿势分类</h4>'+''.join(f'<a href="/pose/{s}/">{z}</a>' for s,z,e,L in CATS['pose'])+'</div><div><h4>服装分类</h4>'+''.join(f'<a href="/costume/{s}/">{z}</a>' for s,z,e,L in CATS['costume'])+'<a href="/tag/">按单品和颜色</a></div><div><h4>人像</h4>'+''.join(f'<a href="/portrait/{s}/">{z}</a>' for s,z,e,L in CATS['portrait'])+'</div><div><h4>其他</h4><a href="/pose/">姿势图库</a><a href="/costume/">服装图库</a><a href="/portrait/">人像图库</a><a href="/en/" hreflang="en" lang="en">English</a></div></nav>'
idx=idx.replace('<footer class="foot">',nav+'<footer class="foot">',1)
idx=idx.replace('https://posewear.pages.dev',SITE)  # 首页 og:url/canonical 等统一指向实际部署域名
open(f'{D}/index.html','w').write(idx)
# ---- 站点地图 ----
def smx(L,img=True):
  out=['<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n']
  for u,lm,ims in L:
    out.append(f'<url><loc>{u}</loc><lastmod>{lm}</lastmod>'+''.join(f'<image:image><image:loc>{E(i)}</image:loc></image:image>' for i,_ in ims)+'</url>\n')
  return ''.join(out)+'</urlset>\n'
SM['pages'].insert(0,(SITE+'/',TODAY,[(SITE+'/og.png','')]))
for k,L in SM.items(): open(f'{D}/sitemap-{k}.xml','w').write(smx(L))
ix='<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'+''.join(f'<sitemap><loc>{SITE}/sitemap-{k}.xml</loc><lastmod>{max(x[1] for x in L)}</lastmod></sitemap>\n' for k,L in SM.items())+'</sitemapindex>\n'
open(f'{D}/sitemap_index.xml','w').write(ix);open(f'{D}/sitemap.xml','w').write(ix)
open(f'{D}/robots.txt','w').write(f'User-agent: *\nAllow: /\nDisallow: /api/\nDisallow: /o/\n\nSitemap: {SITE}/sitemap_index.xml\n')
open('urls.txt','w').write('\n'.join(u for L in SM.values() for u,_,_ in L)+'\n')
open(f'{D}/_headers','a').write('/en/*\n  Cache-Control: public, max-age=600\n/tag/*\n  Cache-Control: public, max-age=600\n/sitemap*\n  Cache-Control: public, max-age=3600\n')
print('NA_PUB',NA_PUB);print('seo',{k:len(v) for k,v in SM.items()},'tags',len(TAGS))
