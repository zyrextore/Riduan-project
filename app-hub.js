(()=>{
  const $=id=>document.getElementById(id);
  const prompt=$('aiPrompt'),out=$('aiOutput'),model=$('aiModel');
  const templates={
    debug:'Bantu debug kode berikut. Jelaskan penyebab error, tunjukkan bagian yang salah, lalu berikan patch paling ringan tanpa menghapus fitur lama. Kode:\n\n',
    build:'Bantu saya membuat fitur baru untuk project ZYREX. Prioritaskan mobile Android, performa ringan, keamanan server-side, dan jangan merusak fitur lama. Kebutuhan:\n\n',
    study:'Jelaskan materi berikut dengan bahasa Indonesia yang mudah dipahami siswa. Beri contoh dan ringkasan singkat. Materi:\n\n',
    idea:'Berikan 10 ide fitur yang benar-benar berguna untuk aplikasi ZYREX. Prioritaskan ringan, mobile-first, dan bisa dikerjakan bertahap. Konteks:\n\n'
  };
  document.querySelectorAll('[data-ai]').forEach(b=>b.addEventListener('click',()=>{prompt.value=templates[b.dataset.ai]||'';prompt.focus()}));
  $('aiAsk')?.addEventListener('click',async()=>{
    const text=(prompt.value||'').trim();
    if(!text){out.textContent='Tulis pertanyaan dulu.';prompt.focus();return}
    const btn=$('aiAsk'); btn.disabled=true; btn.textContent='THINKING…'; out.textContent='ZYREX AI sedang berpikir…';
    try{
      let r=await fetch('/.netlify/functions/ai',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({prompt:text,model:model?.value||'chat-model-reasoning'})});
      let raw=await r.text(); let data;
      try{data=JSON.parse(raw)}catch{data=null}
      // Public provider fallback: useful when a static host is serving an old API route.
      if(!data?.status){
        try{
          const u=new URL('https://elysian-api.vercel.app/.netlify/functions/ai/unlimited-ai.php');
          u.searchParams.set('prompt',text);u.searchParams.set('model',model?.value||'chat-model-reasoning');
          const rr=await fetch(u.toString(),{headers:{Accept:'application/json'}});
          const rt=await rr.text();
          try{data=JSON.parse(rt)}catch{data=null}
          if(!rr.ok||!data?.status) throw new Error(data?.error||'AI provider failed');
        }catch(fallbackErr){
          throw new Error(data?.error||fallbackErr.message||'AI request failed');
        }
      }
      const result=data.result??data.data??data.response??data.answer??data.text??data;
      out.textContent=typeof result==='string'?result:(result?.text||result?.answer||result?.content||JSON.stringify(result,null,2));
    }catch(e){out.textContent='AI error: '+e.message+'\n\nCoba lagi sebentar lagi.'}
    finally{btn.disabled=false;btn.textContent='ASK ZYREX AI'}
  });
  $('aiPrepare')?.addEventListener('click',()=>{const text=(prompt.value||'').trim();if(!text){out.textContent='Tulis kebutuhan dulu.';return}out.textContent='PROMPT SIAP:\n\n'+text+'\n\nJawab dengan langkah praktis, kode seperlunya, dan tetap prioritaskan performa mobile.'});
  $('aiCopy')?.addEventListener('click',async()=>{const text=out.textContent||prompt.value;if(!text)return;try{await navigator.clipboard.writeText(text);out.textContent+='\n\n✓ Copied.'}catch{}});
  $('aiClaude')?.addEventListener('click',()=>{const text=(out.textContent||prompt.value||'').trim();if(text)navigator.clipboard?.writeText(text).catch(()=>{});window.open('https://claude.ai/new','_blank','noopener,noreferrer')});
})();
