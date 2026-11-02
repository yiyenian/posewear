import json,os,shutil,subprocess
from costume_text import gen2
import hashlib,re,html as H
from concurrent.futures import ThreadPoolExecutor  # Windows 下进程池会 spawn 重跑整个脚本，改用线程池（Pillow 编码释放 GIL）
from PIL import Image
# 素材目录：默认 ./assets-raw，可用环境变量 POSEWEAR_RAW 指定（见 scripts/fetch-assets.py）
# POSEWEAR_LITE=1：精简构建，不产出 o/ 原寸图（详情页与灯箱回退到中等尺寸），适合部署到有体积限制的平台
R=os.environ.get('POSEWEAR_RAW','assets-raw'); D='dist'; LITE=os.environ.get('POSEWEAR_LITE')=='1'
LINE={'全身1人・セクシー系':('全身·性感','full body, solo, sexy'),'全身1人・標準系':('全身·标准','full body, solo'),'上半身1人':('上半身','upper body, solo'),'2人絡み':('双人互动','two people, couple')}
CAT={'寝そべり':'躺卧','セクシー・露骨寄り系':'性感·大胆','立ち':'站姿','座り':'坐姿','かわいい系':'可爱','胸寄せ・谷間強調系':'挤胸·乳沟','膝立ち・四つん這い':'跪立·趴姿','特殊':'特殊','正常位':'正面位','膝立ち':'跪立','横座り・女の子座り':'侧坐·鸭子坐','後背位':'后入位','背面座位':'背面坐位','しゃがみ':'蹲姿','前かがみ':'前倾','顔寄せ系':'贴脸','騎乗位':'骑乘位','立位':'立位','立位密着':'立位贴身','のけぞり・反り':'后仰','ひねり':'扭身','側位':'侧位','座位':'坐位','対面座位':'对面坐位','座位密着':'坐位贴身','密着':'贴身'}
ANG={'正面':('正面','front view'),'上から':('俯拍','high angle, from above'),'下から':('仰拍','low angle, from below'),'横':('侧面','side view'),'斜め':('斜侧','three-quarter view')}
CC={'春':('春季','spring'),'夏':('夏季','summer'),'秋':('秋季','autumn'),'冬':('冬季','winter'),'ランジェリー':('内衣','lingerie'),'パーティ':('派对礼服','party'),'水着':('泳装','swimsuit'),'セクシー':('性感','sexy')}
W=dict(l.split(':') for l in open('words.txt').read().split())
TR={l.split('|')[0]:l.split('|')[1:] for l in open('tr_pose.txt').read().strip().split('\n')}
pd=json.load(open(f'{R}/pose/data.json'))['D']; cd=json.load(open(f'{R}/costume/data.json'))['D']
poses={}
for d in pd:
  k=d['id'].rsplit('_',1)[0]; zh,en=TR[d['ポーズ名']]
  p=poses.setdefault(k,{'id':k,'no':d['ポーズ番号'],'line':LINE[d['系統']][0],'cat':CAT[d['分類']],'ja':d['ポーズ名'],'zh':zh,'en':en,'lineEn':LINE[d['系統']][1],'angles':[]})
  a=ANG[d['アングル']]; p['angles'].append({'zh':a[0],'en':a[1],'t':'p/t/'+d['id']+'.webp','i':'p/i/'+d['id']+'.webp','o':('p/i/'+d['id']+'.webp') if LITE else 'o/p/'+d['id']+'.png','_src':d})
cos=[{'id':d['id'],'cat':CC[d['カテゴリ']][0],'catEn':CC[d['カテゴリ']][1],'kw':d['キーワード'],**dict(zip(('zh','en','ti'),gen2(d['キーワード'],CC[d['カテゴリ']][1],d['id']))),'t':'c/t/'+os.path.basename(d['サムネ']),'m':'c/m/'+d['id']+'.webp','i':('c/m/'+d['id']+'.webp') if LITE else 'c/i/'+os.path.basename(d['画像']),'o':('c/m/'+d['id']+'.webp') if LITE else 'o/c/'+d['id']+'.png','_src':d} for d in cd]
# 双人 分类人工复核（看图）
FIX={'pair60_P031':'坐位','pair60_P053':'立位贴身','pair60_P055':'侧位','pair60_P058':'贴脸'}
for k,v in FIX.items(): poses[k]['cat']=v
ADULT_LINES={'双人互动','全身·性感'};ADULT_CATS={'挤胸·乳沟','性感·大胆'};ADULT_COS={'内衣','性感'}
for p in poses.values():
  if p['line'] in ADULT_LINES or p['cat'] in ADULT_CATS: p['a']=1
for c in cos:
  if c['cat'] in ADULT_COS: c['a']=1
os.makedirs(D,exist_ok=True)
for f in os.listdir('src'): shutil.copy('src/'+f,D)
J=lambda o:json.dumps(o,ensure_ascii=False,separators=(',',':'))
SRC={}
for p in poses.values():
  for a in p['angles']: SRC[a['i']]=a.pop('_src')
for c in cos: SRC[c['id']]=c.pop('_src')
# 安全内容排在前面（默认落地页无露骨内容）
PL=sorted(poses.values(),key=lambda p:p.get('a',0))
PJ=J(PL);CJ=J(cos)

# ---------- 人像库（AI Portrait Gallery，CC0，@agi_aibusi）----------
rt=open(f'{R}/portrait/images.js').read();rd=json.loads(rt[rt.index('['):rt.rindex(']')+1])
rk=open(f'{R}/portrait/ranking.js').read();RK=json.loads(rk[rk.index('{'):rk.rindex('}')+1])
TRP={l.split('|')[0]:l.split('|')[1:] for l in open('tr_portrait.txt').read().strip().split('\n')}
LEN={'ショート':('短发','short hair'),'ミディアム':('中长发','medium-length hair'),'セミロング':('半长发','shoulder-length hair'),'ロング':('长发','long hair')}
SEC={'face':('正脸','front-facing head-and-shoulders portrait, plain light grey background, soft even lighting'),'styling':('生活照','casual selfie-style lifestyle photo, indoor natural light')}
RANK={x:i+1 for i,x in enumerate(RK['top']['総合'])}
RANKC={}
for c,L in RK['top'].items():
  if c!='総合':
    for i,x in enumerate(L):RANKC[x]=i+1
pors=[];seq={}
for d in rd:
  sec=SEC[d['section']];ln=LEN[d['hair']];sz,se=TRP.get(d['style'],['',''])
  seq[d['section']]=seq.get(d['section'],0)+1;no=('F' if d['section']=='face' else 'S')+str(seq[d['section']]).zfill(3)
  zh=f"一位亚洲年轻女性，{ln[0]}{'，'+sz if sz else ''}，{'正面半身肖像，浅灰纯色背景，柔和均匀的光线' if d['section']=='face' else '自拍风生活照，室内自然光'}。作为人物面部参考，保持五官和脸型一致。"
  en=f"young Asian woman, {ln[1]}{', '+se if se else ''}, {sec[1]}, consistent facial features, face reference"
  it={'id':d['id'],'no':no,'sec':sec[0],'len':ln[0],'st':sz,'ti':sz or f"{ln[0]} · {sec[0]}",'zh':zh,'en':en,'ja':d['style'] or d['hair'],'t':'r/t/'+d['id']+'.webp','m':'r/m/'+d['id']+'.webp','i':'r/m/'+d['id']+'.webp','o':('r/m/'+d['id']+'.webp') if LITE else 'o/r/'+d['id']+'.png','w':d['w'],'h':d['h']}
  if d['id'] in RANK: it['rk']=RANK[d['id']]
  if d['id'] in RANKC: it['rc']=RANKC[d['id']]
  pors.append(it)
RJ=J(pors)
if os.path.exists(f'{D}/data.js'): os.remove(f'{D}/data.js')
for a,b in [('costume/thumbs','c/t')]+([] if LITE else [('costume/img','c/i')]):
  shutil.copytree(f'{R}/{a}',f'{D}/{b}',dirs_exist_ok=True)
os.makedirs(f'{D}/p/i',exist_ok=True)
def cv(d):
  t=f"{D}/p/t/{d['id']}.webp"
  if not os.path.exists(t):
    im=Image.open(f"{R}/pose/{d['サムネ']}").convert('RGB');im.save(t,'WEBP',quality=80,method=6)
  if not LITE:
    o=f"{D}/o/p/{d['id']}.png"
    if not os.path.exists(o): os.link(f"{R}/pose/{d['原寸']}",o)
  o=f"{D}/p/i/{d['id']}.webp"
  if not os.path.exists(o):
    im=Image.open(f"{R}/pose/{d['原寸']}").convert('RGB'); im.thumbnail((1200,1200)); im.save(o,'WEBP',quality=82)

def cm(d):
  o=f"{D}/c/m/{d['id']}.webp"
  if not os.path.exists(o):
    im=Image.open(f"{R}/costume/{d['画像']}").convert('RGB'); im.thumbnail((1080,1620)); im.save(o,'WEBP',quality=80)
  if not LITE:
    o=f"{D}/o/c/{d['id']}.png"
    if not os.path.exists(o): os.link(f"{R}/costume/{d['原寸']}",o)
def cr(d):
  t=f"{D}/r/t/{d['id']}.webp"
  if not os.path.exists(t): shutil.copy(f"{R}/portrait/{d['thumb']}",t)
  o=f"{D}/r/m/{d['id']}.webp"
  if not os.path.exists(o):
    im=Image.open(f"{R}/portrait/{d['full']}").convert('RGB'); im.thumbnail((1080,1350)); im.save(o,'WEBP',quality=80)
  if not LITE:
    o=f"{D}/o/r/{d['id']}.png"
    if not os.path.exists(o): os.link(f"{R}/portrait/{d['full']}",o)
for x in ['p/t','c/m']+([] if LITE else ['o/p','o/c','o/r','c/i'])+['r/t','r/m']: os.makedirs(f'{D}/{x}',exist_ok=True)
if os.path.exists(f'{D}/p/t'):
  for f in os.listdir(f'{D}/p/t'):
    if f.endswith('.jpg'): os.remove(f'{D}/p/t/{f}')
with ThreadPoolExecutor(16) as ex: list(ex.map(cv,pd)); list(ex.map(cm,cd)); list(ex.map(cr,rd))
exec(open('post.py').read())
print(len(poses),len(cos))
