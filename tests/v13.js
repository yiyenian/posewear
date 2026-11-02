const {chromium}=require('playwright');const path=require('path'),FX=path.join(__dirname,'fixtures')+'/',SS=path.join(__dirname,'screenshots')+'/';require('fs').mkdirSync(SS,{recursive:true});const fs=require('fs');
(async()=>{const U=process.env.U||'http://localhost:8787';const b=await chromium.launch({executablePath:process.env.CHROME_PATH});const R=[],errs=[];const S=SS+'v13-';
const P=[fs.readFileSync(FX+'mk1.png').toString('base64'),fs.readFileSync(FX+'mk2.png').toString('base64')];let mode='ok',cnt=0,hits=[],bodies=[];
async function setup(prov,vp,dark){const c=await b.newContext({viewport:vp||{width:1366,height:900},colorScheme:dark?'dark':'light'});const p=await c.newPage();p.on('pageerror',e=>errs.push(prov+': '+e.message));
 const handler=async(route)=>{const req=route.request();const u=req.url();if(req.method()=='OPTIONS')return route.fulfill({status:204,headers:{'access-control-allow-origin':'*','access-control-allow-headers':'*','access-control-allow-methods':'*'}});
  hits.push(prov+' '+u+' '+(req.headers()['x-target-url']||''));bodies.push(req.postData()||'');const H={'content-type':'application/json','access-control-allow-origin':'*'};const img=P[(cnt++)%2];
  if(mode.startsWith('safe')){const MS={'safe-oai':[400,{error:{message:'Your request was rejected by the safety system. If you believe this is an error, contact us at help.openai.com and include the request ID req_abc123XYZ. safety_violations=[sexual].',type:'image_generation_user_error',code:'moderation_blocked'}}],'safe-gem':[200,{candidates:[{finishReason:'IMAGE_SAFETY',content:{parts:[{text:'I cannot generate this.'}]}}],responseId:'gemResp1'}],'safe-gem2':[200,{promptFeedback:{blockReason:'PROHIBITED_CONTENT'}}],'safe-sd':[400,{error:{code:'InputImageSensitiveContentDetected',message:'The request failed because the input image may contain sensitive information. Request id: 0217abc'}}]};const [s,bd]=MS[mode];return route.fulfill({status:s,headers:H,body:JSON.stringify(bd)})}
  if(mode=='401')return route.fulfill({status:401,headers:H,body:JSON.stringify({error:{message:'Incorrect API key provided: sk-test-123'}})});
  if(mode=='429')return route.fulfill({status:429,headers:H,body:JSON.stringify({error:{message:'Rate limit reached'}})});
  if(mode=='500')return route.fulfill({status:500,headers:H,body:'{"error":{"message":"internal"}}'});
  if(mode=='hang'){await new Promise(r=>setTimeout(r,8000));return route.fulfill({status:500,headers:H,body:'{}'}).catch(()=>{})}
  if(mode=='slow')await new Promise(r=>setTimeout(r,1500));
  const body=/generateContent/.test(u+(req.headers()['x-target-url']||''))?{candidates:[{content:{parts:[{text:'ok'},{inlineData:{mimeType:'image/png',data:img}}]}}]}:{data:[{b64_json:img}]};
  return route.fulfill({status:200,headers:H,body:JSON.stringify(body)})};
 await p.route(/api\.openai\.com|generativelanguage\.googleapis\.com|ark\.cn-beijing\.volces\.com|\/api\/proxy/,handler);
 await p.addInitScript(([prov,dark])=>{if(!sessionStorage.x){sessionStorage.x=1;localStorage.setItem('wbCfg',JSON.stringify({prov,key:'sk-test-123',base:prov=='custom'?'https://relay.example.com':'',model:'',field:'image[]',proto:'json',proxy:false}));localStorage.setItem('introX','1');if(dark)localStorage.setItem('theme','dark')}window.__TMO=3000},[prov,dark]);
 await p.goto(U+'/#studio');await p.waitForFunction(()=>window.WB&&window.APP,null,{timeout:15000});
 await p.setInputFiles('#wbFile',FX+'person.png');
 await p.evaluate(async()=>{await APP.load('costume');const k=Object.keys(APP.ITEMS).find(k=>APP.ITEMS[k].type=='costume');await WB.pick(APP.ITEMS[k])});
 await p.waitForFunction(()=>!document.querySelector('#wbGo').disabled,null,{timeout:15000});return {c,p}}
const go=async(p)=>{await p.click('#wbGo');await p.waitForFunction(()=>!document.querySelector('#wbBusy')||document.querySelector('#wbBusy').hidden,null,{timeout:20000}).catch(()=>{});await p.waitForTimeout(300)};
const st=p=>p.evaluate(()=>({res:WB&&document.querySelector('#wbAfter').src.slice(0,5),err:document.querySelector('#wbErr').hidden?'':document.querySelector('#wbErr').innerText.replace(/\s+/g,' '),hist:document.querySelectorAll('#wbHist [data-t]').length,toast:(document.querySelector('#toast')||{}).innerText||''}));
for(const prov of ['openai','gemini','seedream','custom']){hits=[];mode='ok';const {c,p}=await setup(prov);await go(p);let s=await st(p);R.push([prov+' success',s.res=='blob:'&&!s.err&&s.hist>=1,JSON.stringify(s)+' '+hits[0]]);
 if(prov=='gemini'||prov=='seedream'){for(const m of prov=='gemini'?['safe-gem','safe-gem2']:['safe-sd']){hits=[];mode=m;await go(p);const t=await p.$eval('#wbErr',e=>e.innerText);R.push([m,/安全审核/.test(t)&&hits.length==1&&!/检查 API 设置/.test(t),t.slice(0,80)+' hits '+hits.length])}mode='ok'}
 if(prov=='custom')R.push(['custom via proxy',hits.every(h=>/\/api\/proxy/.test(h)&&/relay\.example/.test(h)),hits[0]]);
 if(prov=='openai'){await p.screenshot({path:S+'d-result.png'});
  {await p.evaluate(()=>{document.querySelector('details.adv').open=true;const x=document.querySelector('#wbExtra');x.value='性感紧身露背比基尼，sexy tight backless bikini, emphasizing her curves';x.dispatchEvent(new Event('input',{bubbles:true}))});
   const on0=await p.$eval('#wbNeutral',e=>e.checked);mode='ok';bodies=[];await go(p);const bOn=bodies.join(' ');
   await p.$eval('#wbNeutral',e=>e.scrollIntoView({block:'center'}));await p.screenshot({path:SS+'v15-toggle.png'});
   await p.click('#wbNeutral');bodies=[];await go(p);const bOff=bodies.join(' ');
   R.push(['neutral default on',on0,'']);R.push(['ON rewrites',/Professional e-commerce/.test(bOn)&&!/sexy|性感|比基尼|curves/i.test(bOn)&&/开背设计|open-back/.test(bOn),bOn.match(/Additional[^"\\]*/)?.[0]||bOn.slice(0,120)]);
   R.push(['OFF exact',!/Professional e-commerce/.test(bOff)&&/sexy tight backless bikini/.test(bOff),'']);
   const sentD=await p.$eval('#wbSentD',e=>e.textContent);R.push(['sent shown',/实际发送/.test(sentD),'']);
   await p.reload();await p.waitForFunction(()=>window.WB,null,{timeout:15000});await p.evaluate(()=>WB.show());R.push(['toggle persists off',await p.$eval('#wbNeutral',e=>!e.checked),'']);
   await p.setInputFiles('#wbFile',FX+'person.png');await p.evaluate(async()=>{await APP.load('costume');const k=Object.keys(APP.ITEMS).find(k=>APP.ITEMS[k].type=='costume');await WB.pick(APP.ITEMS[k])});await p.waitForFunction(()=>!document.querySelector('#wbGo').disabled,null,{timeout:15000});
   mode='safe-oai';await go(p);const qa=await p.$('[data-ef=neutral]');mode='ok';bodies=[];if(qa){await qa.click();await p.waitForTimeout(400);await p.waitForFunction(()=>document.querySelector('#wbBusy').hidden,null,{timeout:15000})}
   R.push(['quick action',!!qa&&await p.$eval('#wbNeutral',e=>e.checked)&&/Professional e-commerce/.test(bodies.join(' '))&&(await st(p)).res=='blob:','']);
   await p.evaluate(()=>{const x=document.querySelector('#wbExtra');x.value='';x.dispatchEvent(new Event('input',{bubbles:true}))})}
  for(const m of ['safe-oai']){hits=[];mode=m;await go(p);s=await st(p);const x=await p.evaluate(()=>({t:document.querySelector('#wbErr').innerText,cfgBtn:!!document.querySelector('#wbErr [data-open-cfg]'),b:[...document.querySelectorAll('#wbErr button')].map(b=>b.textContent)}));R.push(['safety oai',/安全审核/.test(x.t)&&/性感\/暴露/.test(x.t)&&!x.cfgBtn&&x.b.includes('换服务商重试')&&x.b.includes('换一套服装')&&hits.length==1,JSON.stringify(x.b)+' hits '+hits.length]);
   await p.click('#wbErr summary');await p.$eval('#wbErr',e=>e.scrollIntoView({block:'center'}));await p.screenshot({path:SS+'v14-safety.png'});R.push(['raw has rid',/req_abc123XYZ/.test(await p.$eval('#wbErr pre',e=>e.textContent)),'']);
   await p.click('[data-ef=prov]');await p.waitForTimeout(300);R.push(['prov opens cfg',await p.$eval('#cfg',e=>!e.hidden),'']);await p.evaluate(()=>{document.querySelector('#cfgX').click()});
   await p.click('[data-ef=cos]');await p.waitForTimeout(400);R.push(['cos picker',await p.evaluate(()=>!document.querySelector('#pk').hidden),'']);await p.keyboard.press('Escape');await p.waitForTimeout(300)}
  for(const m of ['401','429','500']){mode=m;await go(p);s=await st(p);R.push([prov+' '+m,!!s.err&&!s.err.includes('sk-test-123'),s.err.slice(0,90)])}
  mode='hang';await go(p);s=await st(p);R.push(['timeout',/还没有返回/.test(s.err),s.err.slice(0,60)]);
  mode='hang';await p.click('#wbGo');await p.waitForTimeout(600);await p.click('#wbStop');await p.waitForTimeout(500);s=await st(p);R.push(['cancel',/已取消/.test(s.toast)&&await p.$eval('#wbBusy',e=>e.hidden),s.toast]);
  mode='500';await go(p);mode='ok';await p.click('#wbRetry');await p.waitForFunction(()=>document.querySelector('#wbBusy').hidden,null,{timeout:15000});s=await st(p);R.push(['retry ok',!s.err,JSON.stringify(s)]);
  mode='slow';await p.selectOption('#wbN','3').catch(e=>R.push(['wbN',false,e.message]));await p.click('#wbGo');await p.waitForTimeout(700);await p.screenshot({path:S+'d-progress.png'});await p.waitForFunction(()=>document.querySelector('#wbBusy').hidden,null,{timeout:20000});await p.waitForTimeout(300);s=await st(p);
  const nr=await p.evaluate(()=>document.querySelectorAll('#wbRes > *').length);R.push(['multi 3',nr>=3,'res thumbs '+nr+' hist '+s.hist]);
  const [d]=await Promise.all([p.waitForEvent('download',{timeout:8000}),p.click('#wbZip')]).catch(e=>[null]);R.push(['zip',!!d,d&&d.suggestedFilename()]);
  const h0=s.hist;await p.hover('#wbHist [data-t]');await p.click('#wbHist [data-del]');await p.waitForTimeout(300);let h1=(await st(p)).hist;await p.click('#toast button');await p.waitForTimeout(400);let h2=(await st(p)).hist;R.push(['hist del+undo',h1==h0-1&&h2==h0,`${h0}->${h1}->${h2}`]);
  await p.click('#wbHist [data-t]:nth-child(3)');await p.waitForTimeout(300);R.push(['hist reuse',/·/.test(await p.$eval('#wbMeta',e=>e.innerText)),await p.$eval('#wbMeta',e=>e.innerText)]);
  await p.$eval('#wbHist',e=>e.scrollIntoView({block:'center'}));await p.screenshot({path:S+'d-history.png'});
  await p.click('#wbHClr');await p.waitForTimeout(300);h1=(await st(p)).hist;await p.click('#toast button');await p.waitForTimeout(400);h2=(await st(p)).hist;R.push(['hist clear+undo',h1==0&&h2==h0,`${h0}->${h1}->${h2}`]);
  await p.evaluate(()=>{document.querySelector('#cfg').hidden=false});await p.waitForTimeout(300);await p.screenshot({path:S+'d-settings.png'});}
 await c.close()}
// mobile dark studio + settings
mode='ok';{const {c,p}=await setup('openai',{width:390,height:844},true);await go(p);await p.screenshot({path:S+'m-dark-result.png'});await p.evaluate(()=>{document.querySelector('#cfg').hidden=false});await p.waitForTimeout(300);await p.screenshot({path:S+'m-dark-settings.png'});await c.close()}
// dark across pages
const c=await b.newContext({viewport:{width:1366,height:900},colorScheme:'dark'});const p=await c.newPage();p.on('pageerror',e=>errs.push('dark: '+e.message));await p.addInitScript(()=>{localStorage.setItem('theme','dark');localStorage.setItem('introX','1')});
for(const [n,u] of [['fav','/#fav'],['recent','/#recent'],['404','/nope']]){await p.goto(U+u);await p.waitForTimeout(1500);await p.screenshot({path:S+'dark-'+n+'.png'});const bg=await p.evaluate(()=>getComputedStyle(document.body).backgroundColor);R.push(['dark '+n,!/255, 255, 255/.test(bg),bg])}
await p.goto(U+'/');await p.waitForFunction(()=>APP.ITEMS&&Object.keys(APP.ITEMS).length,null,{timeout:15000});const href=await p.evaluate(async()=>{await APP.load('costume');const k=Object.keys(APP.ITEMS).find(k=>APP.ITEMS[k].type=='costume');return '/costume/'+APP.ITEMS[k].id+'/'});await p.goto(U+href);await p.waitForTimeout(800);await p.screenshot({path:S+'dark-seo.png'});R.push(['dark seo',!/255, 255, 255/.test(await p.evaluate(()=>getComputedStyle(document.body).backgroundColor)),href]);
// combo + long/extreme
await p.goto(U+'/');await p.waitForFunction(()=>APP.ITEMS&&document.querySelector('.card'),null,{timeout:15000});
await p.evaluate(()=>{const ks=Object.keys(APP.ITEMS).slice(0,12);ks.forEach(k=>APP.toggleSel(k));const c=document.querySelector('.card .info h3');if(c)c.textContent='超长标题测试'.repeat(20);document.querySelector('#nFav')&&(document.querySelector('#nFav').textContent='9999')});await p.waitForTimeout(500);await p.screenshot({path:S+'dark-combo.png'});
const ov=await p.evaluate(()=>[...document.querySelectorAll('.card,.tray-h,#tray,.tabs')].filter(e=>e.scrollWidth>e.clientWidth+2).map(e=>e.className||e.id).slice(0,5));R.push(['no overflow',!ov.length,JSON.stringify(ov)]);
const cb=await p.$eval('.cbtns button',e=>e.getBoundingClientRect().width);R.push(['card btn size',cb>=40,cb]);
await c.close();await b.close();
R.forEach(r=>console.log((r[1]?'PASS ':'FAIL ')+r[0]+' — '+r[2]));console.log('errors',errs);})();
