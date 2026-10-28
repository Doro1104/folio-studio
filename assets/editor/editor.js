(() => {
  const F=window.Folio, $=s=>document.querySelector(s), clone=v=>JSON.parse(JSON.stringify(v));
  const uid=()=> 'b'+Date.now().toString(36)+Math.random().toString(36).slice(2,7);
  const templates={
    bio:{name:'林予安',english:'YUAN LIN',role:'VISUAL STORYTELLER / 视觉创作',headline:'在影像与日常之间，寻找新的观看方式。',description:'这是一个可编辑的示例作品集。\n上传你的真实作品，写下你的创作过程，让每一个项目都被理解。',location:'杭州 / OPEN FOR COLLABORATION',image:'',imageCaption:'A PERSONAL COLLECTION / 2026'},
    projects:{title:'精选作品',intro:'从一个问题开始，到一种新的表达。以下项目均为虚构示例。',layout:'grid',items:[{title:'山间来信',category:'摄影 / 视觉叙事',year:'2026',role:'独立创作（示例）',description:'示例：围绕人与自然的关系展开观察。此处可写项目背景、你的工作和最终成果。',image:'',url:''},{title:'慢行城市',category:'设计 / 观察计划',year:'2025',role:'视觉设计（示例）',description:'示例：从街区漫步出发，整理声音、图像与文字，尝试构建一份可被阅读的城市记录。',image:'',url:''}]},
    gallery:{title:'观看的片段',intro:'不急着定义，让图像先说话。',layout:'grid',items:[{caption:'光与地形 / 示例图形',image:''},{caption:'空间与温度 / 示例图形',image:''},{caption:'城市的节奏 / 示例图形',image:''}]},
    text:{title:'关于我的创作',intro:'A NOTE ON PRACTICE',body:'这是示例文字，你可以在这里写下真实的创作理念。\n好的作品集不仅展示结果，也让人看见选择：为什么开始，怎样推进，以及你在其中承担了什么。\n让内容保持真实，让表达保留自己的声音。'},
    timeline:{title:'一路走来',intro:'教育、实践与持续发生的探索。',items:[{period:'2024 — 2026',title:'视觉创作学习与实践（示例）',description:'此处填写你的学校、专业或工作经历。'},{period:'2023',title:'独立观察计划（示例）',description:'此处填写一个真实项目，以及你承担的职责。'}]},
    video:{title:'影像放映室',intro:'将故事交给时间。',description:'添加公开视频链接，并上传你有权使用的封面。点击后在原平台播放，不自动下载或播放视频。',url:'',image:''},
    contact:{title:'下一个故事，一起开始。',description:'如果你对我的作品感兴趣，欢迎联系。',email:'hello@example.com',wechat:'',url:'',linkLabel:'更多作品'}
  };
  function fresh(){return {version:1,theme:'editorial',accent:'#636c48',font:'serif',spacing:'normal',motion:'rise',sample:true,selected:'intro',blocks:['bio','projects','text','gallery','timeline','contact'].map((type,i)=>({id:i?'block'+i:'intro',type,label:F.types[type][0],visible:true,data:clone(templates[type])}))};}
  let previewY=0;
  let state=fresh(), history=[], future=[], db, saveTimer, renderTimer, dragId, confirming;
  const frame=$('#preview');
  function toast(message){$('#toast').textContent=message;$('#toast').classList.add('show');clearTimeout(toast.timer);toast.timer=setTimeout(()=>$('#toast').classList.remove('show'),3000);}
  const current=()=>state.blocks.find(b=>b.id===state.selected);
  function checkpoint(){history.push(clone(state));if(history.length>25)history.shift();future=[];}
  function changed({sidebar=false,inspector=false}={}){if(sidebar)renderList();if(inspector)renderInspector();renderSettings();scheduleRender();scheduleSave();buttons();}
  function buttons(){$('#undo').disabled=!history.length;$('#redo').disabled=!future.length;}
  function scheduleRender(){clearTimeout(renderTimer);renderTimer=setTimeout(preview,180);}
  frame.addEventListener('load',()=>frame.contentWindow.postMessage({type:'folio-restore',y:previewY},'*'));
  function preview(){
    // Preserve the preview's vertical position while replacing content.
    frame.srcdoc=F.render(state,true);
  }
  function select(id,jump=true){state.selected=id;renderList();renderInspector();frame.contentWindow.postMessage({type:'folio-select-update',id},'*');if(jump)frame.contentWindow.postMessage({type:'folio-jump',id},'*');scheduleSave();}
  function renderList(){
    $('#block-list').innerHTML=state.blocks.map((b,i)=>`<div class="block-row ${b.id===state.selected?'selected':''} ${b.visible?'':'is-hidden'}" draggable="true" data-id="${b.id}"><span class="grip" aria-hidden="true">⠿</span><button type="button" class="block-select" data-select="${b.id}">${F.esc(b.label)}<small>${F.esc(F.types[b.type][0])}${b.visible?'':' · 已隐藏'}</small></button><button data-up="${b.id}" ${i===0?'disabled':''} title="上移" aria-label="上移${F.esc(b.label)}">↑</button><button data-down="${b.id}" ${i===state.blocks.length-1?'disabled':''} title="下移" aria-label="下移${F.esc(b.label)}">↓</button><button data-visible="${b.id}" aria-label="${b.visible?'隐藏':'显示'}${F.esc(b.label)}" title="${b.visible?'隐藏':'显示'}">${b.visible?'◉':'○'}</button></div>`).join('');
  }
  const field=(key,label,value,kind='text')=>`<label class="field"><span>${label}</span>${kind==='textarea'?`<textarea data-key="${key}" rows="4">${F.esc(value)}</textarea>`:`<input type="${kind}" data-key="${key}" value="${F.esc(value)}">`}</label>`;
  const upload=(path,value)=>`${F.image(value)?`<img class="image-mini" src="${value}" alt="当前图片"><button class="crop-edit-button" type="button" data-crop="${path}">↔ 调整取景 / 完整显示</button>`:''}<label class="image-upload">＋ ${F.image(value)?'替换图片':'上传图片'}<input type="file" accept="image/png,image/jpeg,image/webp,image/gif" data-upload="${path}"></label>${F.image(value)?`<button class="secondary" type="button" data-remove-image="${path}" style="margin-top:6px">移除图片</button>`:''}`;
  function renderInspector(){
    const b=current();if(!b){$('#inspector').innerHTML='<p class="muted">添加或选择一个组件开始编辑。</p>';return;}
    $('#inspector-title').textContent=F.types[b.type][0];$('#inspector-description').textContent=F.types[b.type][1];
    let content=field('label','组件名称（仅用于导航与管理）',b.label);
    if(b.type==='bio'){
      const d=b.data;
      content+=field('name','姓名',d.name)+field('english','英文名 / 创作署名',d.english)+field('role','创作方向',d.role)+field('headline','一句话介绍',d.headline,'textarea')+field('description','个人介绍',d.description,'textarea')+field('location','位置与状态',d.location)+upload('image',d.image)+field('imageCaption','图片说明',d.imageCaption);
      content+=`<label class="toggle-label"><input type="checkbox" id="sample-toggle" ${state.sample?'checked':''}>保留“虚构示例资料”提示</label><p class="muted small">替换为真实资料后，可以关闭示例提示。不要公开你没有授权的个人资料或作品。</p>`;
    }else{
      content+=field('title','标题',b.data.title);
      if('intro' in b.data)content+=field('intro','引言',b.data.intro,'textarea');
      if(b.type==='text')content+=field('body','正文（换行分段）',b.data.body,'textarea');
      if(['projects','gallery'].includes(b.type))content+=`<label class="field"><span>布局</span><select data-key="layout"><option value="grid" ${b.data.layout==='grid'?'selected':''}>${b.type==='projects'?'双列 / 主题编排':'多图并置'}</option><option value="single" ${b.data.layout==='single'?'selected':''}>单列大图</option></select></label>`;
      if(b.type==='video')content+=upload('image',b.data.image)+field('url','视频网址（https://）',b.data.url,'url')+field('description','视频说明',b.data.description,'textarea');
      if(b.type==='contact')content+=field('description','合作与交流说明',b.data.description,'textarea')+field('email','公开邮箱',b.data.email,'email')+field('wechat','公开微信号',b.data.wechat)+field('url','其他作品链接（https://）',b.data.url,'url')+field('linkLabel','链接名称',b.data.linkLabel);
      if(b.data.items){
        content+=b.data.items.map((item,i)=>`<div class="item-editor"><div class="item-heading"><span>${b.type==='timeline'?'经历':'作品'} ${String(i+1).padStart(2,'0')}</span><button type="button" data-remove-item="${i}">删除</button></div>${Object.keys(item).filter(k=>!['image','imageView'].includes(k)).map(key=>field(`items.${i}.${key}`,({title:'名称',caption:'图片说明',description:'项目说明 / 过程与成果',category:'分类',year:'年份',role:'本人角色',period:'时间',url:'项目网址（https://）'})[key]||key,item[key],key==='description'?'textarea':key==='url'?'url':'text')).join('')}${'image' in item?upload(`items.${i}.image`,item.image):''}</div>`).join('');
        content+='<button type="button" class="secondary" id="add-item">＋ 添加一项</button>';
      }
    }
    content+=`<label class="toggle-label"><input id="block-visible" type="checkbox" ${b.visible?'checked':''}>在网站中显示此组件</label><button type="button" id="duplicate" class="secondary">复制组件</button><button class="danger" type="button" id="delete-block">删除这个组件</button>`;
    $('#inspector').innerHTML=content;
  }
  function renderSettings(){
    $('#themes').innerHTML=Object.entries(F.themes).map(([key,t])=>`<button type="button" class="theme-card ${state.theme===key?'active':''}" data-theme="${key}"><span class="theme-swatch swatch-${key}"><i></i><i></i><i></i><em></em></span><b>${t.name}</b><p>${t.description}</p><small>${t.english}</small></button>`).join('');
    for(const key of ['accent','font','spacing','motion'])$('#'+key).value=state[key];$('#accent-value').textContent=state.accent.toUpperCase();$('#theme-label').textContent=F.themes[state.theme].english+' / '+F.themes[state.theme].name;
  }
  function setPath(path,value){const b=current();if(!b)return;if(path==='label'){b.label=value;return;}const parts=path.split('.');let d=b.data;for(let i=0;i<parts.length-1;i++)d=d[parts[i]];d[parts.at(-1)]=value;}
  function move(id,offset){const from=state.blocks.findIndex(b=>b.id===id),to=from+offset;if(from<0||to<0||to>=state.blocks.length)return;checkpoint();state.blocks.splice(to,0,state.blocks.splice(from,1)[0]);changed({sidebar:true});}
  function confirmAction(title,message,fn){$('#confirm-title').textContent=title;$('#confirm-message').textContent=message;confirming=fn;$('#confirm-dialog').showModal();}
  $('#confirm-ok').onclick=()=>{$('#confirm-dialog').close();confirming?.();confirming=null;};
  $('[data-cancel]').onclick=()=>{$('#confirm-dialog').close();confirming=null;};
  $('#block-list').addEventListener('click',e=>{
    const btn=e.target.closest('button');if(!btn)return;
    if(btn.dataset.select)select(btn.dataset.select);
    if(btn.dataset.up)move(btn.dataset.up,-1);if(btn.dataset.down)move(btn.dataset.down,1);
    if(btn.dataset.visible){checkpoint();const b=state.blocks.find(b=>b.id===btn.dataset.visible);b.visible=!b.visible;changed({sidebar:true,inspector:true});}
  });
  $('#block-list').addEventListener('dragstart',e=>{const row=e.target.closest('.block-row');if(!row)return;dragId=row.dataset.id;e.dataTransfer.setData('text/plain',dragId);e.dataTransfer.effectAllowed='move';});
  $('#block-list').addEventListener('dragover',e=>{e.preventDefault();document.querySelectorAll('.drag-over').forEach(el=>el.classList.remove('drag-over'));e.target.closest('.block-row')?.classList.add('drag-over');});
  $('#block-list').addEventListener('dragend',()=>document.querySelectorAll('.drag-over').forEach(el=>el.classList.remove('drag-over')));
  $('#block-list').addEventListener('drop',e=>{e.preventDefault();const row=e.target.closest('.block-row');if(!row||!dragId||row.dataset.id===dragId)return;const from=state.blocks.findIndex(b=>b.id===dragId),to=state.blocks.findIndex(b=>b.id===row.dataset.id);if(from<0||to<0)return;checkpoint();state.blocks.splice(to,0,state.blocks.splice(from,1)[0]);dragId=null;changed({sidebar:true});});
  addEventListener('message',e=>{if(e.source===frame.contentWindow&&e.data?.type==='folio-select'&&state.blocks.some(b=>b.id===e.data.id))select(e.data.id,false);});
  addEventListener('message',e=>{if(e.source===frame.contentWindow&&e.data?.type==='folio-scroll'&&Number.isFinite(e.data.y))previewY=Math.max(0,e.data.y);});
  $('#inspector').addEventListener('focusin',e=>{if(e.target.matches('[data-key]'))checkpoint();});
  $('#inspector').addEventListener('input',e=>{const el=e.target;if(!el.dataset.key)return;setPath(el.dataset.key,el.value);changed({sidebar:el.dataset.key==='label'});});
  $('#inspector').addEventListener('change',async e=>{
    const el=e.target;
    if(el.id==='sample-toggle'){checkpoint();state.sample=el.checked;changed();}
    if(el.id==='block-visible'){checkpoint();current().visible=el.checked;changed({sidebar:true});}
    if(el.dataset.upload){const file=el.files[0];el.value='';if(!file)return;if(!['image/jpeg','image/png','image/webp','image/gif'].includes(file.type)){toast('请使用 JPG、PNG、WebP 或 GIF 图片');return;}if(file.size>3*1024*1024){toast('单张图片请控制在 3 MB 内');return;}
      const id=state.selected,path=el.dataset.upload;
      try{const data=await new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(r.result);r.onerror=reject;r.readAsDataURL(file);});if(id!==state.selected)return;const b=current(),view=await window.FolioCrop.open(data,{ratio:b.type==='gallery'?'original':'auto'},b.type,state.theme);if(!view||id!==state.selected)return;checkpoint();setPath(path,data);setPath(path+'View',view);changed({inspector:true});toast('图片与取景已保存，可随时重新调整');}catch{toast('图片读取失败，请重试');}
    }
  });
  $('#inspector').addEventListener('click',async e=>{
    const el=e.target.closest('button');if(!el)return;const b=current();
    if(el.dataset.crop){const path=el.dataset.crop;let item=b.data;for(const part of path.split('.').slice(0,-1))item=item[part];try{const view=await window.FolioCrop.open(item.image,item.imageView,b.type,state.theme);if(view){checkpoint();setPath(path+'View',view);changed({inspector:true});}}catch{toast('图片无法打开，请重新上传');}}
    if(el.dataset.removeImage){checkpoint();setPath(el.dataset.removeImage,'');setPath(el.dataset.removeImage+'View',F.imageView());changed({inspector:true});}
    if(el.dataset.removeItem!==undefined){checkpoint();b.data.items.splice(Number(el.dataset.removeItem),1);changed({inspector:true});}
    if(el.id==='add-item'){if(b.data.items.length>=12){toast('每个组件最多放 12 项，可添加新组件继续整理');return;}checkpoint();b.data.items.push(clone(templates[b.type].items[0]));changed({inspector:true});}
    if(el.id==='duplicate'){if(state.blocks.length>=30){toast('当前最多支持 30 个组件');return;}checkpoint();const c=clone(b);c.id=uid();c.label+=' · 副本';state.blocks.splice(state.blocks.indexOf(b)+1,0,c);state.selected=c.id;changed({sidebar:true,inspector:true});}
    if(el.id==='delete-block')confirmAction('删除组件？','此操作可以撤销。导出备份可以长期保留当前资料。',()=>{checkpoint();state.blocks=state.blocks.filter(x=>x.id!==b.id);state.selected=state.blocks[0]?.id||'';changed({sidebar:true,inspector:true});});
  });
  document.querySelectorAll('[data-tab]').forEach(btn=>btn.onclick=()=>{document.querySelectorAll('[data-tab]').forEach(b=>b.classList.toggle('active',b===btn));$('#blocks-tab').hidden=btn.dataset.tab!=='blocks';$('#design-tab').hidden=btn.dataset.tab!=='design';});
  $('#themes').onclick=e=>{const btn=e.target.closest('[data-theme]');if(!btn)return;checkpoint();state.theme=btn.dataset.theme;state.accent=F.themes[state.theme].color;changed();};
  for(const key of ['accent','font','spacing','motion'])$('#'+key).addEventListener('change',e=>{checkpoint();state[key]=e.target.value;changed();});
  $('#default-color').onclick=()=>{checkpoint();state.accent=F.themes[state.theme].color;changed();};
  $('#add').onclick=()=>$('#add-dialog').showModal();$('[data-close]').onclick=()=>$('#add-dialog').close();
  $('#component-palette').innerHTML=Object.entries(F.types).map(([type,[name,desc]])=>`<button type="button" data-add="${type}"><b>${name} ＋</b><span>${desc}</span></button>`).join('');
  $('#component-palette').onclick=e=>{const btn=e.target.closest('[data-add]');if(!btn)return;if(state.blocks.length>=30){toast('当前最多支持 30 个组件');return;}checkpoint();const type=btn.dataset.add,b={id:uid(),type,label:F.types[type][0],visible:true,data:clone(templates[type])};state.blocks.push(b);state.selected=b.id;$('#add-dialog').close();changed({sidebar:true,inspector:true});toast('已添加'+b.label);};
  $('#undo').onclick=()=>{if(!history.length)return;future.push(clone(state));state=history.pop();changed({sidebar:true,inspector:true});};
  $('#redo').onclick=()=>{if(!future.length)return;history.push(clone(state));state=future.pop();changed({sidebar:true,inspector:true});};
  addEventListener('keydown',e=>{if(!(e.ctrlKey||e.metaKey)||e.key.toLowerCase()!=='z'||e.target.matches('input,textarea')||document.querySelector('dialog[open]'))return;e.preventDefault();$(e.shiftKey?'#redo':'#undo').click();});
  $('#reset').onclick=()=>confirmAction('恢复示例初稿？','当前内容会被替换。建议先点击“备份资料”；恢复后仍可撤销。',()=>{checkpoint();state=fresh();previewY=0;changed({sidebar:true,inspector:true});toast('已恢复示例');});
  function device(mobile){$('#preview-shell').classList.toggle('mobile',mobile);for(const id of ['mobile','desktop']){$('#'+id).classList.toggle('active',mobile===(id==='mobile'));$('#'+id).setAttribute('aria-pressed',String(mobile===(id==='mobile')));}}
  $('#desktop').onclick=()=>device(false);$('#mobile').onclick=()=>device(true);
  $('#fullscreen').onclick=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await $('.stage').requestFullscreen();}catch{toast('当前浏览器不支持放大，可使用浏览器全屏模式');}};
  function download(content,name,type){const u=URL.createObjectURL(new Blob([content],{type})),a=document.createElement('a');a.href=u;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),3000);}
  $('#backup').onclick=()=>{download(JSON.stringify(state,null,2),'见页-资料备份.json','application/json');toast('已下载资料备份，包含上传的图片');};
  $('#export').onclick=()=>{download(F.render(state,false),'我的作品集.html','text/html;charset=utf-8');toast('已导出独立网页，可离线打开或上传托管');};
  function validate(v){
    if(!v||v.version!==1||!Array.isArray(v.blocks)||v.blocks.length>30)throw Error('不是支持的见页资料文件');
    const s=fresh();for(const k of ['theme','font','spacing','motion'])if(({theme:Object.keys(F.themes),font:['serif','sans'],spacing:['compact','normal','airy'],motion:['none','fade','rise']})[k].includes(v[k]))s[k]=v[k];
    if(/^#[0-9a-f]{6}$/i.test(v.accent))s.accent=v.accent;s.sample=v.sample!==false;
    const ids=new Set();s.blocks=v.blocks.map(raw=>{if(!raw||!templates[raw.type]||!raw.data)throw Error('组件数据不完整');const type=raw.type,d=clone(templates[type]);
      for(const key of Object.keys(d)){
        if(key==='items'){if(!Array.isArray(raw.data.items)||raw.data.items.length>12)throw Error('作品条目数量不正确');d.items=raw.data.items.map(item=>{if(!item||typeof item!=='object')throw Error('条目格式错误');const normalized={};for(const [k,def] of Object.entries(templates[type].items[0]))normalized[k]=k==='image'?F.image(item[k]):String(item[k]??def).slice(0,16000);if('image' in normalized)normalized.imageView=F.imageView(item.imageView);return normalized;});}
        else d[key]=key==='image'?F.image(raw.data[key]):String(raw.data[key]??d[key]).slice(0,16000);
      }
      if('image' in d)d.imageView=F.imageView(raw.data.imageView);
      if('layout'in d&&!['grid','single'].includes(d.layout))d.layout='grid';
      let id=typeof raw.id==='string'&&/^[a-z][a-z0-9_-]{0,70}$/i.test(raw.id)?raw.id:uid();if(ids.has(id))id=uid();ids.add(id);
      return {id,type,label:String(raw.label||F.types[type][0]).slice(0,80),visible:raw.visible!==false,data:d};
    });s.selected=s.blocks.find(b=>b.id===v.selected)?.id||s.blocks[0]?.id||'';return s;
  }
  $('#import').onclick=()=>$('#import-file').click();
  $('#import-file').onchange=async e=>{const file=e.target.files[0];e.target.value='';if(!file)return;if(file.size>40*1024*1024){toast('资料文件超过 40 MB，请分开整理图片');return;}try{const imported=validate(JSON.parse(await file.text()));confirmAction('载入这份资料？','将替换当前编辑内容。载入后可撤销，也可以提前备份当前资料。',()=>{checkpoint();state=imported;changed({sidebar:true,inspector:true});toast('资料已导入');});}catch(error){toast('无法导入：'+error.message);}};
  async function openDB(){return new Promise((resolve,reject)=>{const req=indexedDB.open('folio-local-prototype',1);req.onupgradeneeded=()=>req.result.createObjectStore('documents');req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);});}
  async function save(){if(!db){$('#save-status').textContent='未自动保存 · 请备份资料';return;}const snapshot=clone(state);try{await new Promise((resolve,reject)=>{const tx=db.transaction('documents','readwrite');tx.objectStore('documents').put(snapshot,'draft');tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error);});$('#save-status').textContent='已保存到本机';}catch{$('#save-status').textContent='保存失败 · 请下载备份';toast('本地保存失败，请立即下载资料备份');}}
  function scheduleSave(){$('#save-status').textContent='正在保存…';clearTimeout(saveTimer);saveTimer=setTimeout(save,500);}
  async function init(){try{db=await openDB();const saved=await new Promise((resolve,reject)=>{const r=db.transaction('documents').objectStore('documents').get('draft');r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});if(saved)state=validate(saved);$('#save-status').textContent=saved?'已恢复本机草稿':'已创建示例草稿';}catch{$('#save-status').textContent='自动保存不可用 · 请备份资料';}
    renderList();renderInspector();renderSettings();buttons();preview();if(db)scheduleSave();
  }
  init();
})();
