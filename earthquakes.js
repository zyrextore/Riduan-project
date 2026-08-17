(()=>{
  const mapEl=document.getElementById('radarMap');
  if(!mapEl)return;
  const status=document.getElementById('radarStatus'),count=document.getElementById('radarCount'),search=document.getElementById('radarSearch'),detail=document.getElementById('radarDetail');
  let map=null,markers=new Map(),busy=false,timer=null,lastAt=0,allFeatures=[],userMarker=null,userAccuracy=null,userCoords=null;
  const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const setStatus=t=>{if(status)status.textContent=t};
  const nm=v=>String(v??'').trim();
  const magClass=m=>m>=6?'eq-strong':m>=4.5?'eq-medium':'eq-light';
  const keyOf=f=>f?.id||`${f?.geometry?.coordinates?.[0]}:${f?.geometry?.coordinates?.[1]}:${f?.properties?.time||''}`;
  const quakeIcon=m=>{
    const mag=Number(m||0);
    const size=Math.max(14,Math.min(42,14+mag*4));
    const label=Number.isFinite(mag)?mag.toFixed(1):'?';
    return window.L.divIcon({
      className:`earthquake-marker ${magClass(mag)}`,
      html:`<span class="eq-pulse" style="width:${size}px;height:${size}px"></span><b class="eq-label">${label}</b>`,
      iconSize:[Math.max(size,46),Math.max(size,46)],
      iconAnchor:[Math.max(size,46)/2,Math.max(size,46)/2]
    })
  };
  function showDetail(f){
    if(!detail)return;
    const p=f.properties||{},c=f.geometry?.coordinates||[];
    detail.hidden=false;
    detail.innerHTML=`<div class="radar-detail-head"><b>${esc(p.place||'EARTHQUAKE')}</b><button id="radarClose" class="app-btn" type="button">×</button></div><div class="radar-detail-grid"><span>MAGNITUDE</span><b>${p.mag==null?'—':esc(Number(p.mag).toFixed(1))}</b><span>DEPTH</span><b>${c[2]==null?'—':esc(Number(c[2]).toFixed(1))+' km'}</b><span>TIME</span><b>${p.time?esc(new Date(p.time).toLocaleString('id-ID')):'—'}</b><span>TYPE</span><b>${esc(p.type||'—')}</b><span>STATUS</span><b>${esc(p.status||'—')}</b><span>USGS</span><b><a href="${esc(p.url||'#')}" target="_blank" rel="noopener noreferrer">DETAIL ↗</a></b></div>`;
    detail.querySelector('#radarClose')?.addEventListener('click',()=>detail.hidden=true);
  }
  function showUserLocation(lat,lon,accuracy){
    if(!ensureMap()) return;
    userCoords=[lat,lon];
    if(userMarker){ userMarker.setLatLng([lat,lon]); } else {
      userMarker=window.L.marker([lat,lon],{icon:window.L.divIcon({className:'user-location-marker',html:'<span></span>',iconSize:[22,22],iconAnchor:[11,11]}),zIndexOffset:1000}).addTo(map);
      userMarker.bindPopup('<b>MY LOCATION</b>');
    }
    if(userAccuracy){ userAccuracy.setLatLng([lat,lon]).setRadius(Math.max(accuracy||0,25)); } else {
      userAccuracy=window.L.circle([lat,lon],{radius:Math.max(accuracy||0,25),className:'user-location-accuracy',weight:1,fillOpacity:.08}).addTo(map);
    }
  }
  function locateUser(){
    if(!window.isSecureContext && location.hostname!=='localhost'){ setStatus('LOCATION NEEDS HTTPS'); return; }
    if(!navigator.geolocation){setStatus('LOCATION UNSUPPORTED');return;}
    setStatus('REQUESTING LOCATION…');
    navigator.geolocation.getCurrentPosition(pos=>{
      const {latitude,longitude,accuracy}=pos.coords;
      ensureMap(); showUserLocation(latitude,longitude,accuracy);
      map?.setView([latitude,longitude], Math.max(map.getZoom(),7), {animate:true});
      setStatus(`LOCATION FOUND · ±${Math.round(accuracy)}M`);
      setTimeout(()=>setStatus(`LIVE · USGS · ${allFeatures.length}`),2500);
    },err=>{
      const msg=err?.code===1?'LOCATION PERMISSION DENIED':err?.code===2?'LOCATION UNAVAILABLE':'LOCATION TIMEOUT';
      setStatus(msg);
    },{enableHighAccuracy:true,timeout:15000,maximumAge:60000});
  }
  function ensureMap(){
    if(map||!window.L)return !!map;
    map=window.L.map(mapEl,{zoomControl:false,preferCanvas:true,worldCopyJump:true,zoomAnimation:false}).setView([-2.5,118],3);
    window.ZYREXRadarMap=map;
    window.L.control.zoom({position:'bottomright'}).addTo(map);
    window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'© OpenStreetMap contributors'}).addTo(map);
    return true;
  }
  function upsert(f){
    if(!ensureMap())return;
    const c=f.geometry?.coordinates||[],p=f.properties||[];
    if(c.length<2||c[0]==null||c[1]==null)return;
    const key=keyOf(f);let m=markers.get(key);
    if(!m){m=window.L.marker([c[1],c[0]],{icon:quakeIcon(p.mag),pane:'markerPane',zIndexOffset:200}).addTo(map);m.on('click',()=>showDetail(f));markers.set(key,m)}
    else{m.setLatLng([c[1],c[0]]);m.setIcon(quakeIcon(p.mag));m.off('click').on('click',()=>showDetail(f))}
    m._zyrex=f;
  }
  function sync(list){
    allFeatures=list.slice();
    if(ensureMap()){
      const seen=new Set();list.forEach(f=>{upsert(f);seen.add(keyOf(f))});
      for(const [key,m] of markers){if(!seen.has(key)){map.removeLayer(m);markers.delete(key)}}
    }
    if(count)count.textContent=String(list.length);
    const strongest=list.reduce((max,f)=>Math.max(max,Number(f?.properties?.mag)||0),0);
    const strongestEl=document.getElementById('radarStrongest');if(strongestEl)strongestEl.textContent=list.length?strongest.toFixed(1):'—';
    const updated=document.getElementById('radarUpdated');if(updated)updated.textContent=new Date().toLocaleTimeString('id-ID',{hour:'2-digit',minute:'2-digit'});
    applySearch();
  }
  function applySearch(){
    const q=nm(search?.value).toUpperCase();
    if(!map)return;
    for(const [,m] of markers){const p=m._zyrex?.properties||{};const hit=!q||nm(p.place).toUpperCase().includes(q)||nm(p.title).toUpperCase().includes(q);m.setOpacity(hit?1:.12)}
  }
  async function getFeed(q){
    const feed=q>=4.5?'4.5_day.geojson':q>=2.5?'2.5_day.geojson':q>=1?'1.0_day.geojson':'all_day.geojson';
    const urls=[
      `https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/${feed}?_=${Date.now()}`,
      `/.netlify/functions/earthquakes?minMagnitude=${encodeURIComponent(q)}&_=${Date.now()}`
    ];
    for(const url of urls){
      try{const r=await fetch(url,{cache:'no-store',headers:{accept:'application/geo+json,application/json'}});if(!r.ok)continue;const j=await r.json();if(Array.isArray(j.features))return j}catch{}
    }
    throw Error('USGS unavailable');
  }
  async function refresh(){
    if(busy||Date.now()-lastAt<800)return;
    busy=true;lastAt=Date.now();setStatus('SCANNING USGS…');
    try{
      const q=Number(document.getElementById('radarMagnitude')?.value||0);
      const features=await getFeed(q);
      sync(features.filter(f=>f?.geometry?.coordinates?.length>=2));
      setStatus(`LIVE · USGS · ${features.length}`);
    }catch(e){
      if(allFeatures.length)setStatus(`CACHED · ${allFeatures.length} EVENTS`);else setStatus('USGS TEMPORARILY UNAVAILABLE');
    }finally{busy=false}
  }
  if(!window.L){setStatus('MAP LIBRARY LOADING…');window.addEventListener('load',()=>{ensureMap();refresh()},{once:true})}else ensureMap();
  setTimeout(()=>{refresh();window.ZYREXRadarMap?.invalidateSize(true)},300);
  setInterval(refresh,30000);
  window.addEventListener('resize',()=>window.ZYREXRadarMap?.invalidateSize(true));
  document.getElementById('radarLocate')?.addEventListener('click',locateUser);
  search?.addEventListener('input',applySearch);
  document.getElementById('radarMagnitude')?.addEventListener('change',refresh);
  window.ZYREXRefreshRadar=refresh;
})();
