const CACHE='zyrex-v543-authgate';
const SHELL=['/','/index.html','/style.css','/script.js','/portal.js','/checkout-v516.js','/pwa.js','/assets/zyrex-icon.svg','/assets/icon-192.png','/assets/icon-512.png','/manifest.json'];
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(SHELL)).then(()=>self.skipWaiting()));});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',event=>{
 const req=event.request;
 const url=new URL(req.url);
 if(url.origin!==location.origin||url.pathname.startsWith('/.netlify/functions/')||req.method!=='GET') return;
 if(req.mode==='navigate'){
   event.respondWith(fetch(req).catch(()=>caches.match('/index.html'))); return;
 }
 event.respondWith(fetch(req).then(res=>{
   if(res.ok&&res.type==='basic'){const copy=res.clone();caches.open(CACHE).then(c=>c.put(req,copy)).catch(()=>{});} return res;
 }).catch(()=>caches.match(req)));
});
