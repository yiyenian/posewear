// moss-image 完整链路验证：gen 模式 + 人像库选脸 + 库内服装 + 姿势 → 检查 composeC 提示词与成图
const {chromium}=require('playwright');const path=require('path'),FX=path.join(__dirname,'fixtures')+'/';
const BASE=process.env.U||'http://localhost:8787',COMFY=process.env.COMFY||'http://127.0.0.1:8189';
const WF=JSON.parse(require('fs').readFileSync(path.join(__dirname,'..','posewear-moss-tryon.json'),'utf8'));
if(process.env.STEPS)WF['16'].inputs.steps=+process.env.STEPS;
(async()=>{const R=[],errs=[];const ok=(n,v,d)=>R.push((v?'PASS ':'FAIL ')+n+(d?'  ['+(d+'').slice(0,150)+']':''));
const b=await chromium.launch({args:['--disable-web-security','--disable-site-per-process']});
const c=await b.newContext({viewport:{width:1366,height:900}});const p=await c.newPage();
p.on('pageerror',e=>errs.push(''+e.message));
let sub=null;p.on('response',async r=>{if(/\/prompt$/.test(r.url())&&r.request().method()==='POST'){try{sub=await r.json()}catch(e){}}});
await p.addInitScript(v=>{localStorage.setItem('wbCfg',JSON.stringify(v.cfg));localStorage.setItem('wbMode','gen');localStorage.setItem('introX','1')},
 {cfg:{prov:'comfyui',base:COMFY,wf:JSON.stringify(WF),np:'40',ng:'41',ns:'48',nt:'4',nw:'6',nsz:'',key:'',model:'',field:'image[]',proto:'edits',proxy:false}});
await p.goto(BASE+'/#studio');await p.waitForFunction(()=>window.WB&&window.APP,null,{timeout:20000});
// 选模特（人像库第一张）、服装 SWM-0034、姿势
await p.evaluate(async()=>{await APP.load('portrait');await WB.pick(APP.DATA.portrait.find(x=>!x.a)||APP.DATA.portrait[0]);
 await APP.load('costume');const sw=Object.keys(APP.ITEMS).find(k=>APP.ITEMS[k].id=='SWM-0034');await WB.pick(APP.ITEMS[sw]);
 await APP.load('pose');const pz=Object.keys(APP.ITEMS).find(k=>/一脚向后抬起/.test(APP.ITEMS[k].zh));await WB.pick(APP.ITEMS[pz])});
await p.waitForFunction(()=>!document.querySelector('#wbGo').disabled,null,{timeout:20000});
await p.click('#wbGo');
await p.waitForFunction(()=>document.querySelector('#wbAfter').src.startsWith('blob:')||!document.querySelector('#wbErr').hidden,null,{timeout:420000});
const s=await p.evaluate(()=>({img:document.querySelector('#wbAfter').src.slice(0,5),err:document.querySelector('#wbErr').hidden?'':document.querySelector('#wbErr').innerText.replace(/\s+/g,' ').slice(0,200),hist:document.querySelectorAll('#wbHist [data-t]').length}));
ok('moss 真实生成成功',s.img=='blob:'&&!s.err&&s.hist>=1,JSON.stringify(s));
if(sub&&sub.prompt_id){
 const h=await (await fetch(`${COMFY}/history/${sub.prompt_id}`)).json();const ent=h[sub.prompt_id];
 const txt=ent.prompt[2]['4'].inputs.text;
 ok('提示词为画面描述式（无参考图字样）',!/参考图|第 ?\d+ ?张|image \d+|试穿/.test(txt.split('\n规则')[0]),txt.split('\n规则')[0].slice(0,120).replace(/\n/g,' '));
 ok('包含人物描述注入',/保持这张脸|Subject:/.test(txt),txt.slice(0,80));
 ok('包含服装与姿势描述',/服装：|Outfit:/.test(txt)&&/姿势：|Pose:/.test(txt), '');
 const ims=[];for(const o of Object.values(ent.outputs||{}))for(const i of (o.images||[]))ims.push(i);
 ok('有输出图片',ims.length>0,JSON.stringify(ims));
 await p.screenshot({path:path.join(__dirname,'screenshots','moss-final.png')});
}
console.log(R.join('\n'));console.log('errs',errs);await b.close();process.exit(R.some(x=>x.startsWith('FAIL'))?1:0)})().catch(e=>{console.error(e);process.exit(1)});
