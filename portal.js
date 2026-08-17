(function(){
  const form=document.getElementById('zx-track-form');
  const input=document.getElementById('zx-track-id');
  const tokenInput=document.getElementById('zx-track-token');
  const out=document.getElementById('zx-track-result');
  if(!form||!input||!out)return;
  const apiBase='/.netlify/functions/order-status';
  const esc=(v)=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const labels=['Created','Payment Review','Processing','Completed'];
  function render(o){
    const status=String(o.status||'PENDING PAYMENT').toUpperCase();
    const map={'PENDING PAYMENT':1,'PENDING VERIFICATION':2,'PAID':2,'PROCESSING':3,'COMPLETED':4,'REJECTED':1};
    const active=map[status]||1;
    const steps=Array.from({length:4},(_,i)=>`<i class="zx-step ${i<active?'on':''}"></i>`).join('');
    out.className='zx-order-card';
    out.innerHTML=`<div class="zx-status-row"><strong>${esc(o.orderId||o.id)}</strong><span class="zx-status-pill">${esc(status)}</span></div><div class="zx-steps">${steps}</div><div class="zx-order-meta"><div class="zx-meta-box">Customer<b>${esc(o.customerName||o.name||o.customer?.name||'—')}</b></div><div class="zx-meta-box">Total<b>${esc(o.totalDisplay||o.total||'—')}</b></div><div class="zx-meta-box">Payment<b>${esc(o.paymentMethod||o.customer?.payment||'QRIS')}</b></div><div class="zx-meta-box">Updated<b>${esc(o.updatedAt||o.createdAt||'—')}</b></div></div><div class="zx-portal-actions"><button type="button" id="zx-receipt">VIEW RECEIPT</button><button type="button" id="zx-share">SHARE STATUS</button></div><div id="zx-receipt-view" class="zx-receipt-view" hidden></div>`;
    document.getElementById('zx-receipt')?.addEventListener('click',()=>showReceipt(o));
    document.getElementById('zx-share')?.addEventListener('click',()=>shareStatus(o));
  }
  function showReceipt(o){
    const items=Array.isArray(o.items)?o.items:[];
    const lines=items.length?items.map(i=>`<div><span>${esc(i.name||i.title||'Item')} × ${esc(i.qty||1)}</span><b>${esc(i.totalDisplay||i.priceDisplay||i.price||'')}</b></div>`).join(''):'<div><span>ZYREX Order</span><b>—</b></div>';
    const box=document.getElementById('zx-receipt-view'); if(!box)return;
    box.hidden=false;
    box.innerHTML=`<div class="receipt-head"><span>ZYREX RECEIPT</span><b>${esc(o.orderId||o.id)}</b></div><div class="receipt-lines">${lines}</div><div class="receipt-total"><span>TOTAL</span><b>${esc(o.totalDisplay||o.total||'—')}</b></div><button type="button" id="zx-print">PRINT / SAVE PDF</button>`;
    document.getElementById('zx-print')?.addEventListener('click',()=>window.print());
  }
  async function shareStatus(o){
    const text=`ZYREX ORDER ${o.orderId||o.id}\nStatus: ${String(o.status||'PENDING PAYMENT').toUpperCase()}\nTotal: ${o.totalDisplay||o.total||'—'}`;
    try{if(navigator.share){await navigator.share({title:'ZYREX Order',text});return;}}catch{}
    try{await navigator.clipboard.writeText(text);alert('Status copied.');}catch{alert(text);}
  }
  form.addEventListener('submit',async e=>{
    e.preventDefault();
    const id=input.value.trim(); const token=(tokenInput?.value||'').trim(); if(!id||!token)return;
    out.className='zx-order-card'; out.textContent='Checking order status…';
    try{
      const r=await fetch(apiBase+'?id='+encodeURIComponent(id)+'&token='+encodeURIComponent(token),{headers:{Accept:'application/json'}});
      if(r.ok){const data=await r.json(); const order=data.order||data; if(order&&order.orderId){render(order);return;}}
    }catch{}
    out.className='zx-order-card zx-empty'; out.textContent='Order not found. Check the Order ID and try again.';
  });
  document.getElementById('zx-open-store')?.addEventListener('click',()=>window.ZYREXAppRouter?.openPage('store'));
  document.getElementById('zx-open-contact')?.addEventListener('click',()=>window.ZYREXAppRouter?.openPage('contact'));
})();
