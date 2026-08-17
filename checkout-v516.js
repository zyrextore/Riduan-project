/**
 * ZYREX V516 Payment Checkout System
 * Complete payment flow with proof upload and Telegram notification
 */

let currentCheckoutStep = 1;
let proofImageBase64 = null;
let currentCheckoutOrder = null;

// Initialize checkout system
function initCheckout() {
  const uploadArea = document.getElementById('proofUploadArea');
  const fileInput = document.getElementById('proofFileInput');
  const changeBtn = document.getElementById('proofChangeBtn');
  const nextBtn = document.getElementById('checkoutNextBtn');
  const prevBtn = document.getElementById('checkoutPrevBtn');
  const submitBtn = document.getElementById('submitPaymentProofBtn');

  // Upload area click
  if (uploadArea) {
    uploadArea.addEventListener('click', () => fileInput?.click());
    
    // Drag & drop
    uploadArea.addEventListener('dragover', (e) => {
      e.preventDefault();
      uploadArea.classList.add('drag-over');
    });
    
    uploadArea.addEventListener('dragleave', () => {
      uploadArea.classList.remove('drag-over');
    });
    
    uploadArea.addEventListener('drop', (e) => {
      e.preventDefault();
      uploadArea.classList.remove('drag-over');
      if (e.dataTransfer.files.length) {
        handleFileSelect(e.dataTransfer.files[0]);
      }
    });
  }

  // File input change
  if (fileInput) {
    fileInput.addEventListener('change', (e) => {
      if (e.target.files.length) {
        handleFileSelect(e.target.files[0]);
      }
    });
  }

  // Change image button
  if (changeBtn) {
    changeBtn.addEventListener('click', () => {
      proofImageBase64 = null;
      updateProofPreview();
      fileInput?.click();
    });
  }

  // Navigation buttons
  if (nextBtn) {
    nextBtn.addEventListener('click', () => goToCheckoutStep(currentCheckoutStep + 1));
  }

  if (prevBtn) {
    prevBtn.addEventListener('click', () => goToCheckoutStep(currentCheckoutStep - 1));
  }

  if (submitBtn) {
    submitBtn.addEventListener('click', submitPaymentProof);
  }

  // Progress steps click
  document.querySelectorAll('.progress-step').forEach((step) => {
    step.addEventListener('click', () => {
      const stepNum = parseInt(step.dataset.step);
      goToCheckoutStep(stepNum);
    });
  });
}

// Handle file selection and validation
function handleFileSelect(file) {
  const maxSize = 5 * 1024 * 1024; // 5MB
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  
  // Validate file size
  if (file.size > maxSize) {
    showCheckoutError('File terlalu besar. Maksimal 5MB.', 'proofUploadStatus');
    return;
  }

  // Validate file type
  if (!allowedTypes.includes(file.type)) {
    showCheckoutError('Format file tidak didukung. Gunakan JPG, PNG, atau WebP.', 'proofUploadStatus');
    return;
  }

  // Read file as base64
  const reader = new FileReader();
  reader.onload = (e) => {
    proofImageBase64 = e.target.result;
    updateProofPreview();
    showCheckoutSuccess('Foto bukti pembayaran berhasil diunggah', 'proofUploadStatus');
  };
  
  reader.onerror = () => {
    showCheckoutError('Gagal membaca file. Silakan coba lagi.', 'proofUploadStatus');
  };

  reader.readAsDataURL(file);
}

// Update proof preview
function updateProofPreview() {
  const preview = document.getElementById('proofPreview');
  const uploadArea = document.getElementById('proofUploadArea');
  const previewImg = document.getElementById('proofPreviewImg');

  if (proofImageBase64) {
    previewImg.src = proofImageBase64;
    preview.style.display = 'flex';
    uploadArea.style.display = 'none';
  } else {
    preview.style.display = 'none';
    uploadArea.style.display = 'block';
  }
}

// Navigate checkout steps
function goToCheckoutStep(stepNum) {
  if (stepNum < 1 || stepNum > 6) return;

  // Validate current step before moving
  if (stepNum > currentCheckoutStep && !validateCheckoutStep(currentCheckoutStep)) {
    return;
  }

  currentCheckoutStep = stepNum;
  updateCheckoutDisplay();
}

// Validate current step
function validateCheckoutStep(step) {
  const statusEl = document.getElementById('proofUploadStatus');
  
  switch (step) {
    case 1: // Order summary
      return currentCheckoutOrder !== null;
    
    case 2: // Customer info
      const name = document.getElementById('checkoutName')?.value.trim();
      const phone = document.getElementById('checkoutPhone')?.value.trim();
      
      if (!name) {
        showCheckoutError('Nama tidak boleh kosong', 'customerInfoForm');
        return false;
      }
      if (!phone || phone.length < 10) {
        showCheckoutError('Nomor WhatsApp tidak valid', 'customerInfoForm');
        return false;
      }
      return true;
    
    case 4: // QRIS displayed
      return true;
    
    case 5: // Upload proof
      if (!proofImageBase64) {
        showCheckoutError('Silakan upload bukti pembayaran terlebih dahulu', 'proofUploadStatus');
        return false;
      }
      return true;
    
    case 6: // Final review
      return proofImageBase64 !== null;
    
    default:
      return true;
  }
}

// Update checkout display
function updateCheckoutDisplay() {
  // Hide all cards
  document.querySelectorAll('.checkout-card').forEach((card) => {
    card.classList.remove('active');
  });

  // Show current card
  const card = document.querySelector(`[data-step="${currentCheckoutStep}"]`);
  if (card) card.classList.add('active');

  // Update progress tracker
  document.querySelectorAll('.progress-step').forEach((step) => {
    const stepNum = parseInt(step.dataset.step);
    step.classList.toggle('active', stepNum === currentCheckoutStep);
  });

  // Update buttons visibility
  const nextBtn = document.getElementById('checkoutNextBtn');
  const prevBtn = document.getElementById('checkoutPrevBtn');
  const submitBtn = document.getElementById('submitPaymentProofBtn');

  if (prevBtn) {
    prevBtn.style.display = currentCheckoutStep > 1 ? 'block' : 'none';
  }

  if (nextBtn) {
    nextBtn.style.display = currentCheckoutStep < 6 ? 'block' : 'none';
  }

  if (submitBtn) {
    submitBtn.style.display = currentCheckoutStep === 6 ? 'block' : 'none';
  }

  // Render content for current step
  if (currentCheckoutStep === 1) {
    renderOrderSummary();
  } else if (currentCheckoutStep === 6) {
    renderFinalReview();
  }
}

// Render order summary
function renderOrderSummary() {
  const container = document.getElementById('checkoutOrderSummary');
  
  if (!currentCheckoutOrder) {
    container.innerHTML = '<p class="empty">Belum ada order. Silakan checkout dari cart.</p>';
    return;
  }

  const order = currentCheckoutOrder;
  const itemsHtml = order.items
    .map(item => `
      <div class="order-item">
        <div>
          <div class="order-item-name">${item.name}</div>
          <div class="order-item-qty">×${item.qty}</div>
        </div>
        <div class="order-item-price">Rp${(item.price * item.qty).toLocaleString('id-ID')}</div>
      </div>
    `)
    .join('');

  container.innerHTML = `
    ${itemsHtml}
    <div class="order-summary-total">
      <span>Total</span>
      <strong>Rp${order.total.toLocaleString('id-ID')}</strong>
    </div>
  `;
}

// Render final review
function renderFinalReview() {
  const container = document.getElementById('finalReview');

  if (!currentCheckoutOrder || !proofImageBase64) {
    container.innerHTML = '<p class="empty">Data belum lengkap</p>';
    return;
  }

  const name = document.getElementById('checkoutName')?.value || '-';
  const phone = document.getElementById('checkoutPhone')?.value || '-';
  const order = currentCheckoutOrder;

  container.innerHTML = `
    <div class="review-item">
      <div>
        <div class="review-item-label">Order ID</div>
        <div class="review-item-value">${order.id}</div>
      </div>
    </div>
    <div class="review-item">
      <div>
        <div class="review-item-label">Total</div>
        <div class="review-item-value">Rp${order.total.toLocaleString('id-ID')}</div>
      </div>
    </div>
    <div class="review-item">
      <div>
        <div class="review-item-label">Nama</div>
        <div class="review-item-value">${name}</div>
      </div>
    </div>
    <div class="review-item">
      <div>
        <div class="review-item-label">WhatsApp</div>
        <div class="review-item-value">${phone}</div>
      </div>
    </div>
    <div class="review-proof">
      <p>✓ Bukti pembayaran sudah disiapkan dan akan dikirim bersama order ini</p>
    </div>
  `;
}

// Submit payment proof
async function submitPaymentProof() {
  if (!currentCheckoutOrder || !proofImageBase64) {
    showCheckoutError('Data tidak lengkap', 'proofUploadStatus');
    return;
  }

  const name = document.getElementById('checkoutName')?.value.trim();
  const phone = document.getElementById('checkoutPhone')?.value.trim();
  const note = document.getElementById('checkoutNote')?.value.trim();

  const submitBtn = document.getElementById('submitPaymentProofBtn');
  const originalText = submitBtn.textContent;
  
  try {
    submitBtn.disabled = true;
    submitBtn.textContent = '⏳ Mengirim...';

    const response = await fetch('/.netlify/functions/submit-payment-proof', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        orderId: currentCheckoutOrder.orderId || currentCheckoutOrder.id,
        accessCode: currentCheckoutOrder.accessToken || sessionStorage.getItem('zyrex-access-'+currentCheckoutOrder.orderId) || '',
        proofImage: proofImageBase64,
        customerInfo: {
          name,
          phone,
          note
        },
        amount: currentCheckoutOrder.total
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Gagal mengirim bukti pembayaran');
    }

    // Success
    showCheckoutSuccess(
      '✓ Bukti pembayaran terkirim! Admin akan verifikasi dalam beberapa menit.',
      'proofUploadStatus'
    );

    // Update order status in localStorage
    updateLocalOrder(currentCheckoutOrder.orderId || currentCheckoutOrder.id, 'PENDING VERIFICATION');

    // Redirect after delay
    setTimeout(() => {
      document.getElementById('zx-track-id').value = currentCheckoutOrder.orderId || currentCheckoutOrder.id;
      document.getElementById('zx-track-token').value = sessionStorage.getItem('zyrex-access-'+(currentCheckoutOrder.orderId || currentCheckoutOrder.id)) || '';
      document.getElementById('zx-track-form')?.requestSubmit?.();
      resetCheckout();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 2000);

  } catch (error) {
    console.error('Payment proof submission error:', error);
    const localOrder=currentCheckoutOrder;
    if(localOrder && /Database belum|Cloud order storage|Storage bukti/i.test(error.message||'')){
      const msg=`Halo ZYREX!\n\nOrder: ${localOrder.orderId||localOrder.id}\nTotal: Rp${Number(localOrder.total||0).toLocaleString('id-ID')}\nNama: ${name||'-'}\nWhatsApp: ${phone||'-'}\n\nSaya sudah melakukan pembayaran QRIS. Saya kirim bukti pembayaran di chat ini.`;
      window.open('https://wa.me/6287757131994?text='+encodeURIComponent(msg),'_blank');
      showCheckoutSuccess('Order lokal siap. Lanjutkan konfirmasi + kirim bukti pembayaran lewat WhatsApp.', 'proofUploadStatus');
      updateLocalOrder(localOrder.orderId||localOrder.id,'PENDING VERIFICATION');
    } else {
      showCheckoutError(error.message || 'Gagal mengirim bukti pembayaran. Silakan coba lagi.', 'proofUploadStatus');
    }
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = originalText;
  }
}

// Helper: Update local order
function updateLocalOrder(orderId, newStatus) {
  const localOrders = Array.isArray(window.orders) ? window.orders : JSON.parse(localStorage.getItem('zyrex-orders') || '[]');
  if (localOrders.length) {
    const order = localOrders.find(o => (o.id||o.orderId) === orderId);
    if (order) {
      order.status = newStatus; order.orderStatus = newStatus;
      order.updatedAt = new Date().toISOString();
      localStorage.setItem('zyrex-orders', JSON.stringify(localOrders));
    }
  }
}

// Helper: Show error
function showCheckoutError(msg, elementId) {
  const el = document.getElementById(elementId);
  if (el) {
    el.innerHTML = `<div class="upload-status error show">${msg}</div>`;
  } else {
    console.error(msg);
  }
  toast(msg);
}

// Helper: Show success
function showCheckoutSuccess(msg, elementId) {
  const el = document.getElementById(elementId);
  if (el) {
    const statusEl = el.querySelector('.upload-status') || document.createElement('div');
    statusEl.className = 'upload-status show';
    statusEl.textContent = msg;
    el.appendChild(statusEl);
  }
  toast(msg);
}

// Reset checkout
function resetCheckout() {
  currentCheckoutStep = 1;
  proofImageBase64 = null;
  currentCheckoutOrder = null;
  
  document.getElementById('checkoutName').value = '';
  document.getElementById('checkoutPhone').value = '';
  document.getElementById('checkoutNote').value = '';
  document.getElementById('proofFileInput').value = '';
  
  updateProofPreview();
  updateCheckoutDisplay();
}

// Start checkout from order
function startCheckoutForOrder(orderId) {
  const localOrders = Array.isArray(window.orders) ? window.orders : JSON.parse(localStorage.getItem('zyrex-orders') || '[]');
  if (localOrders.length) {
    const order = localOrders.find(o => (o.id||o.orderId) === orderId);
    if (order) {
      currentCheckoutOrder = order;
      
      // Update sidebar
      document.getElementById('sidebarOrderId').textContent = order.orderId || order.id;
      document.getElementById('sidebarTotal').textContent = `Rp${order.total.toLocaleString('id-ID')}`;
      document.getElementById('checkoutQrisAmount').textContent = `Rp${order.total.toLocaleString('id-ID')}`;
      
      // Go to step 1
      goToCheckoutStep(1);
      
      // Scroll to checkout
      document.getElementById('payment-checkout')?.scrollIntoView({ behavior: 'smooth' });
      
      return true;
    }
  }
  
  showCheckoutError('Order tidak ditemukan', '');
  return false;
}

// Initialize on page load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initCheckout);
} else {
  initCheckout();
}
