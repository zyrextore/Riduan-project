/* ==========================================================================
   ZYREX GESTURE CANVAS
   Real-time webcam hand-tracking drawing app (MediaPipe Hands, lazy-loaded
   from CDN so it never adds weight to the first page load). Falls back to
   plain mouse/touch drawing automatically if the camera or the tracking
   model can't be loaded (permission denied, offline, unsupported browser).
   Mirrors the mount/unmount + open/close pattern already used by the
   Radar and AI dedicated views in script.js.
   ========================================================================== */
(()=>{
  const view=document.getElementById('gestureView');
  if(!view)return;

  const camWrap=document.getElementById('gestureCamWrap');
  const video=document.getElementById('gestureVideo');
  const canvas=document.getElementById('gestureCanvas');
  const cursor=document.getElementById('gestureCursor');
  const hint=document.getElementById('gestureHint');
  const statusEl=document.getElementById('gestureHandStatus');
  const teaserStatus=document.getElementById('gestureTeaserStatus');
  const startBtn=document.getElementById('gestureStart');
  const undoBtn=document.getElementById('gestureUndo');
  const clearBtn=document.getElementById('gestureClear');
  const saveBtn=document.getElementById('gestureSave');
  const glowBtn=document.getElementById('gestureGlow');
  const mirrorBtn=document.getElementById('gestureMirror');
  const sizeMinus=document.getElementById('gestureSizeMinus');
  const sizePlus=document.getElementById('gestureSizePlus');
  const sizeVal=document.getElementById('gestureSizeVal');
  const colorsWrap=document.getElementById('gestureColors');
  const colorPicker=document.getElementById('gestureColorPicker');
  const ctx=canvas.getContext('2d');

  const PALETTE=['#ff3d7a','#ff8a3d','#ffd93d','#7dff5c','#3dd9ff','#3d7bff','#a13dff','#ff3dd4','#ffffff','#9C8CA8','#171019','#00e0b0'];

  const state={
    tool:'draw',
    color:PALETTE[0],
    size:10,
    glow:false,
    mirror:true,
    strokes:[],
    activeStroke:null,
    wasActive:false,
    running:false,
    manualMode:false,
    manualDrawing:false,
    hands:null,
    stream:null,
    rafId:null,
    sending:false,
    libsLoaded:false
  };

  /* ---------- UI: palette ---------- */
  PALETTE.forEach((c,i)=>{
    const b=document.createElement('button');
    b.type='button'; b.className='gcolor'+(i===0?' active':''); b.style.background=c; b.dataset.color=c;
    b.setAttribute('aria-label','Warna '+c);
    b.addEventListener('click',()=>{
      state.color=c;
      colorsWrap.querySelectorAll('.gcolor').forEach(x=>x.classList.toggle('active',x===b));
      colorPicker.value=c;
    });
    colorsWrap.appendChild(b);
  });
  colorPicker.addEventListener('input',()=>{
    state.color=colorPicker.value;
    colorsWrap.querySelectorAll('.gcolor').forEach(x=>x.classList.remove('active'));
  });

  /* ---------- UI: tools ---------- */
  view.querySelectorAll('.gtool').forEach(btn=>{
    btn.addEventListener('click',()=>{
      state.tool=btn.dataset.gtool;
      view.querySelectorAll('.gtool').forEach(x=>x.classList.toggle('active',x===btn));
    });
  });

  /* ---------- UI: size ---------- */
  const clampSize=v=>Math.max(2,Math.min(60,v));
  sizeMinus.addEventListener('click',()=>{state.size=clampSize(state.size-2);sizeVal.textContent=state.size;});
  sizePlus.addEventListener('click',()=>{state.size=clampSize(state.size+2);sizeVal.textContent=state.size;});

  /* ---------- UI: glow / mirror ---------- */
  glowBtn.addEventListener('click',()=>{
    state.glow=!state.glow;
    glowBtn.setAttribute('aria-pressed',String(state.glow));
  });
  mirrorBtn.addEventListener('click',()=>{
    state.mirror=!state.mirror;
    mirrorBtn.setAttribute('aria-pressed',String(state.mirror));
    camWrap.classList.toggle('mirrored',state.mirror);
  });

  /* ---------- drawing engine (shared by hand-tracking & manual mode) ---------- */
  function drawSegment(a,b,tool,color,size,glow){
    ctx.lineCap='round'; ctx.lineJoin='round';
    if(tool==='erase'){
      ctx.globalCompositeOperation='destination-out';
      ctx.shadowBlur=0;
      ctx.lineWidth=size*1.8;
      ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();
      ctx.globalCompositeOperation='source-over';
      return;
    }
    ctx.globalCompositeOperation='source-over';
    ctx.strokeStyle=color;
    ctx.lineWidth=size;
    ctx.shadowBlur=glow?size*1.6:0;
    ctx.shadowColor=glow?color:'transparent';
    ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();
  }

  function drawDot(p,tool,color,size,glow){
    if(tool==='erase'){
      ctx.globalCompositeOperation='destination-out';
      ctx.shadowBlur=0;
      ctx.beginPath();ctx.arc(p.x,p.y,size*0.9,0,Math.PI*2);ctx.fill();
      ctx.globalCompositeOperation='source-over';
      return;
    }
    ctx.globalCompositeOperation='source-over';
    ctx.fillStyle=color;
    ctx.shadowBlur=glow?size*1.6:0;
    ctx.shadowColor=glow?color:'transparent';
    ctx.beginPath();ctx.arc(p.x,p.y,size/2,0,Math.PI*2);ctx.fill();
  }

  function redrawAll(){
    ctx.clearRect(0,0,canvas.width,canvas.height);
    state.strokes.forEach(s=>{
      if(s.points.length===1){drawDot(s.points[0],s.tool,s.color,s.size,s.glow);return;}
      for(let i=1;i<s.points.length;i++) drawSegment(s.points[i-1],s.points[i],s.tool,s.color,s.size,s.glow);
    });
    ctx.shadowBlur=0;
  }

  function beginStroke(pt){
    state.activeStroke={tool:state.tool,color:state.color,size:state.size,glow:state.glow,points:[pt]};
    state.strokes.push(state.activeStroke);
    drawDot(pt,state.tool,state.color,state.size,state.glow);
  }
  function extendStroke(pt){
    if(!state.activeStroke)return;
    const pts=state.activeStroke.points;
    const last=pts[pts.length-1];
    drawSegment(last,pt,state.activeStroke.tool,state.activeStroke.color,state.activeStroke.size,state.activeStroke.glow);
    pts.push(pt);
  }
  function endStroke(){ state.activeStroke=null; }

  undoBtn.addEventListener('click',()=>{ state.strokes.pop(); redrawAll(); });
  clearBtn.addEventListener('click',()=>{ state.strokes=[]; redrawAll(); });

  saveBtn.addEventListener('click',()=>{
    const out=document.createElement('canvas');
    out.width=canvas.width; out.height=canvas.height;
    const octx=out.getContext('2d');
    octx.save();
    if(state.mirror){ octx.translate(out.width,0); octx.scale(-1,1); }
    if(video.videoWidth) octx.drawImage(video,0,0,out.width,out.height);
    else { octx.fillStyle='#0B0810'; octx.fillRect(0,0,out.width,out.height); }
    octx.restore();
    octx.save();
    if(state.mirror){ octx.translate(out.width,0); octx.scale(-1,1); }
    octx.drawImage(canvas,0,0,out.width,out.height);
    octx.restore();
    const a=document.createElement('a');
    a.download='zyrex-gesture-'+Date.now()+'.png';
    a.href=out.toDataURL('image/png');
    a.click();
  });

  /* ---------- manual (mouse/touch) fallback ---------- */
  function canvasPoint(evt){
    const r=canvas.getBoundingClientRect();
    const cx=(evt.touches?evt.touches[0].clientX:evt.clientX)-r.left;
    const cy=(evt.touches?evt.touches[0].clientY:evt.clientY)-r.top;
    let x=cx/r.width*canvas.width, y=cy/r.height*canvas.height;
    if(state.mirror) x=canvas.width-x;
    return {x,y};
  }
  function enableManualMode(msg){
    if(state.manualMode)return;
    state.manualMode=true;
    camWrap.classList.add('manual-mode');
    cursor.hidden=true;
    hint.textContent=msg||'Mode manual: gambar langsung pakai jari / mouse di kanvas.';
    hint.style.display='block';
    statusEl.textContent='MODE MANUAL (SENTUH LAYAR)';
    statusEl.classList.remove('live');
    startBtn.textContent='✎ MODE MANUAL AKTIF';
    startBtn.disabled=true;
    canvas.style.pointerEvents='auto';
    const down=e=>{ e.preventDefault(); state.manualDrawing=true; beginStroke(canvasPoint(e)); };
    const move=e=>{ if(!state.manualDrawing)return; e.preventDefault(); extendStroke(canvasPoint(e)); };
    const up=()=>{ state.manualDrawing=false; endStroke(); };
    canvas.addEventListener('pointerdown',down);
    canvas.addEventListener('pointermove',move);
    window.addEventListener('pointerup',up);
    canvas.addEventListener('touchstart',down,{passive:false});
    canvas.addEventListener('touchmove',move,{passive:false});
    window.addEventListener('touchend',up);
  }

  /* ---------- hand-tracking mode ---------- */
  function loadScriptOnce(src){
    return new Promise((resolve,reject)=>{
      if(document.querySelector(`script[src="${src}"]`)){resolve();return;}
      const s=document.createElement('script');
      s.src=src; s.crossOrigin='anonymous';
      s.onload=()=>resolve(); s.onerror=()=>reject(new Error('load fail: '+src));
      document.head.appendChild(s);
    });
  }

  async function loadHandLibs(){
    if(state.libsLoaded)return true;
    const timeout=ms=>new Promise((_,rej)=>setTimeout(()=>rej(new Error('timeout')),ms));
    try{
      await Promise.race([
        loadScriptOnce('https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.js'),
        timeout(12000)
      ]);
      state.libsLoaded=!!window.Hands;
      return state.libsLoaded;
    }catch(e){
      return false;
    }
  }

  function dist(a,b){ return Math.hypot(a.x-b.x,a.y-b.y); }

  function onHandResults(results){
    if(!state.running)return;
    const lm=results.multiHandLandmarks && results.multiHandLandmarks[0];
    if(!lm){
      cursor.hidden=true;
      if(state.wasActive){ endStroke(); state.wasActive=false; }
      statusEl.textContent='NO HAND';
      statusEl.classList.remove('live');
      return;
    }
    statusEl.textContent='HAND DETECTED · '+state.tool.toUpperCase();
    statusEl.classList.add('live');

    const w=canvas.width,h=canvas.height;
    const thumb={x:lm[4].x*w,y:lm[4].y*h};
    const index={x:lm[8].x*w,y:lm[8].y*h};
    const wrist={x:lm[0].x*w,y:lm[0].y*h};
    const midMcp={x:lm[9].x*w,y:lm[9].y*h};
    const handScale=Math.max(dist(wrist,midMcp),1);
    const pinchRatio=dist(thumb,index)/handScale;
    const isPinching=pinchRatio<0.55;
    const cursorPt={x:(thumb.x+index.x)/2,y:(thumb.y+index.y)/2};

    cursor.hidden=false;
    cursor.style.transform=`translate(${cursorPt.x}px,${cursorPt.y}px)`;
    cursor.classList.toggle('active',isPinching);

    const active=isPinching && state.tool!=='move';
    if(active && !state.wasActive) beginStroke(cursorPt);
    else if(active && state.wasActive) extendStroke(cursorPt);
    else if(!active && state.wasActive) endStroke();
    state.wasActive=active;
  }

  async function startHandTracking(){
    hint.textContent='Memuat model hand-tracking…';
    hint.style.display='block';
    const ok=await loadHandLibs();
    if(!ok){ enableManualMode('Nggak bisa load hand-tracking (offline / diblokir). Lanjut mode manual ya.'); return; }

    try{
      state.stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:'user'},audio:false});
    }catch(e){
      enableManualMode('Akses kamera ditolak / nggak ada kamera. Lanjut mode manual ya.');
      return;
    }
    video.srcObject=state.stream;
    await video.play().catch(()=>{});
    await new Promise(res=>{
      if(video.videoWidth){res();return;}
      video.addEventListener('loadedmetadata',()=>res(),{once:true});
    });
    canvas.width=video.videoWidth||640;
    canvas.height=video.videoHeight||480;

    const Hands=window.Hands;
    state.hands=new Hands({locateFile:f=>`https://cdn.jsdelivr.net/npm/@mediapipe/hands/${f}`});
    state.hands.setOptions({maxNumHands:1,modelComplexity:1,minDetectionConfidence:0.6,minTrackingConfidence:0.5});
    state.hands.onResults(onHandResults);

    state.running=true;
    state.sending=false;
    const loop=async()=>{
      if(!state.running)return;
      if(video.readyState>=2 && state.hands && !state.sending){
        state.sending=true;
        try{ await state.hands.send({image:video}); }catch(e){ /* ignore transient frame errors */ }
        state.sending=false;
      }
      state.rafId=requestAnimationFrame(loop);
    };
    state.rafId=requestAnimationFrame(loop);

    hint.style.display='none';
    startBtn.textContent='● KAMERA AKTIF';
    startBtn.disabled=true;
    statusEl.textContent='NO HAND';
  }

  startBtn.addEventListener('click',()=>{
    startBtn.disabled=true;
    startHandTracking().catch(()=>enableManualMode());
  });

  /* ---------- view open/close (lifecycle: stop camera on close) ---------- */
  function stopAll(){
    state.running=false;
    if(state.rafId)cancelAnimationFrame(state.rafId);
    state.rafId=null;
    try{ state.stream?.getTracks?.().forEach(t=>t.stop()); }catch(e){}
    state.stream=null;
    cursor.hidden=true;
  }
  function open(){
    view.classList.add('open');
    view.setAttribute('aria-hidden','false');
    document.body.classList.add('gesture-open');
    if(!canvas.width){ canvas.width=640; canvas.height=480; }
  }
  function close(){
    view.classList.remove('open');
    view.setAttribute('aria-hidden','true');
    document.body.classList.remove('gesture-open');
    stopAll();
  }
  document.addEventListener('click',e=>{
    if(e.target.closest('[data-gesture-close]')){e.preventDefault();close();}
  },true);
  document.addEventListener('keydown',e=>{
    if(e.key==='Escape'&&view.classList.contains('open'))close();
  });

  window.ZYREXGestureView={open,close};
})();
