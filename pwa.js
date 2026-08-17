(function(){
  let deferred;
  window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferred=e;document.documentElement.classList.add('pwa-installable');});
  window.addEventListener('appinstalled',()=>{deferred=null;document.documentElement.classList.remove('pwa-installable');});
  window.installZYREX=async function(){if(!deferred)return false;deferred.prompt();const r=await deferred.userChoice;deferred=null;return r.outcome==='accepted';};
  if('serviceWorker' in navigator) window.addEventListener('load',()=>{
    const hadController=!!navigator.serviceWorker.controller;
    navigator.serviceWorker.register('/sw.js',{updateViaCache:'none'}).then(reg=>{
      reg.update().catch(()=>{});
      reg.addEventListener('updatefound',()=>{
        const nw=reg.installing;
        nw?.addEventListener('statechange',()=>{
          if(nw.state==='activated' && hadController) location.reload();
        });
      });
    }).catch(()=>{});
  });
})();
