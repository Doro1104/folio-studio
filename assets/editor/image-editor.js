(() => {
  const F=window.Folio,$=s=>document.querySelector(s);
  let task,drag;
  const dialog=$('#image-dialog'),stage=$('#crop-stage'),photo=$('#crop-photo');
  const clamp=n=>Math.max(0,Math.min(100,n));
  function paint(){
    if(!task)return;
    const v=task.view,ratio=F.frameRatio(v,task.type,task.theme);
    stage.style.aspectRatio=ratio;
    stage.style.width=Math.min(600,Math.max(160,innerWidth-100),Math.min(380,innerHeight*.43)*ratio)+'px';
    stage.classList.toggle('fit-contain',v.fit==='contain');
    photo.style.objectPosition=v.fit==='contain'?'50% 50%':`${v.x}% ${v.y}%`;
    photo.style.transform=v.fit==='contain'?'none':`scale(${v.zoom})`;
    photo.style.transformOrigin=`${v.x}% ${v.y}%`;
    for(const key of ['fit','ratio','zoom','x','y'])$('#crop-'+key).value=v[key];
    const avatar=task.type==='bio'&&task.theme==='case';
    $('#crop-ratio').disabled=avatar;
    if(avatar)$('#crop-ratio').value='1:1';
    stage.style.borderRadius=avatar?'50%':'0';
    for(const key of ['zoom','x','y'])$('#crop-'+key+'-value').textContent=key==='zoom'?Number(v.zoom).toFixed(2)+'×':Math.round(v[key])+'%';
    for(const key of ['zoom','x','y'])$('#crop-'+key).disabled=v.fit==='contain';
    $('#crop-hint').textContent=v.fit==='contain'?'完整保留图片，画框空白属于正常留白。':Math.abs(ratio-v.natural)<.001&&v.zoom===1?'当前按原图比例呈现。选择其他画框比例，或放大后即可拖动取景。':'拖动图片调整取景；也可以使用方向键或下方位置滑杆。';
  }
  function finish(value){const resolve=task?.resolve;task=null;drag=null;dialog.close();photo.removeAttribute('src');resolve?.(value);}
  window.FolioCrop={open(source,settings,type,theme){return new Promise((resolve,reject)=>{
    const img=new Image();img.onload=()=>{
      const view=F.imageView(settings);view.natural=img.naturalWidth/img.naturalHeight;
      task={source,view,type,theme,resolve};photo.src=source;
      $('#crop-size').textContent=`原图 ${img.naturalWidth} × ${img.naturalHeight} · 保留原图，可随时重调`;
      dialog.showModal();paint();stage.focus();
    };img.onerror=()=>reject(Error('图片无法解码'));img.src=source;
  });}};
  $('#crop-cancel').onclick=()=>finish(null);
  $('#crop-apply').onclick=()=>finish({...task.view});
  dialog.addEventListener('cancel',e=>{e.preventDefault();finish(null);});
  for(const key of ['fit','ratio','zoom','x','y'])$('#crop-'+key).addEventListener('input',e=>{
    if(!task)return;task.view[key]=['fit','ratio'].includes(key)?e.target.value:Number(e.target.value);paint();
  });
  $('#crop-reset').onclick=()=>{if(!task)return;Object.assign(task.view,{x:50,y:50,zoom:1});paint();};
  stage.addEventListener('pointerdown',e=>{
    if(!task||task.view.fit==='contain'||e.button!==0)return;
    e.preventDefault();stage.focus();stage.setPointerCapture(e.pointerId);
    drag={x:e.clientX,y:e.clientY,view:{...task.view}};
  });
  stage.addEventListener('pointermove',e=>{
    if(!drag||!task)return;
    const rect=stage.getBoundingClientRect(),v=task.view,n=v.natural;
    const scale=Math.max(rect.width/n,rect.height)*v.zoom;
    const overflowX=n*scale-rect.width,overflowY=scale-rect.height;
    v.x=overflowX>1?clamp(drag.view.x-(e.clientX-drag.x)*100/overflowX):50;
    v.y=overflowY>1?clamp(drag.view.y-(e.clientY-drag.y)*100/overflowY):50;
    paint();
  });
  for(const event of ['pointerup','pointercancel','lostpointercapture'])stage.addEventListener(event,()=>{drag=null;});
  addEventListener('resize',paint);
  stage.addEventListener('keydown',e=>{
    if(!task||task.view.fit==='contain'||!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key))return;
    e.preventDefault();const v=task.view,step=e.shiftKey?10:2;
    if(e.key==='ArrowLeft')v.x=clamp(v.x-step);if(e.key==='ArrowRight')v.x=clamp(v.x+step);
    if(e.key==='ArrowUp')v.y=clamp(v.y-step);if(e.key==='ArrowDown')v.y=clamp(v.y+step);paint();
  });
})();
