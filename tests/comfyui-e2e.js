// PoseWear × 本地 ComfyUI 端到端验证（真实 ComfyUI，需已启动于 127.0.0.1:8188）
// 浏览器加 --disable-web-security 以绕过 CORS（本地验证用；线上使用需 ComfyUI 带 --enable-cors-header "*" 启动）。
// 用法：先 python -m http.server 8787 -d dist，再 node tests/comfyui-e2e.js
const {chromium}=require('playwright');const path=require('path'),FX=path.join(__dirname,'fixtures')+'/';
const BASE=process.env.U||'http://localhost:8787',COMFY=process.env.COMFY||'http://127.0.0.1:8188';
const CKPT=process.env.CKPT||'kromafineTurboBF16FP8_v10_fp8.safetensors';
const WF={"1":{class_type:"CheckpointLoaderSimple",inputs:{ckpt_name:CKPT}},
 "51":{class_type:"CLIPTextEncode",inputs:{text:"placeholder",clip:["1",1]}},
 "52":{class_type:"CLIPTextEncode",inputs:{text:"lowres, bad anatomy",clip:["1",1]}},
 "6":{class_type:"LoadImage",inputs:{image:"person.png"}},
 "37":{class_type:"LoadImage",inputs:{image:"garment.png"}},
 "5":{class_type:"EmptyLatentImage",inputs:{width:512,height:768,batch_size:1}},
 "3":{class_type:"KSampler",inputs:{seed:42,steps:4,cfg:1.0,sampler_name:"euler",scheduler:"simple",denoise:1.0,model:["1",0],positive:["51",0],negative:["52",0],latent_image:["5",0]}},
 "8":{class_type:"VAEDecode",inputs:{samples:["3",0],vae:["1",2]}},
 "9":{class_type:"SaveImage",inputs:{filename_prefix:"posewear-e2e",images:["8",0]}}};(async()=>{const R=[],errs=[];const ok=(n,v,d)=>R.push((v?'PASS ':'FAIL ')+n+(d?'  ['+d+']':''));
const b=await chromium.launch({args:['--disable-web-security','--disable-site-per-process']});
const c=await b.newContext({viewport:{width:1366,height:900}});const p=await c.newPage();
p.on('pageerror',e=>errs.push(''+e.message));
let promptResp=null;p.on('response',async r=>{if(/\/prompt$/.test(r.url())&&r.request().method()==='POST'){promptResp={url:r.url(),status:r.status()};try{promptResp.body=await r.json()}catch(e){}}});
const wf=JSON.parse(JSON.stringify(WF));wf['51'].inputs.text='placeholder';
await p.addInitScript(v=>{localStorage.setItem('wbCfg',JSON.stringify(v));localStorage.setItem('introX','1')},{prov:'comfyui',base:COMFY,wf:JSON.stringify(WF),np:'6',ng:'37',ns:'',nt:'51',nw:'5',nsz:'896x1600',key:'',model:'',field:'image[]',proto:'edits',proxy:false});
await p.goto(BASE+'/#studio');await p.waitForFunction(()=>window.WB&&window.APP,null,{timeout:20000});
// ① 设置面板 UI
await p.click('#wbCfg');await p.waitForSelector('#cfg:not([hidden])');
ok('设置面板出现 ComfyUI 选项',await p.isVisible('[name=prov][value=comfyui]'));
await p.check('[name=prov][value=comfyui]');
ok('选中后显示工作流配置',!(await p.$eval('#cfWfW',e=>e.hidden))&&!(await p.$eval('#cfWf',e=>e.hidden)));
ok('工作流 JSON 已回填',(await p.$eval('#cfWf',e=>e.value)).includes('CheckpointLoaderSimple'));
ok('节点编号已回填',(await p.$eval('#cfNP',e=>e.value))=='6'&&(await p.$eval('#cfNT',e=>e.value))=='51');
ok('状态灯变绿',await p.$eval('#wbDot',e=>e.classList.contains('on')));
await p.screenshot({path:path.join(__dirname,'screenshots','comfyui-cfg.png')});
await p.click('#cfgX');
// ② 选人物 + 服装
await p.setInputFiles('#wbFile',FX+'person.png');
await p.evaluate(async()=>{await APP.load('costume');const k=Object.keys(APP.ITEMS).find(k=>APP.ITEMS[k].type=='costume');await WB.pick(APP.ITEMS[k])});
await p.waitForFunction(()=>!document.querySelector('#wbGo').disabled,null,{timeout:20000});
// ③ 生成（真实 SDXL 出图，可能需要 1-2 分钟）
const t0=Date.now();
await p.click('#wbGo');
await p.waitForFunction(()=>document.querySelector('#wbAfter').src.startsWith('blob:')||!document.querySelector('#wbErr').hidden,null,{timeout:240000});
const secs=Math.round((Date.now()-t0)/1000);
const s=await p.evaluate(()=>({img:document.querySelector('#wbAfter').src.slice(0,5),err:document.querySelector('#wbErr').hidden?'':document.querySelector('#wbErr').innerText.replace(/\s+/g,' ').slice(0,300),hist:document.querySelectorAll('#wbHist [data-t]').length,prov:document.querySelector('#wbProv').textContent}));
ok(`真实生成成功（${secs}s）`,s.img=='blob:'&&!s.err&&s.hist>=1,JSON.stringify(s));
ok('服务商标记为本地 ComfyUI',/ComfyUI/.test(s.prov),s.prov);
ok('提示词经 /prompt 提交到 ComfyUI',promptResp&&promptResp.status==200&&promptResp.url.startsWith(COMFY),JSON.stringify(promptResp&&{status:promptResp.status,url:promptResp.url}));
// ④ 回显校验：读 ComfyUI history，确认站点塞进去的提示词与图片
if(promptResp&&promptResp.body&&promptResp.body.prompt_id){
 const h=await (await fetch(`${COMFY}/history/${promptResp.body.prompt_id}`)).json();
 const ent=h[promptResp.body.prompt_id];const outs=ent&&ent.outputs||{};
 const imgs=[];for(const k in outs)(outs[k].images||[]).forEach(x=>imgs.push(x));
 ok('ComfyUI 侧有输出图片',imgs.length>0,JSON.stringify(imgs));
 const txt=ent&&ent.prompt&&ent.prompt[2]&&ent.prompt[2]['51']&&ent.prompt[2]['51'].inputs.text||'';
 ok('提示词已写入工作流节点',txt.length>50,/fashion/i.test(txt),txt.slice(0,80).replace(/\n/g,' '));
 ok('提示词无分图枚举残留',!/image \d+ (shows|is)|from image \d+|换上第 ?\d+ ?张|the sketch only|线稿只用于/.test(txt),txt.slice(0,60).replace(/\n/g,' '));
 const lat=ent&&ent.prompt&&ent.prompt[2]&&ent.prompt[2]['5']&&ent.prompt[2]['5'].inputs||{};
 ok('自定义尺寸 896x1600 已写入 Latent 节点',lat.width==896&&lat.height==1600,JSON.stringify({w:lat.width,h:lat.height}));
 ok('KSampler seed 已随机化',typeof lat.seed!='number'||ent.prompt[2]['3'].inputs.seed!=42,ent.prompt[2]['3'].inputs.seed);
 const li=ent&&ent.prompt&&ent.prompt[2]&&ent.prompt[2]['6']&&ent.prompt[2]['6'].inputs.image||'';
 ok('人物参考图已上传并填入节点',/posewear-ref|\.jpg|\.png/.test(li),li);
}
await p.screenshot({path:path.join(__dirname,'screenshots','comfyui-result.png')});
console.log(R.join('\n'));console.log('errs',errs);await b.close();process.exit(R.some(x=>x.startsWith('FAIL'))?1:0)})().catch(e=>{console.error(e);process.exit(1)});
