'use strict';
let Q0='',QT='';try{const u=new URLSearchParams(location.search);Q0=(u.get('q')||'').slice(0,60);QT=u.get('t')||''}catch(e){}
const $=s=>document.querySelector(s),$$=s=>document.querySelectorAll(s),LS=k=>{try{return JSON.parse(localStorage[k]||'null')}catch(e){return null}},SV=(k,v)=>{try{localStorage[k]=JSON.stringify(v)}catch(e){}};
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const RM=matchMedia('(prefers-reduced-motion: reduce)').matches,HOVER=matchMedia('(hover:hover) and (pointer:fine)').matches;
const ITEMS={},DATA={},LOAD={},TABS=['pose','costume','portrait','studio','fav','recent'],TNAME={pose:'姿势库',costume:'服装库',portrait:'人像库',studio:'试穿',fav:'我的收藏',recent:'最近浏览'};
const PFX={pose:'p:',costume:'c:',portrait:'r:'},KT={p:'pose',c:'costume',r:'portrait'},TL=it=>({pose:'姿势',costume:'服装',portrait:'人像'})[it.type];
const st={tab:'pose',q:'',f:{},sort:'def',lang:LS('lang')||'zh',tl:LS('tl')||'zh',fav:new Set(LS('fav')||[]),sel:LS('sel')||[],rec:LS('rec')||[],recT:LS('recT')||{},ang:LS('ang')||{},list:[],n:0,adult:LS('adult')===true};
const ok=it=>it&&(st.adult||!it.a);
// ---------- 我的面孔（自定义人像，IndexedDB 本地存储）+ 内置人像隐藏 ----------
let FDB;const fdb=()=>FDB||(FDB=new Promise((r,j)=>{const q=indexedDB.open('posewear-faces',1);q.onupgradeneeded=()=>q.result.createObjectStore('f',{keyPath:'id'});q.onsuccess=()=>r(q.result);q.onerror=()=>j(q.error)}));
const ftx=async(m,fn)=>{const d=await fdb();return new Promise((r,j)=>{const t=d.transaction('f',m),q=fn(t.objectStore('f'));t.oncomplete=()=>r(q&&q.result);t.onerror=()=>j(t.error)})};
const HIDF=new Set(LS('hideF')||[]),FACES=[];let faceN=LS('faceN')||0;
const faceItem=rec=>{const u=URL.createObjectURL(rec.blob);return{type:'portrait',k:'r:'+rec.id,id:rec.id,u:1,ti:rec.name,zh:rec.zh,en:rec.en,ja:'自定义',sec:'我的面孔',len:'自定义',no:'我的',t:u,m:u,i:u,o:u,w:rec.w,h:rec.h}};
function mergeFaces(){if(!DATA.portrait)return;FACES.forEach(rec=>{const k='r:'+rec.id;if(!ITEMS[k]){const it=faceItem(rec);ITEMS[k]=it;DATA.portrait.unshift(it)}})}
function pruneFaces(){if(!DATA.portrait)return;const n=DATA.portrait.length;DATA.portrait=DATA.portrait.filter(it=>!HIDF.has(it.k));if(DATA.portrait.length!=n){DATA.portrait.forEach(it=>HIDF.has(it.k)&&delete ITEMS[it.k]);Object.keys(ITEMS).forEach(k=>ITEMS[k].type=='portrait'&&!DATA.portrait.includes(ITEMS[k])&&HIDF.has(k)&&delete ITEMS[k]);counts()}}
async function addFaceFiles(files){const fs=[...files].filter(f=>/^image\//.test(f.type));if(!fs.length)return toast('没有可读取的图片');fcOpen(fs)}
// ---------- 面孔裁切器：输出统一 1080×1350（与人像库一致） ----------
let fcQ=[],fcImg=null,fcOX=0,fcOY=0,fcMode='cover';
function fcOpen(files){fcQ=files.slice();$('#fc').hidden=false;document.body.style.overflow='hidden';fcNext()}
function fcClose(){$('#fc').hidden=true;fcQ=[];fcImg=null;document.body.style.overflow=''}
function fcNext(){fcOX=0;fcOY=0;fcMode='cover';$('#fcZoom').value=1;$('#fcName').value='';FATTR={sex:'女',age:'年轻',hair:'短发',color:'黑色',extra:[]};fcChipsDraw();$('#fcQ').textContent=fcQ.length>1?`队列中还有 ${fcQ.length-1} 张待裁切`:'';
 if(!fcQ.length){fcClose();toast('面孔已添加，可在人像库和试穿里使用');return}
 const f=fcQ[0],u=URL.createObjectURL(f),i=new Image();
 i.onload=()=>{URL.revokeObjectURL(u);fcImg=i;fcDraw()};
 i.onerror=()=>{URL.revokeObjectURL(u);toast('有一张图片读取失败');fcQ.shift();fcNext()};
 i.src=u}
$('#fcDetect').onclick=fcDetectHair;
$('#fc').addEventListener('click',e=>{const b=e.target.closest('[data-fg]');if(!b)return;const g=b.dataset.fg,v=b.dataset.v;
 if(g=='extra'){const i=FATTR.extra.indexOf(v);i>=0?FATTR.extra.splice(i,1):FATTR.extra.push(v)}else FATTR[g]=v;
 fcChipsDraw()});
function fcBase(){return fcMode=='cover'?Math.max(1080/fcImg.naturalWidth,1350/fcImg.naturalHeight):Math.min(1080/fcImg.naturalWidth,1350/fcImg.naturalHeight)}
function fcDraw(){if(!fcImg)return;const c=$('#fcCv'),x=c.getContext('2d');x.fillStyle='#dcdcdc';x.fillRect(0,0,1080,1350);const s=fcBase()*+$('#fcZoom').value,w=fcImg.naturalWidth*s,h=fcImg.naturalHeight*s;x.drawImage(fcImg,540-w/2+fcOX,675-h/2+fcOY,w,h);fcDetectHair()}
// 人物描述：特征标签 + 发色自动识别
const FGRP={sex:['女','男'],age:['年轻','中年'],hair:['短发','中长发','长发','卷发','马尾'],color:['黑色','深棕','棕色','金黄色','浅色'],extra:['眼镜','刘海']};
const FEN={sex:{女:'young woman',男:'young man'},age:{年轻:'young',中年:'middle-aged'},hair:{短发:'short hair',中长发:'medium-length hair',长发:'long hair',卷发:'curly hair',马尾:'ponytail'},color:{黑色:'black',深棕:'dark brown',棕色:'brown',金黄色:'golden blond',浅色:'light-colored'},extra:{眼镜:'wearing glasses',刘海:'with bangs'}};
let FATTR={sex:'女',age:'年轻',hair:'短发',color:'黑色',extra:[]};
function fcChipsDraw(){for(const g in FGRP){const el=$('#fc'+g[0].toUpperCase()+g.slice(1));el.innerHTML=FGRP[g].map(v=>`<button class="chip ${FATTR[g]==v||(g=='extra'&&FATTR.extra.includes(v))?'on':''}" data-fg="${g}" data-v="${v}">${v}</button>`).join('')}
 const ex=FATTR.extra.length?'，'+FATTR.extra.join('、'):'';
 $('#fcDesc').textContent=`将保存描述 → 一位${FATTR.age!='年轻'?FATTR.age:''}${FATTR.sex=='女'?'女性':'男性'}，${FATTR.color}${FATTR.hair}${ex}`}
function fcDescText(){const ex=FATTR.extra.filter(x=>x!='刘海').map(x=>FEN.extra[x]).join(' and ');
 const zhx=FATTR.sex=='女'?'女性':'男性';
 return{zh:`一位${FATTR.age!='年轻'?FATTR.age:''}${zhx}，${FATTR.color}${FATTR.hair}${FATTR.extra.length?'，'+FATTR.extra.join('、'):''}。保持这张脸的长相与发型，作为人物一致性参考。`,
  en:`${FATTR.color=='浅色'?'light-colored':FEN.color[FATTR.color]} ${FEN.hair[FATTR.hair]} ${FEN.sex[FATTR.sex]}${FATTR.age=='中年'?' (middle-aged)':''}${ex?', '+ex:''}, consistent facial features, same face across images, face reference`}}
function fcDetectHair(){if(!fcImg)return;try{const c=$('#fcCv'),x=c.getContext('2d');
 const d=x.getImageData(Math.round(c.width*.35),Math.round(c.height*.06),Math.round(c.width*.3),Math.round(c.height*.16)).data;
 let r=0,g=0,b=0,n=0;for(let i=0;i<d.length;i+=16){r+=d[i];g+=d[i+1];b+=d[i+2];n++}
 r/=n;g/=n;b/=n;const lum=.299*r+.587*g+.114*b,sat=Math.max(r,g,b)-Math.min(r,g,b);
 FATTR.color=lum<70?'黑色':lum<110?(r>b+14?'深棕':'黑色'):lum<150?(r>b+20?'棕色':'深棕'):(r>g+16&&g>b?'金黄色':'浅色');
 fcChipsDraw()}catch(e){}}
function fcClamp(){if(!fcImg)return;const s=fcBase()*+$('#fcZoom').value,w=fcImg.naturalWidth*s,h=fcImg.naturalHeight*s,mx=Math.max(0,(w-1080)/2),my=Math.max(0,(h-1350)/2);fcOX=Math.max(-mx,Math.min(mx,fcOX));fcOY=Math.max(-my,Math.min(my,fcOY))}
async function fcSave(blob,w,h,desc,name){faceN++;SV('faceN',faceN);
 const rec={id:'u'+Date.now().toString(36)+faceN,name:(name&&name.trim())||('我的面孔 '+faceN),zh:desc.zh,en:desc.en,blob,w,h};
 await ftx('readwrite',st=>st.put(rec));FACES.push(rec);
 if(DATA.portrait){const it=faceItem(rec);ITEMS[it.k]=it;DATA.portrait.unshift(it)}
 counts();if(st.tab=='portrait')viewT(apply)}
function fcDone(){fcQ.shift();if(fcQ.length)return fcNext();fcClose();toast('面孔已添加，可在人像库和试穿里使用')}
async function renameFace(it,nn){it.ti=nn;const rec=FACES.find(r=>r.id==it.id);
 if(rec){rec.name=nn;try{await ftx('readwrite',s=>s.put(rec))}catch(e){return toast('重命名失败')}}
 refreshCard(it.k);if(!$('#lb').hidden)lbDraw();toast('已重命名为「'+nn+'」')}
async function delFace(it){
 if(it.u){try{await ftx('readwrite',s=>s.delete(it.id))}catch(e){}const i=FACES.findIndex(r=>r.id==it.id);if(i>=0)FACES.splice(i,1)}else{HIDF.add(it.k);SV('hideF',[...HIDF])}
 if(DATA.portrait){const i=DATA.portrait.findIndex(x=>x.k==it.k);if(i>=0)DATA.portrait.splice(i,1)}delete ITEMS[it.k];
 if(st.fav.has(it.k)){st.fav.delete(it.k);SV('fav',[...st.fav])}if(st.rec.includes(it.k)){st.rec=st.rec.filter(x=>x!=it.k);SV('rec',st.rec)}
 counts();if(!$('#lb').hidden)lbClose();if(st.tab=='portrait')dropCard(it.k);toast(it.u?'已删除此面孔':'已从人像库隐藏此面孔')}
function load(t){return LOAD[t]||(LOAD[t]=fetch({pose:'poses.json',costume:'costumes.json',portrait:'portraits.json'}[t]).then(r=>{if(!r.ok)throw Error(r.status);return r.json()}).then(a=>{a.forEach((it,i)=>{it.type=t;it.k=PFX[t]+it.id;it.ord=i;if(t=='pose')it.ai=st.ang[it.k]||0;ITEMS[it.k]=it});DATA[t]=a;if(t=='portrait'){mergeFaces();pruneFaces()}counts();return a}).catch(e=>{delete LOAD[t];throw e}))}
const needKeys=ks=>Promise.all([...new Set(ks.map(k=>KT[k[0]]).filter(Boolean))].map(load));
const thumb=it=>it.type=='pose'?it.angles[it.ai].t:it.t,big=it=>it.type=='pose'?it.angles[it.ai].i:(innerWidth*(devicePixelRatio||1)>1500?it.i:it.m);
const orig=it=>'/'+(it.type=='pose'?it.angles[it.ai].o:it.o);
function prompt(it,lang){if(it.type=='pose'){const a=it.angles[it.ai];return lang=='en'?`${it.en}, ${it.lineEn}, ${a.en}`:`${it.zh}，${it.line}，${a.zh}`}return lang=='en'?it.en:it.zh}
const title=it=>it.type=='pose'?it.zh:it.ti;
const subtitle=it=>st.lang=='en'?prompt(it,'en'):it.type=='pose'?`${it.cat} · ${it.angles.length} 个角度`:it.type=='portrait'?`${it.sec} · ${it.len}${it.rk?' · 人气第 '+it.rk:''}`:it.zh;
function toast(t,undo){const e=$('#toast');e.textContent=t;if(undo){const b=document.createElement('button');b.textContent='撤销';b.onclick=()=>{e.classList.remove('on','act');undo()};e.append(b)}e.classList.toggle('act',!!undo);e.classList.remove('on');void e.offsetWidth;e.classList.add('on');clearTimeout(e._t);e._t=setTimeout(()=>e.classList.remove('on','act'),undo?4500:1800)}
const EI={'fav': '<svg viewBox="0 0 24 24"><path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/></svg>', 'rec': '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8"/><path d="M12 8v4l3 2"/></svg>', 'q': '<svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>'};
async function copy(t,label){try{await navigator.clipboard.writeText(t)}catch(e){const a=document.createElement('textarea');a.value=t;a.style.cssText='position:fixed;opacity:0';document.body.append(a);a.select();document.execCommand('copy');a.remove()}toast('已复制'+(label?'「'+label+'」':''))}
function counts(){if(DATA.pose)$('#nPose').textContent=DATA.pose.filter(ok).length;if(DATA.costume)$('#nCos').textContent=DATA.costume.filter(ok).length;if(DATA.portrait)$('#nPor').textContent=DATA.portrait.length;const nf=[...st.fav].filter(k=>!ITEMS[k]||ok(ITEMS[k])).length;$('#nFav').textContent=nf||'';$('#nRec').textContent=st.rec.filter(k=>!ITEMS[k]||ok(ITEMS[k])).length||'';requestAnimationFrame(moveInd)}
const FDEF={pose:[['line','系列'],['cat','分类'],['ang','角度']],costume:[['cat','分类'],['col','颜色'],['item','单品']],portrait:[['sec','类型'],['len','发长'],['st','发型']],fav:[['type','类型']],recent:[['type','类型']]};
const FLAB={sec:'类型',len:'发长',st:'发型',line:'系列',cat:'分类',ang:'角度',col:'颜色',item:'单品',type:'类型'};
const COLS={'黑':'black','白':'white','红':'red','粉':'pink','蓝':'blue','藏青':'navy','棕':'brown','米':'beige','象牙白':'ivory','灰':'grey','绿':'green','黄':'yellow','紫':'purple','金':'gold','银':'silver','卡其':'khaki','酒红':'burgundy','橙':'orange','奶油':'cream','薄荷':'mint','薰衣草':'lavender','橄榄':'olive'};
const ITEMK={'连衣裙':'dress','半身裙':'skirt','短裤':'shorts','长裤':'trousers','牛仔裤':'jeans','大衣':'coat','夹克':'jacket','开衫':'cardigan','衬衫':'blouse','毛衣':'sweater','吊带':'camisole','文胸':'bra','泳衣':'swimsuit','靴子':'boots','高跟鞋':'high heels','运动鞋':'sneakers','凉鞋':'sandals','连裤袜':'tights','长筒袜':'stockings'};
const SUGG={pose:['站姿','坐姿','回头','双手抱头','可爱','躺卧','比心','跪立'],costume:['连衣裙','黑色','泳装','针织','蕾丝','冬季','牛仔','高跟鞋'],portrait:['短发','波波','狼尾','刘海','卷','奶茶','黑发','正脸'],fav:[],recent:[]};
function base(){return(st.tab=='fav'?[...st.fav].reverse().map(k=>ITEMS[k]):st.tab=='recent'?st.rec.map(k=>ITEMS[k]):DATA[st.tab]||[]).filter(ok)}
function val(it,key){if(key=='ang')return it.angles.map(a=>a.zh);if(key=='type')return[TL(it)];
 if(key=='col'){if(!it.kw)return[];if(!it._c){const w=' '+it.kw+' ';it._c=Object.keys(COLS).filter(c=>w.includes(' '+COLS[c]+' '))}return it._c}
 if(key=='item'){if(!it.kw)return[];if(!it._i){const e=' '+it.en.replace(/,/g,' ')+' ';it._i=Object.keys(ITEMK).filter(z=>e.includes(' '+ITEMK[z]+' '))}return it._i}return it[key]?[it[key]]:[]}
function drawFilters(){const b=base();const rows=FDEF[st.tab].map(([key,lab])=>{const c={};b.forEach(it=>val(it,key).forEach(v=>c[v]=(c[v]||0)+1));const ent=Object.entries(c).sort((a,b)=>b[1]-a[1]);if(ent.length<2&&!st.f[key])return'';
 return `<div class="frow" role="group" aria-label="${lab}"><label>${lab}</label><button class="chip ${!st.f[key]?'on':''}" data-k="${key}" data-v="" aria-pressed="${!st.f[key]}">全部</button>${ent.map(([v,n])=>`<button class="chip ${st.f[key]==v?'on':''}" data-k="${key}" data-v="${esc(v)}" aria-pressed="${st.f[key]==v}">${esc(v)}<i>${n}</i></button>`).join('')}</div>`}).join('');
 $('#filters').innerHTML=`<div class="dh"><b>筛选</b><button class="sm pri" data-done>完成</button></div>`+rows;
 const act=Object.entries(st.f).filter(e=>e[1]);$('#active').innerHTML=act.map(([k,v])=>`<button data-k="${k}" title="移除此条件">${FLAB[k]}：${esc(v)} ✕</button>`).join('');$('#fN').textContent=act.length||'';$('#clearAll').hidden=!(act.length||st.q)}
function shuffle(a){for(let i=a.length-1;i>0;i--){const j=Math.random()*(i+1)|0;[a[i],a[j]]=[a[j],a[i]]}return a}
function apply(){const q=st.q.toLowerCase().trim().split(/\s+/).filter(Boolean);
 let L=base().filter(it=>Object.entries(st.f).every(([k,v])=>!v||val(it,k).includes(v))&&q.every(w=>(it._s||(it._s=[it.id,it.ti,it.zh,it.en,it.ja,it.kw,it.cat,it.catEn,it.line,it.no,it.sec,it.len,it.st,...(it.angles||[]).map(a=>a.zh)].join(' ').toLowerCase())).includes(w)));
 if(st.f.ang)L.forEach(it=>{const i=it.angles.findIndex(a=>a.zh==st.f.ang);if(i>=0)it.ai=i});
 if(st.sort=='id')L=L.slice().reverse();else if(st.sort=='shuf')L=shuffle(L.slice());else if(st.sort=='rank')L=L.slice().sort((a,b)=>(a.rk||a.rc&&a.rc+10||999)-(b.rk||b.rc&&b.rc+10||999));else if(st.sort=='fav')L=L.slice().sort((a,b)=>st.fav.has(b.k)-st.fav.has(a.k));
 st.list=L;const tot=base().length;$('#count').innerHTML=L.length==tot?`共 <b>${tot}</b> 项`:`<b>${L.length}</b> / ${tot} 项`;$('#grid').innerHTML='';st.n=0;
 const em=!L.length;$('#empty').hidden=!em;$('#clearAll').hidden=!(Object.values(st.f).some(Boolean)||st.q);
 document.body.classList.toggle('none0',(st.tab=='fav'||st.tab=='recent')&&!tot);
 if(em){const none=(st.tab=='fav'||st.tab=='recent')&&!tot;$('#emptyT').textContent=none?(st.tab=='fav'?'还没有收藏':'还没有浏览记录'):'没有找到匹配的内容';
  $('#emptyP').textContent=none?(st.tab=='fav'?'看到喜欢的，点卡片右上角的 ♡。收藏只存在这台设备的浏览器里，可以导出备份。':'打开过的大图会按时间排在这里，最多保留 100 条。'):'换个关键词试试，或者看看这些热门搜索：';
  $('#sugg').innerHTML=none?'':SUGG[st.tab].map(s=>`<button class="chip" data-s="${s}">${s}</button>`).join('');$('#reset').hidden=none;$('#empty .emo').innerHTML=none?(st.tab=='fav'?EI.fav:EI.rec):EI.q;$('#emptyGo').innerHTML=none?'<button class="sm" data-go="pose">逛姿势库</button><button class="sm" data-go="costume">逛服装库</button><button class="sm" data-go="portrait">逛人像库</button>':''}
 more()}
function card(it,d){const isS=st.sel.includes(it.k),isF=st.fav.has(it.k),P=it.type=='pose',t=title(it);
 const tags=P?[[it.line,''],[it.cat,'c']]:it.type=='portrait'?[[it.sec,'c'],[it.len,'']]:[[it.cat,'c'],...val(it,'item').slice(0,3).map(x=>[x,''])];
 return `<article class="card ${isS?'sel':''}" data-k="${it.k}" style="animation-delay:${d||0}ms"><div class="ph ${P?'pose':'cos'}" data-a="open"><img loading="lazy" decoding="async" src="${thumb(it)}" alt="${esc(t)}" width="${P?300:it.type=='portrait'?400:360}" height="${P?400:it.type=='portrait'?500:540}" draggable="false"><button class="phk" data-a="open" aria-label="${esc(t)}"></button>
 ${it.rk?`<span class="badge rk">TOP ${it.rk}</span>`:''}${P?`<span class="badge">${it.no}</span><div class="angs">${it.angles.map((a,i)=>`<span data-a="ang" data-i="${i}" class="${i==it.ai?'on':''}">${a.zh}</span>`).join('')}</div>`:''}
 ${st.tab=='recent'?'<button data-a="unrec" class="unrec" title="从记录中移除" aria-label="从记录中移除">✕</button>':it.type=='portrait'?'<button data-a="delf" class="unrec" title="从人像库移除" aria-label="从人像库移除">✕</button>':''}<div class="cbtns"><button data-a="fav" class="${isF?'on':''}" title="${isF?'取消收藏':'收藏'}" aria-label="收藏" aria-pressed="${isF}">${isF?'♥':'♡'}</button><button data-a="sel" class="${isS?'on':''}" title="${isS?'移出组合':'加入组合'}" aria-label="加入组合" aria-pressed="${isS}">${isS?'✓':'＋'}</button></div><button class="try" data-a="try">${P?'用作姿势参考':it.type=='portrait'?'用作人物参考':'试穿这套'}</button></div>
 <div class="info"><h3 title="${esc(t)}">${esc(t)}</h3><div class="sub">${esc(subtitle(it))}</div><div class="tags">${tags.map(([x,c])=>`<span class="tag ${c}">${esc(x)}</span>`).join('')}</div>
 <div class="copy"><button data-a="cpzh">复制中文</button><button data-a="cpen">复制英文</button></div></div></article>`}
function grp(k){const t=st.recT[k];if(!t)return'更早';const d=new Date();d.setHours(0,0,0,0);return t>=d?'今天':t>=d-864e5?'昨天':t>=d-6*864e5?'近 7 天':'更早'}
function more(){if(st.n>=st.list.length)return;const G=st.tab=='recent'&&!st.q&&!Object.values(st.f).some(Boolean);let pg=G&&st.n?grp(st.list[st.n-1].k):'';const h=st.list.slice(st.n,st.n+30).map((it,i)=>{let x='';if(G){const g=grp(it.k);if(g!=pg){x=`<h4 class="grp">${g}</h4>`;pg=g}}return x+card(it,RM?0:Math.min(i,14)*35)}).join('');st.n+=30;$('#grid').insertAdjacentHTML('beforeend',h)}
const grid=$('#grid');
grid.addEventListener('load',e=>{if(e.target.tagName=='IMG'){e.target.classList.add('ld');e.target.parentNode.classList.add('done')}},true);
grid.addEventListener('error',e=>{if(e.target.tagName=='IMG'){e.target.parentNode.classList.add('err','done')}},true);
new IntersectionObserver(e=>e[0].isIntersecting&&more(),{rootMargin:'1400px'}).observe($('#sentinel'));
function refreshCard(k){const el=grid.querySelector(`.card[data-k="${CSS.escape(k)}"]`);if(!el)return;const t=document.createElement('div');t.innerHTML=card(ITEMS[k]);const n=t.firstElementChild;n.style.animation='none';n.querySelector('img').classList.add('ld');n.querySelector('.ph').classList.add('done');el.replaceWith(n)}
function setAng(it,i){it.ai=i;st.ang[it.k]=i;SV('ang',st.ang);refreshCard(it.k)}
function dropCard(k){const el=grid.querySelector(`.card[data-k="${CSS.escape(k)}"]`);const i=st.list.findIndex(x=>x.k==k);if(i>=0){st.list.splice(i,1);st.n=Math.max(0,st.n-1)}const fin=()=>{el&&el.remove();if(!st.list.length)apply();else{const tot=base().length;$('#count').innerHTML=st.list.length==tot?`共 <b>${tot}</b> 项`:`<b>${st.list.length}</b> / ${tot} 项`;grid.querySelectorAll('.rgrp').forEach(g=>{const n=g.nextElementSibling;if(!n||n.classList.contains('rgrp'))g.remove()})}};if(el&&!RM)el.animate([{opacity:1,transform:'none'},{opacity:0,transform:'scale(.92)'}],{duration:220,easing:'cubic-bezier(.4,0,.2,1)'}).finished.then(fin);else fin()}
function toggleFav(k,quiet){const on=!st.fav.has(k);on?st.fav.add(k):st.fav.delete(k);SV('fav',[...st.fav]);counts();if(!quiet)toast(on?'已加入收藏':'已取消收藏',on?null:()=>{toggleFav(k,1);if(st.tab=='fav')apply()});if(!on&&st.tab=='fav'&&$('#lb').hidden)dropCard(k);else{refreshCard(k);if(st.tab=='fav')pend.add(k)}if(!$('#lb').hidden)lbDraw()}
function unRec(k){const old=st.rec.slice();st.rec=st.rec.filter(x=>x!=k);SV('rec',st.rec);counts();dropCard(k);toast('已从记录中移除',()=>{st.rec=old;SV('rec',old);counts();apply()})}
function toggleSel(k){const i=st.sel.indexOf(k);i>=0?st.sel.splice(i,1):st.sel.push(k);SV('sel',st.sel);refreshCard(k);tray(i<0);toast(i<0?'已加入组合':'已移出组合');if(!$('#lb').hidden)lbDraw()}
function combo(lang){const its=st.sel.map(k=>ITEMS[k]).filter(Boolean),p=its.filter(i=>i.type=='pose'),c=its.filter(i=>i.type=='costume'),r=its.filter(i=>i.type=='portrait');
 if(lang=='en')return['masterpiece, best quality, 1girl',...r.map(i=>i.en.replace(/, consistent facial features, face reference$/,'')),...c.map(i=>i.en.replace(/^\w+ outfit, /,'')),...p.map(i=>prompt(i,'en'))].join(', ');
 return['杰作，最佳画质，一位女性',...r.map(i=>'人物：'+i.len+(i.st?'，'+i.st:'')),...c.map(i=>i.zh.replace(/。$/,'')),...p.map(i=>'摆出「'+prompt(i,'zh')+'」的姿势')].join('；')+'。'}
function tray(added){const n=st.sel.length;if(st.tab=='studio'){$('#tray').hidden=true;document.body.classList.remove('tray');return}$('#tray').hidden=!n;document.body.classList.toggle('tray',n>0);if(!n)return;if(added&&innerWidth>760)$('#tray').classList.remove('min');if(added&&innerWidth<=760&&n==1){$('#tray').classList.add('min');$('#trayMin').textContent='展开'}
 const p=st.sel.filter(k=>k[0]=='p').length,rr=st.sel.filter(k=>k[0]=='r').length;$('#trayN').textContent=[p&&`${p} 个姿势`,n-p-rr&&`${n-p-rr} 套服装`,rr&&`${rr} 个人像`].filter(Boolean).join(' · ');
 $$('[data-tl]').forEach(b=>b.classList.toggle('on',b.dataset.tl==st.tl));
 $('#trayItems').innerHTML=st.sel.map(k=>ITEMS[k]?`<div><img src="${thumb(ITEMS[k])}" alt="${esc(title(ITEMS[k]))}"><em>${TL(ITEMS[k])}</em><b data-k="${k}" title="移除" role="button" aria-label="移除">×</b></div>`:'').join('');$('#trayText').textContent=combo(st.tl)}
$('#trayItems').onclick=e=>{const k=e.target.dataset.k;k&&toggleSel(k)};$('#trayCopyEn').onclick=()=>copy(combo('en'),'组合英文提示词');$('#trayCopyZh').onclick=()=>copy(combo('zh'),'组合中文描述');
$$('[data-tl]').forEach(b=>b.onclick=()=>{st.tl=b.dataset.tl;SV('tl',st.tl);tray()});
$('#trayMin').onclick=()=>{const m=$('#tray').classList.toggle('min');$('#trayMin').textContent=m?'展开':'收起'};
$('#trayClear').onclick=()=>{const s=st.sel;st.sel=[];SV('sel',[]);s.forEach(refreshCard);tray();toast('已清空组合')};
grid.onclick=e=>{const a=e.target.closest('[data-a]');if(!a)return;const c=e.target.closest('.card'),k=c.dataset.k,it=ITEMS[k];e.stopPropagation();
 const ph=c.querySelector('.ph');if(a.dataset.a=='open'&&ph.classList.contains('err')){const im=ph.querySelector('img');ph.classList.remove('err','done');im.src=thumb(it)+'?r='+Date.now();return}
  ({open:()=>lbOpen(st.list.indexOf(it),c),fav:()=>toggleFav(k),unrec:()=>unRec(k),delf:()=>delFace(it),sel:()=>toggleSel(k),cpen:()=>copy(prompt(it,'en'),'英文提示词'),cpzh:()=>copy(prompt(it,'zh'),'中文描述'),try:()=>window.WB&&WB.pick(it),ang:()=>setAng(it,+a.dataset.i)})[a.dataset.a]()};
function viewT(fn){if(document.startViewTransition&&!RM){try{const v=document.startViewTransition(fn);v.ready.catch(()=>{});v.finished.catch(()=>{});return v.updateCallbackDone.catch(()=>{})}catch(e){}}fn();grid.classList.add('fade');requestAnimationFrame(()=>requestAnimationFrame(()=>grid.classList.remove('fade')));return Promise.resolve()}
function drawer(o){$('#filters').classList.toggle('open',o);$('#fBtn').classList.toggle('on',o)}
$('#fBtn').onclick=()=>drawer(!$('#filters').classList.contains('open'));$('#drawerBg').onclick=()=>drawer(false);
$('#filters').onclick=e=>{if(e.target.closest('[data-done]'))return drawer(false);const b=e.target.closest('.chip');if(!b)return;st.f[b.dataset.k]=b.dataset.v;viewT(()=>{drawFilters();apply()})};
$('#active').onclick=e=>{const b=e.target.closest('button');if(b){st.f[b.dataset.k]='';viewT(()=>{drawFilters();apply()})}};
const clearAll=()=>{st.f={};st.q='';$('#q').value='';$('#qx').hidden=true;viewT(()=>{drawFilters();apply()})};$('#reset').onclick=clearAll;$('#clearAll').onclick=clearAll;
$('#sugg').onclick=e=>{const s=e.target.closest('[data-s]');if(s){st.f={};$('#q').value=st.q=s.dataset.s;$('#qx').hidden=false;drawFilters();apply()}};
$('#sort').onchange=e=>{st.sort=e.target.value;viewT(apply)};
let qt;$('#q').oninput=e=>{$('#qx').hidden=!e.target.value;clearTimeout(qt);qt=setTimeout(()=>{st.q=e.target.value;apply()},160)};$('#qx').onclick=()=>{$('#q').value='';st.q='';$('#qx').hidden=true;apply();$('#q').focus()};
function randPick(){if(!st.list.length)return toast('当前没有可选的内容');const i=Math.random()*st.list.length|0;lbOpen(i);0}
$('#rand').onclick=randPick;
// 语言
function setLang(l,quiet){st.lang=l;SV('lang',l);document.documentElement.dataset.lang=l;$$('button[data-lang]').forEach(b=>b.classList.toggle('on',b.dataset.lang==l));grid.querySelectorAll('.card').forEach(c=>{const it=ITEMS[c.dataset.k];if(it)c.querySelector('.sub').textContent=subtitle(it)});if(!quiet)toast(l=='zh'?'描述语言：中文':'描述语言：英文提示词')}
$$('button[data-lang]').forEach(b=>b.onclick=()=>setLang(b.dataset.lang));
// 标签页
function moveInd(){const b=$('.tabs button.on'),ind=$('.ind');if(!b)return;ind.style.width=b.offsetWidth+'px';ind.style.transform=`translateX(${b.offsetLeft}px)`}
async function setTab(t,openId){$('#porNote').hidden=t!='portrait';$('#addFace').hidden=$('#faceExp').hidden=$('#faceImp').hidden=t!='portrait';if(t=='studio'){st.tab=t;$('#addFace').hidden=$('#faceExp').hidden=$('#faceImp').hidden=true;$$('.tabs button').forEach(b=>{b.classList.toggle('on',b.dataset.tab==t);b.setAttribute('aria-selected',b.dataset.tab==t)});moveInd();document.title='试穿 · 衣姿 PoseWear';history.replaceState(null,'','#studio');document.body.classList.add('studio');$('#studio').hidden=false;$('#tray').hidden=true;scrollTo({top:0});window.WB&&WB.show();return}
 if(document.body.classList.contains('studio')){document.body.classList.remove('studio');$('#studio').hidden=true;tray()}
 const changed=st.tab!=t;st.tab=t;if(changed)grid.classList.add('gbusy');st.f={};st.q='';$('#q').value='';$('#qx').hidden=true;
 $$('.tabs button').forEach(b=>{b.classList.toggle('on',b.dataset.tab==t);b.setAttribute('aria-selected',b.dataset.tab==t)});moveInd();
 document.title=TNAME[t]+' · 衣姿 PoseWear';if(!openId)history.replaceState(null,'','#'+t);
 $('#rand').hidden=t=='fav'||t=='recent';$('#favTools').hidden=t!='fav';$('#clrRec').hidden=t!='recent';$('#sort').hidden=t=='recent';$('#porNote').hidden=t!='portrait';$('#sort option[value=rank]').hidden=t!='portrait';if(t!='portrait'&&st.sort=='rank'){st.sort='def';$('#sort').value='def'}
 document.body.classList.toggle('compact',t=='fav'||t=='recent');
 if((!DATA[t]&&!(t=='pose'&&grid.querySelector('.ssr')))||t=='fav'||t=='recent'){grid.innerHTML='<div class="skel"></div>'.repeat(10);$('#empty').hidden=true}
 try{if(t=='fav')await needKeys([...st.fav]);else if(t=='recent')await needKeys(st.rec);else await load(t)}catch(e){grid.innerHTML='';$('#empty').hidden=false;$('#emptyT').textContent='数据加载失败';$('#emptyP').textContent='请检查网络后刷新页面重试';$('#sugg').innerHTML='';$('#reset').hidden=true;$('#empty .emo').innerHTML=EI.q;delete LOAD[t];grid.classList.remove('gbusy');$('#emptyGo').innerHTML='<button class="sm pri" id="retry">重新加载</button>';$('#retry').onclick=()=>{st.tab='';setTab(t)};return}
 if(st.tab!=t)return;if(Q0){st.q=Q0;$('#q').value=Q0;$('#qx').hidden=false;Q0=''}const go=()=>{drawFilters();apply()};if(changed)await viewT(go);else go();grid.classList.remove('gbusy');
 if(openId)openById(openId)
 else if(changed&&scrollY>$('#bar').offsetTop)scrollTo({top:$('#hero').offsetHeight&&t!='fav'&&t!='recent'?$('#bar').offsetTop-60:0})}
$('.tabs').onclick=e=>{const b=e.target.closest('button');if(!b)return;const t=b.dataset.tab;if(t==st.tab&&!document.body.classList.contains('studio')){scrollTo({top:0,behavior:RM?'auto':'smooth'});return}if(location.hash!='#'+t)history.pushState(null,'','#'+t);setTab(t)};addEventListener('resize',()=>{moveInd();hdr()});
function theme(){const go=()=>{const t=document.documentElement.dataset.theme=document.documentElement.dataset.theme=='dark'?'light':'dark';SV('theme',t);localStorage.theme=t;$('meta[name=theme-color]').content=t=='dark'?'#111111':'#ffffff'};if(document.startViewTransition&&!RM){const v=document.startViewTransition(go);v.ready.catch(()=>{});v.finished.catch(()=>{})}else go()}
$('#theme').onclick=theme;$('#help').onclick=()=>$('#helpBox').hidden=false;$('#helpBox').onclick=e=>{if(e.target.id=='helpBox'||e.target.dataset.close!=null)$('#helpBox').hidden=true};
// 滚动
const hdr=()=>document.documentElement.style.setProperty('--hdr',$('#top').offsetHeight+'px');$('#top').addEventListener('transitionend',hdr);
let sc=false;addEventListener('scroll',()=>{const s=scrollY>24;if(s!=sc){sc=s;document.body.classList.toggle('scrolled',s);setTimeout(hdr,420)}$('#toTop').classList.toggle('on',scrollY>900)},{passive:true});
$('#toTop').onclick=()=>scrollTo({top:0,behavior:RM?'auto':'smooth'});
// 收藏导入导出 / 最近
$('#exp').onclick=()=>{if(!st.fav.size)return toast('还没有收藏可导出');const items=[...st.fav].map(k=>ITEMS[k]).filter(Boolean).map(it=>({类型:TL(it),编号:it.id,名称:title(it),中文:prompt(it,'zh'),英文:prompt(it,'en'),key:it.k}));
 const b=new Blob([JSON.stringify({app:'衣姿 PoseWear',导出时间:new Date().toLocaleString('zh-CN'),收藏:items},null,2)],{type:'application/json'}),a=document.createElement('a');a.href=URL.createObjectURL(b);a.download='衣姿-收藏-'+new Date().toISOString().slice(0,10)+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),2000);toast('已导出 '+items.length+' 条收藏')};
$('#imp').onclick=()=>$('#impF').click();$('#impF').onchange=async e=>{try{const j=JSON.parse(await e.target.files[0].text());const ks=(j.收藏||[]).map(x=>x.key).filter(k=>/^[pcr]:/.test(k));await needKeys(ks);let n=0;ks.forEach(k=>{if(ITEMS[k]&&!st.fav.has(k)){st.fav.add(k);n++}});SV('fav',[...st.fav]);counts();setTab('fav');toast('已导入 '+n+' 条收藏')}catch(err){toast('导入失败：文件格式不正确')}e.target.value=''};
$('#clrRec').onclick=()=>{if(!st.rec.length)return;const old=st.rec.slice();st.rec=[];SV('rec',[]);counts();viewT(apply);toast(`已清空 ${old.length} 条记录`,()=>{st.rec=old;SV('rec',old);counts();viewT(apply)})};
$('#addFace').onclick=()=>$('#faceF').click();$('#faceF').onchange=e=>{addFaceFiles(e.target.files);e.target.value=''};
// 面孔包导出 / 导入（图片 + 名称 + 中英描述，跨设备迁移）
$('#faceExp').onclick=async()=>{if(!FACES.length)return toast('还没有自定义面孔可导出');
 const faces=[];for(const rec of FACES){const img=await new Promise(r=>{const fr=new FileReader();fr.onload=()=>r(fr.result);fr.readAsDataURL(rec.blob)});faces.push({name:rec.name,zh:rec.zh,en:rec.en,w:rec.w,h:rec.h,img})}
 const b=new Blob([JSON.stringify({app:'衣姿 PoseWear',type:'face-pack',exported:new Date().toLocaleString('zh-CN'),count:faces.length,faces},null,1)],{type:'application/json'});
 const a=document.createElement('a');a.href=URL.createObjectURL(b);a.download='衣姿-面孔包-'+new Date().toISOString().slice(0,10)+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),3000);toast(`已导出 ${faces.length} 个面孔`)};
$('#faceImp').onclick=()=>$('#faceImpF').click();
$('#faceImpF').onchange=async e=>{const f=e.target.files[0];e.target.value='';try{
 const j=JSON.parse(await f.text());if(j.type!='face-pack'||!Array.isArray(j.faces))throw 0;
 let n=0;for(const x of j.faces){const blob=await (await fetch(x.img)).blob();
  faceN++;SV('faceN',faceN);
  const rec={id:'u'+Date.now().toString(36)+faceN,name:x.name||('我的面孔 '+faceN),zh:x.zh||'',en:x.en||'',blob,w:x.w||1080,h:x.h||1350};
  await ftx('readwrite',s=>s.put(rec));FACES.push(rec);
  if(DATA.portrait){const it=faceItem(rec);ITEMS[it.k]=it;DATA.portrait.unshift(it)}n++}
 if(n){counts();if(st.tab=='portrait')viewT(apply);toast(`已导入 ${n} 个面孔`)}else toast('面孔包为空');
 }catch(err){toast('导入失败：文件格式不正确')}};
// 裁切器交互
$('#fcCover').onclick=()=>{fcMode='cover';$('#fcZoom').value=1;fcOX=0;fcOY=0;fcDraw()};
$('#fcContain').onclick=()=>{fcMode='contain';$('#fcZoom').value=1;fcOX=0;fcOY=0;fcDraw()};
$('#fcZoom').oninput=()=>{fcClamp();fcDraw()};
$('#fcOk').onclick=async()=>{if(!fcImg)return;const c=$('#fcCv');
 try{if($('#fcBg').checked)fcKeyBg(c)}catch(e){}
 const blob=await new Promise(r=>c.toBlob(r,'image/jpeg',.92));if(!blob)return toast('裁切失败，请重试');
 try{await fcSave(blob,1080,1350,fcDescText(),$('#fcName').value)}catch(e){return toast('保存失败，请重试')}fcDone()};
// 统一背景：采样四角背景色做去底，换成与人像库一致的浅色棚拍背景（竖向微渐变）；背景不均匀则跳过
function fcKeyBg(cv){const W=cv.width,H=cv.height,x=cv.getContext('2d');
 const im=x.getImageData(0,0,W,H),d=im.data,B=24,cs=[[0,0],[W-B,0],[0,H-B],[W-B,H-B]];
 let r=0,g=0,b=0,n=0,va=0;const px=[];
 for(const[cx,cy] of cs)for(let y=cy;y<cy+B;y++)for(let xx=cx;xx<cx+B;xx++)px.push((y*W+xx)*4);
 for(const i of px){r+=d[i];g+=d[i+1];b+=d[i+2];n++}
 r/=n;g/=n;b/=n;
 for(const i of px)va+=Math.abs(d[i]-r)+Math.abs(d[i+1]-g)+Math.abs(d[i+2]-b);
 va/=n;const th=Math.max(40,Math.min(105,va*2.4));
 // 四角颜色彼此差异过大说明背景不均匀，放弃处理
 for(let a=0;a<px.length;a++)for(let c2=a+1;c2<px.length;c2++){const i=px[a],j=px[c2];if(Math.abs(d[i]-d[j])+Math.abs(d[i+1]-d[j+1])+Math.abs(d[i+2]-d[j+2])>110)return}
 for(let y=0;y<H;y++){const t=y/H,bgc=[244-t*18,246-t*16,242-t*14];
  for(let xx=0;xx<W;xx++){const i=(y*W+xx)*4;
   const dist=Math.abs(d[i]-r)+Math.abs(d[i+1]-g)+Math.abs(d[i+2]-b);
   let a;if(dist<=th)a=0;else if(dist>=th*1.9)a=1;else a=(dist-th)/(th*0.9);
   const k=a*a*(3-2*a);
   d[i]=Math.round(d[i]*k+bgc[0]*(1-k));d[i+1]=Math.round(d[i+1]*k+bgc[1]*(1-k));d[i+2]=Math.round(d[i+2]*k+bgc[2]*(1-k));d[i+3]=255}}
 x.putImageData(im,0,0)}
$('#fcSkip').onclick=async()=>{const f=fcQ[0];if(!f)return;try{
  const img=await new Promise((r,j)=>{const i=new Image();i.onload=()=>r(i);i.onerror=j;i.src=URL.createObjectURL(f)});
  const c=document.createElement('canvas'),s=Math.min(1,1080/Math.max(img.naturalWidth,img.naturalHeight));c.width=Math.round(img.naturalWidth*s/2)*2;c.height=Math.round(img.naturalHeight*s/2)*2;c.getContext('2d').drawImage(img,0,0,c.width,c.height);
  const blob=await new Promise(r=>c.toBlob(r,'image/jpeg',.92));await fcSave(blob,c.width,c.height,fcDescText(),$('#fcName').value)}catch(e){toast('这张图片读取失败')}
  fcDone()};
$('#fcX').onclick=fcClose;$('#fc').onclick=e=>{if(e.target.id=='fc')fcClose()};
{const cv=$('#fcCv');let dg=null;
 cv.addEventListener('pointerdown',e=>{dg={x:e.clientX,y:e.clientY};cv.setPointerCapture(e.pointerId)});
 cv.addEventListener('pointermove',e=>{if(!dg||!fcImg)return;const k=1080/cv.getBoundingClientRect().width;fcOX+=(e.clientX-dg.x)*k;fcOY+=(e.clientY-dg.y)*k;dg={x:e.clientX,y:e.clientY};fcClamp();fcDraw()});
 cv.addEventListener('pointerup',()=>dg=null);cv.addEventListener('pointercancel',()=>dg=null);
 cv.addEventListener('wheel',e=>{e.preventDefault();const z=$('#fcZoom');z.value=Math.max(1,Math.min(3,+z.value*(e.deltaY<0?1.1:0.9)));fcClamp();fcDraw()},{passive:false})}
$('#clrFav').onclick=()=>{if(!st.fav.size)return toast('还没有收藏');const old=[...st.fav];st.fav=new Set();SV('fav',[]);counts();viewT(apply);toast(`已清空 ${old.length} 条收藏`,()=>{st.fav=new Set(old);SV('fav',old);counts();viewT(apply)})};
document.addEventListener('click',e=>{const b=e.target.closest('[data-go]');if(b){history.pushState(null,'','#'+b.dataset.go);setTab(b.dataset.go)}});
$('#introX').onclick=()=>{localStorage.introX=1;const el=$('#intro');RM?document.documentElement.classList.add('nointro'):el.animate([{opacity:1,height:el.offsetHeight+'px'},{opacity:0,height:0,paddingTop:0,paddingBottom:0,marginBottom:0}],{duration:220,easing:'cubic-bezier(.2,.7,.2,1)'}).finished.then(()=>document.documentElement.classList.add('nointro'))};
addEventListener('offline',()=>toast('网络已断开，看过的图片还能继续浏览'));addEventListener('online',()=>toast('网络已恢复'));
function addRec(k){st.rec=[k,...st.rec.filter(x=>x!=k)].slice(0,100);st.recT[k]=Date.now();const r={};st.rec.forEach(x=>st.recT[x]&&(r[x]=st.recT[x]));st.recT=r;SV('rec',st.rec);SV('recT',r);counts()}
addEventListener('storage',e=>{if(!['fav','rec','recT','adult','sel'].includes(e.key))return;st.fav=new Set(LS('fav')||[]);st.rec=LS('rec')||[];st.recT=LS('recT')||{};st.sel=LS('sel')||[];if(e.key=='adult'&&st.adult!=(LS('adult')===true))ageSet(LS('adult')===true);counts();needKeys([...st.fav,...st.rec,...st.sel]).then(()=>{tray();if((st.tab=='fav'||st.tab=='recent')&&$('#lb').hidden)apply()}).catch(()=>{})});
// 大图
let li=0,srcCard=null;const pre=new Map();function preload(src){if(pre.has(src))return pre.get(src);const p=new Promise(r=>{const i=new Image();i.onload=()=>r(src);i.onerror=()=>r(null);i.src=src});pre.set(src,p);if(pre.size>80)pre.delete(pre.keys().next().value);return p}
function rectAnim(el,from,rev){const to=el.getBoundingClientRect();if(!from||!to.width)return el.animate([{opacity:0,transform:'scale(.94)'},{opacity:1,transform:'none'}],{duration:rev?220:380,easing:'cubic-bezier(.16,1,.3,1)',direction:rev?'reverse':'normal',fill:'both'});
 const dx=from.left+from.width/2-(to.left+to.width/2),dy=from.top+from.height/2-(to.top+to.height/2),s=Math.max(from.width/to.width,.08);
 return el.animate([{transform:`translate(${dx}px,${dy}px) scale(${s})`,opacity:.2,borderRadius:'40px'},{transform:'none',opacity:1,borderRadius:'20px'}],{duration:rev?320:520,easing:rev?'cubic-bezier(.4,0,.2,1)':'cubic-bezier(.16,1,.3,1)',direction:rev?'reverse':'normal',fill:'both'})}
let lbPushed=false;const pend=new Set();function lbOpen(i,c){if(i<0||!st.list[i])return;li=i;{const it=st.list[i],h='#'+it.type+'/'+it.id;if(location.hash!=h&&!location.hash.includes('/')){history.pushState(null,'',h);lbPushed=true}}srcCard=c||null;const lb=$('#lb');lb.hidden=false;document.body.style.overflow='hidden';lbDraw();
 if(!RM){$('.lb-bg').animate([{opacity:0},{opacity:1}],{duration:300});rectAnim($('.lb-box'),c&&c.querySelector('.ph').getBoundingClientRect())}setTimeout(()=>$('.lb-x').focus({preventScroll:true}),60)}
let closing=false;function lbClose(){if($('#lb').hidden||closing)return;if(lbPushed){lbPushed=false;history.back()}const it=st.list[li],c=it&&grid.querySelector(`.card[data-k="${CSS.escape(it.k)}"]`),r=c&&c.querySelector('.ph').getBoundingClientRect();
 const vis=r&&r.bottom>0&&r.top<innerHeight;const done=()=>{closing=false;$('#lb').hidden=true;document.body.style.overflow='';$('.lb-box').getAnimations().forEach(a=>a.cancel());if(location.hash.includes('/'))history.replaceState(null,'','#'+st.tab);c&&c.querySelector('.phk').focus({preventScroll:true});if(st.tab=='fav'){pend.forEach(k=>!st.fav.has(k)&&dropCard(k))}pend.clear()};
 if(RM)return done();closing=true;$('.lb-bg').animate([{opacity:1},{opacity:0}],{duration:220,fill:'both'}).finished.then(a=>a.cancel());rectAnim($('.lb-box'),vis?r:null,true).finished.then(done)}
function lbDraw(){const it=st.list[li];if(!it)return;const img=$('#lbImg'),box=$('.lb-img'),src=big(it);addRec(it.k);
 history.replaceState(null,'','#'+it.type+'/'+it.id);
 if(img.dataset.src!=src){img.dataset.src=src;img.removeAttribute('srcset');img.src=thumb(it);img.classList.add('lo');box.classList.add('loading');preload(src).then(s=>{if(img.dataset.src==src){if(s){img.src=s;if(it.type=='costume'){img.sizes='(max-width:760px) 100vw, 60vw';img.srcset=`${it.m} 1080w, ${it.i} 1366w`}}img.classList.remove('lo');box.classList.remove('loading')}})}
 [1,-1,2].forEach(d=>{const n=st.list[(li+d+st.list.length)%st.list.length];n&&preload(big(n))});if(it.type=='pose')it.angles.forEach(a=>preload(a.i));
 const P=it.type=='pose',isF=st.fav.has(it.k),isS=st.sel.includes(it.k);img.alt=title(it);
 const zh=`<div class="pbox"><small>中文描述</small><p>${esc(prompt(it,'zh'))}</p><button class="sm pri" data-c="zh">复制中文</button></div>`,en=`<div class="pbox en"><small>英文提示词 · PROMPT</small><p>${esc(prompt(it,'en'))}</p><button class="sm" data-c="en">复制英文</button></div>`;
 $('#lbSide').innerHTML=`<div class="mu">${TNAME[['fav','recent'].includes(st.tab)?st.tab:it.type]} · 第 ${li+1} / ${st.list.length} 项</div><h2>${esc(title(it))}</h2><div class="mu">${esc(P?it.line+' · '+it.cat+' · 编号 '+it.no:it.type=='portrait'?it.sec+' · '+it.len+' · 编号 '+it.no+(it.rk?' · 人气第 '+it.rk+' 名':''):it.cat+' · 编号 '+it.id)}</div>
 ${P?`<div class="jp">日文原名：${esc(it.ja)}</div><div class="angsel" role="group" aria-label="拍摄角度">${it.angles.map((a,i)=>`<button class="chip ${i==it.ai?'on':''}" data-ai="${i}">${a.zh}</button>`).join('')}</div>`:''}
 ${st.lang=='en'?en+zh:zh+en}${P?'':it.type=='portrait'?it.u?`<div class="jp">自定义面孔　<button class="sm" data-x="ren">✎ 重命名</button>　<button class="sm" data-x="edes">✎ 编辑描述</button></div><div id="lbEd" hidden><label class="fld">名称<input id="edName" value="${esc(it.ti)}" spellcheck="false"></label><label class="fld">中文描述<textarea id="edZh" rows="3" spellcheck="false">${esc(it.zh)}</textarea></label><label class="fld">英文提示词<textarea id="edEn" rows="3" spellcheck="false">${esc(it.en)}</textarea></label><div class="row"><button class="sm pri" data-x="edsave">保存修改</button><button class="sm ghost" data-x="edcancel">取消</button></div></div>`:`<div class="jp">日文原名：${esc(it.ja)}　·　CC0 1.0，AI 生成的虚构人物，请勿用于冒充真人</div>`:`<div class="jp">原始关键词：${esc(it.kw)}</div>`}
 <div class="mact"><button data-x="fav" class="${isF?'on':''}" aria-label="${isF?'取消收藏':'收藏'}">${isF?'♥':'♡'}</button><button data-x="share">分享</button><button data-x="try" class="pri">${P?'用作姿势参考':it.type=='portrait'?'用作人物参考':'试穿这套'}</button></div> <div class="acts"><button data-x="fav">${isF?'♥ 已收藏':'♡ 收藏'}</button><button data-x="sel" class="${isS?'':'pri'}">${isS?'✓ 已在组合中':'＋ 加入组合'}</button><button data-x="try">${P?'用作姿势参考':it.type=='portrait'?'用作人物参考':'试穿这套'}</button><button data-x="share">分享链接</button><button data-x="dlx">下载图片</button><button data-x="cpimg">复制图片</button><a href="${orig(it)}" download="posewear-${it.type}-${it.id}${P?'-'+it.ai:''}.png" class="dl"><button tabindex="-1">下载原图 PNG</button></a>${P||it.type=='portrait'?'':`<a href="https://s.taobao.com/search?q=${encodeURIComponent([...val(it,'col').slice(0,1),...val(it,'item').slice(0,2)].join(' ')||'女装 '+it.cat)}" target="_blank" rel="noopener" class="dl"><button tabindex="-1">淘宝搜同款 ↗</button></a>`}</div>
<div id="lbSim"></div><p class="mu" style="margin-top:22px;line-height:2.1"><kbd>←</kbd><kbd>→</kbd>切换　${P?'<kbd>↑</kbd><kbd>↓</kbd>角度　':''}<kbd>F</kbd>收藏　<kbd>A</kbd>组合　<kbd>C</kbd>复制　<kbd>S</kbd>分享</p>`;window.X&&X.lb(it)}
const share=()=>copy(location.href,'分享链接');
$('#lbSide').onclick=e=>{const it=st.list[li],t=e.target.closest('button');if(!t)return;if(t.dataset.ai){setAng(it,+t.dataset.ai);lbDraw()}if(t.dataset.c)copy(prompt(it,t.dataset.c),t.dataset.c=='en'?'英文提示词':'中文描述');
 if(t.dataset.x=='ren'||t.dataset.x=='edes'){const ed=$('#lbEd');if(ed){ed.hidden=false;const nm=$('#edName');nm&&nm.focus()}}
 if(t.dataset.x=='edsave'){const nn=$('#edName').value.trim(),zz=$('#edZh').value.trim(),ee=$('#edEn').value.trim();
  if(!nn)return toast('名称不能为空');it.ti=nn;it.zh=zz;it.en=ee;const rec=FACES.find(r=>r.id==it.id);
  if(rec){rec.name=nn;rec.zh=zz;rec.en=ee;ftx('readwrite',s=>s.put(rec)).catch(()=>{})}
  refreshCard(it.k);lbDraw();toast('已保存修改')}
 if(t.dataset.x=='fav')toggleFav(it.k);if(t.dataset.x=='sel')toggleSel(it.k);if(t.dataset.x=='share')share();if(t.dataset.x=='try'){lbClose();window.WB&&WB.pick(it)}};
const step=d=>{li=(li+d+st.list.length)%st.list.length;lbDraw();if(!RM)$('#lbImg').animate([{opacity:.3,transform:`translateX(${d*30}px)`},{opacity:1,transform:'none'}],{duration:320,easing:'cubic-bezier(.16,1,.3,1)'})};
$('.lb-bg').onclick=lbClose;$('.lb-x').onclick=lbClose;$('.prev').onclick=()=>step(-1);$('.next').onclick=()=>step(1);
addEventListener('keydown',e=>{if(e.ctrlKey||e.metaKey||e.altKey)return;const ae=document.activeElement,inp=ae&&/^(INPUT|SELECT|TEXTAREA)$/.test(ae.tagName);
 if(e.key=='Escape'){if(!$('#fc').hidden)return fcClose();if(!$('#ageBox').hidden)return $('#ageBox').hidden=true;if(!$('#privBox').hidden)return $('#privBox').hidden=true;if(!$('#helpBox').hidden)return $('#helpBox').hidden=true;if(!$('#lb').hidden)return lbClose();drawer(false);if(inp)ae.blur();return}if(inp)return;
 if(e.key=='?'){$('#helpBox').hidden=!$('#helpBox').hidden;return}const k=e.key.toLowerCase();
 if($('#lb').hidden){if(e.key=='/'){e.preventDefault();$('#q').focus()}else if(k=='r'&&st.tab!='studio'&&!$('#rand').hidden)randPick();else if(k=='t')theme();else if(k=='l')setLang(st.lang=='zh'?'en':'zh');else if('123456'.includes(e.key))setTab(TABS[e.key-1]);return}
 const it=st.list[li];if(e.key=='ArrowLeft')step(-1);else if(e.key=='ArrowRight')step(1);
 else if(/Arrow(Up|Down)/.test(e.key)&&it.angles){e.preventDefault();setAng(it,(it.ai+(e.key=='ArrowUp'?-1:1)+it.angles.length)%it.angles.length);lbDraw()}
 else if(k=='f')toggleFav(it.k);else if(k=='a')toggleSel(it.k);else if(k=='c')copy(prompt(it,'zh'),'中文描述');else if(k=='s')share();
 else if(e.key=='Tab'){const f=[...$('#lb').querySelectorAll('button,a[href]')].filter(x=>x.offsetParent);if(!f.length)return;const a=f[0],z=f[f.length-1];if(e.shiftKey&&ae==a){e.preventDefault();z.focus()}else if(!e.shiftKey&&ae==z){e.preventDefault();a.focus()}}});
let tx,ty;$('.lb-img').addEventListener('touchstart',e=>{tx=e.touches[0].clientX;ty=e.touches[0].clientY},{passive:true});$('.lb-img').addEventListener('touchend',e=>{const d=e.changedTouches[0].clientX-tx,dy=e.changedTouches[0].clientY-ty;if(Math.abs(d)>50&&Math.abs(d)>Math.abs(dy))step(d<0?1:-1);else if(dy>90)lbClose()});
// 数字滚动
function countUp(){$$('.stats b').forEach(b=>{const n=+(st.adult&&b.dataset.na||b.dataset.n);if(RM||b.textContent.trim()!='0'){b.textContent=n.toLocaleString('zh-CN');return}const t0=performance.now();const f=t=>{const p=Math.min((t-t0)/1400,1);b.textContent=Math.round(n*(1-Math.pow(1-p,4))).toLocaleString('zh-CN');p<1&&requestAnimationFrame(f)};requestAnimationFrame(f)})}
// 路由
function openById(id){let i=st.list.findIndex(x=>x.id==id);if(i>=0)return lbOpen(i);const it=(DATA[st.tab]||[]).find(x=>x.id==id);if(!it)return toast('未找到该条目');
 if(!ok(it))return ageAsk(()=>openById(id));st.f={};st.q='';$('#q').value='';drawFilters();apply();i=st.list.findIndex(x=>x.id==id);if(i>=0)lbOpen(i)}
function route(){const [t,id]=location.hash.slice(1).split('/');const tab=TABS.includes(t)?t:'pose';if(!id&&tab==st.tab&&st.list.length)return;if(tab!=st.tab||!st.list.length||!id)setTab(tab,id&&decodeURIComponent(id));else openById(decodeURIComponent(id))}
// 成人内容开关
function ageSet(on,anim){st.adult=on;SV('adult',on);if(on)SV('ageOk',true);document.body.classList.toggle('adult',on);$('#adultSw').setAttribute('aria-checked',on);$('#adultSw').title=on?'成人向内容已显示，点击关闭':'成人向内容已隐藏，点击打开';counts();countUp();if(st.tab&&st.tab!='studio'&&st.tab!=''){const f=()=>{drawFilters();apply()};anim?viewT(f):f()}window.WB&&WB.show&&st.tab=='studio'&&WB.show()}
let ageCb=null;function ageAsk(cb){ageCb=cb||null;const seen=LS('ageOk');$('#ageT').textContent=cb?'这是成人向内容':'显示成人向内容？';$('#ageP').textContent=(cb?'要查看它，需要打开顶部的「18+」开关。':'包括双人互动、性感类姿势，以及内衣、性感类服装。')+(seen?'打开后随时可以再关上。':'仅适合已满 18 岁的用户。只需确认一次，之后用顶部开关随时打开或关闭。');$('#ageY').textContent=seen?'打开 18+ 开关':'我已满 18 岁，打开';$('#ageBox').hidden=false;setTimeout(()=>$('#ageY').focus(),30)}
$('#adultSw').onclick=()=>{if(st.adult){ageSet(false,1);toast('已关闭成人向内容')}else if(LS('ageOk')){ageSet(true,1);toast('已显示成人向内容')}else ageAsk()};
$('#ageY').onclick=()=>{$('#ageBox').hidden=true;ageSet(true,!ageCb);toast('已显示成人向内容，可用顶部开关关闭');const c=ageCb;ageCb=null;c&&c()};
$('#ageN').onclick=$('#ageBox').onclick=e=>{if(e.target.id!='ageN'&&e.target.id!='ageBox')return;$('#ageBox').hidden=true;ageCb=null};
document.addEventListener('click',e=>{const b=e.target.closest('[data-age]');if(!b)return;st.adult?(ageSet(false),toast('已隐藏成人内容')):ageAsk()});
$('#privO').onclick=e=>{e.preventDefault();$('#privBox').hidden=false};$('#privBox').onclick=e=>{if(e.target.id=='privBox'||e.target.dataset.close!=null)$('#privBox').hidden=true};
addEventListener('hashchange',()=>{const id=location.hash.split('/')[1];if(!$('#lb').hidden){if(id)return;lbPushed=false;lbClose();setTimeout(route,closing?280:0);return}route()});
if(innerWidth<=760)$('#q').placeholder='搜索';setLang(st.lang,true);ageSet(st.adult);hdr();countUp();needKeys([...st.sel]).then(()=>tray()).catch(()=>{});(async()=>{try{FACES.push(...await ftx('readonly',s=>s.getAll()));mergeFaces()}catch(e){}})();st.tab='';if(Q0&&!location.hash)history.replaceState(null,'','?q='+encodeURIComponent(Q0)+'#'+(TABS.includes(QT)?QT:'costume'));route();
if('serviceWorker'in navigator&&location.protocol!='file:')addEventListener('load',()=>navigator.serviceWorker.register('/sw.js').catch(()=>{}));

window.APP={ok,ageAsk,toggleFav,toggleSel,lbOpen,lbClose,apply,li:()=>li,load,ITEMS,DATA,thumb,big,title,prompt,toast,esc,setTab,st,copy};
