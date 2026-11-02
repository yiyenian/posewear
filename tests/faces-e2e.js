// 「我的面孔」功能验证：添加 → 人像库出现 → 试穿可用 → 删除
const {chromium}=require('playwright');const path=require('path'),FX=path.join(__dirname,'fixtures')+'/';
const BASE=process.env.U||'http://localhost:8787';
(async()=>{const R=[],errs=[];const ok=(n,v,d)=>R.push((v?'PASS ':'FAIL ')+n+(d?'  ['+(d+'').slice(0,120)+']':''));
const b=await chromium.launch();const c=await b.newContext({viewport:{width:1366,height:900}});const p=await c.newPage();
p.on('pageerror',e=>errs.push(''+e.message));
await p.goto(BASE+'/#portrait');await p.waitForFunction(()=>window.APP&&APP.DATA&&APP.DATA.portrait&&document.querySelectorAll('#grid .card').length>3,null,{timeout:20000});
const n0=await p.evaluate(()=>APP.DATA.portrait.length);
// ① 添加面孔（裁切弹窗 → 默认铺满裁切 → 完成）
await p.click('#addFace');await p.setInputFiles('#faceF',FX+'person.png');
await p.waitForSelector('#fc:not([hidden])',{timeout:10000});
ok('裁切弹窗出现',await p.isVisible('#fcCv'));
await p.click('#fcOk');
await p.waitForFunction(()=>document.body.innerText.includes('面孔已添加'),null,{timeout:10000}).catch(()=>{});
const n1=await p.evaluate(()=>APP.DATA.portrait.length);
ok('添加面孔后人像库 +1',n1==n0+1,`before=${n0} after=${n1}`);
ok('裁切输出为 1080×1350',await p.evaluate(()=>APP.DATA.portrait[0].u==1&&APP.DATA.portrait[0].w==1080&&APP.DATA.portrait[0].h==1350));
ok('新面孔出现在网格首位',await p.evaluate(()=>APP.DATA.portrait[0].u==1&&/我的面孔/.test(APP.DATA.portrait[0].ti)));
ok('新面孔卡片渲染成功',await p.evaluate(()=>{const el=document.querySelector('#grid .card[data-k^="r:u"]');return el&&el.querySelector('img')}));
// ② 试穿工作台可用（搜索选人）
await p.evaluate(()=>{document.querySelector('[data-tab=studio]').click()});
await p.waitForFunction(()=>window.WB&&window.APP.st.tab=='studio',null,{timeout:15000});
const picked=await p.evaluate(async()=>{await APP.load('portrait');const it=APP.DATA.portrait.find(x=>x.u);if(!it)return'no-custom';await WB.pick(it);return document.querySelectorAll('#wbPersons .pp').length});
ok('试穿工作台可用自定义面孔当人物照',picked==1,picked);
// ③ 回到人像库删除
await p.evaluate(()=>{document.querySelector('[data-tab=portrait]').click()});
await p.waitForFunction(()=>APP.st.tab=='portrait'&&document.querySelector('#grid .card[data-k^="r:u"]'),null,{timeout:15000});
await p.hover('#grid .card[data-k^="r:u"]');await p.click('#grid .card[data-k^="r:u"] [data-a="delf"]');
await p.waitForFunction(()=>document.body.innerText.includes('已删除此面孔'),null,{timeout:10000}).catch(()=>{});
const n2=await p.evaluate(()=>APP.DATA.portrait.length);
ok('删除后人像库恢复原数量',n2==n0,`after=${n2} expect=${n0}`);
const idb=await p.evaluate(async()=>{const d=await new Promise((r,j)=>{const q=indexedDB.open('posewear-faces',1);q.onsuccess=()=>r(q.result);q.onerror=()=>j(q.error)});return new Promise(r=>{const t=d.transaction('f','readonly');const q=t.objectStore('f').getAll();t.oncomplete=()=>r(q.result.length);t.onerror=()=>r('err')})});
ok('IndexedDB 中已无残留',idb==0,'count='+idb);
console.log(R.join('\n'));console.log('errs',errs);await b.close();process.exit(R.some(x=>x.startsWith('FAIL'))?1:0)})().catch(e=>{console.error(e);process.exit(1)});
