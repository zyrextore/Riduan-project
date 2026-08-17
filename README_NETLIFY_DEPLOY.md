# 🚀 ZYREX - Netlify Deployment Guide

Ini adalah ZYREX yang sudah siap deploy ke Netlify!

---

## ✅ Apa yang Sudah Dikonfigurasi?

- ✅ `netlify.toml` - Konfigurasi Netlify
- ✅ `.netlify/functions/` - Semua API functions
- ✅ Semua API calls sudah di-update: `/api/` → `/.netlify/functions/`
- ✅ `package.json` - Updated untuk Netlify
- ✅ `_storage.js` - Storage abstraction (S3 + Netlify Blobs)

---

## 🚀 Deployment (3 Langkah)

### Step 1: Push ke GitHub

```bash
git init
git add .
git commit -m "Initial commit: ZYREX ready for Netlify"
git remote add origin https://github.com/YOUR_USERNAME/zyrex.git
git push -u origin main
```

### Step 2: Connect ke Netlify Dashboard

1. Buka [Netlify](https://netlify.com)
2. Login/Sign up
3. Click **"Add new site"** → **"Import an existing project"**
4. Select **GitHub** (atau GitLab/Bitbucket)
5. Choose repository: `zyrex`
6. Click **Deploy**

### Step 3: Set Environment Variables

Di **Netlify Dashboard** → **Site settings** → **Build & deploy** → **Environment**:

Tambahkan variables:
```
UPSTASH_REDIS_REST_URL = [Upstash Redis URL]
UPSTASH_REDIS_REST_TOKEN = [Upstash Redis Token]
ZYREX_ADMIN_PASSWORD = [Admin password]
ZYREX_ADMIN_SESSION_SECRET = [Random secret string]
STORAGE_TYPE = s3
AWS_ACCESS_KEY_ID = [AWS Key]
AWS_SECRET_ACCESS_KEY = [AWS Secret]
AWS_S3_BUCKET = [S3 Bucket Name]
AWS_REGION = us-east-1
TELEGRAM_BOT_TOKEN = (optional)
TELEGRAM_CHAT_ID = (optional)
```

---

## ✨ Perbedaan dari Vercel

| Vercel | Netlify |
|--------|---------|
| `/api/` | `/.netlify/functions/` |
| `vercel.json` | `netlify.toml` |
| `/api/` folder | `.netlify/functions/` folder |
| `@vercel/blob` | `_storage.js` |

**Semua sudah diupdate di project ini!**

---

## 📁 Project Structure

```
zyrex-complete/
├── netlify.toml           ← Konfigurasi Netlify
├── package.json           ← Updated untuk Netlify
├── index.html             ← Main page
├── admin.html             ← Admin panel
├── style.css              ← Styles
├── script.js              ← Main JS (API calls updated)
├── admin.js               ← Admin JS (API calls updated)
├── portal.js              ← Portal JS (API calls updated)
├── checkout-v516.js       ← Checkout JS (API calls updated)
├── app-hub.js             ← App hub JS (API calls updated)
├── earthquakes.js         ← Earthquake JS (API calls updated)
├── sw.js                  ← Service worker (API calls updated)
├── pwa.js                 ← PWA JS
├── gesture-canvas.js      ← Gesture canvas
├── manifest.json          ← PWA manifest
├── assets/                ← Images & icons
│   ├── hero-bg.webp
│   ├── qris.webp
│   └── ... (lainnya)
├── .netlify/functions/    ← Serverless functions
│   ├── _storage.js        ← Storage abstraction
│   ├── _auth.js
│   ├── _redis.js
│   ├── create-order.js
│   ├── login.js
│   ├── admin-login.js
│   ├── submit-payment-proof.js (updated)
│   └── ... (lainnya)
└── .gitignore             ← Git ignore file
```

---

## 🧪 Testing Lokal

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Buka http://localhost:8888
# Test semua fitur
```

---

## 📝 Important Notes

### 1. API Calls Sudah Diupdate
Semua file JS sudah di-update dari `/api/` → `/.netlify/functions/`

Jika menambah API endpoint baru, gunakan:
```javascript
fetch('/.netlify/functions/endpoint-name', {
  method: 'POST',
  body: JSON.stringify(data)
})
```

### 2. Storage Configuration
Pilih satu:
- **AWS S3** (recommended) - More reliable
- **Netlify Blobs** - Native solution

### 3. Environment Variables
Set di Netlify Dashboard, bukan di `.env` file untuk production.

### 4. Database
Redis via Upstash tetap sama, tidak ada perubahan.

---

## 🆘 Troubleshooting

### ❌ Page Not Found (404)
Ini berarti files tidak ter-deploy dengan benar.

**Fix:**
- Pastikan `netlify.toml` publish = "."
- Pastikan semua static files ada di root folder
- Trigger redeploy di Netlify Dashboard

### ❌ API Error
Kemungkinan:
- API calls masih menggunakan `/api/` (harus `/.netlify/functions/`)
- Environment variables tidak ter-set
- Redis/S3 credentials wrong

**Fix:**
- Check browser console untuk error details
- Verify environment variables di Netlify Dashboard
- Check Netlify function logs

### ❌ CORS Error
Sudah dikonfigurasi di `netlify.toml`:
```toml
[[headers]]
  for = "/.netlify/functions/*"
  [headers.values]
    Access-Control-Allow-Origin = "*"
```

Jika masih error, check CORS headers di function responses.

---

## 🔗 Useful Links

- [Netlify Docs](https://docs.netlify.com/)
- [Netlify Functions](https://docs.netlify.com/functions/overview/)
- [Netlify Env Variables](https://docs.netlify.com/configure-builds/environment-variables/)
- [Netlify TOML Reference](https://docs.netlify.com/configure-builds/file-conventions/)

---

## ✅ Deployment Checklist

Sebelum deploy:
- [ ] Push ke GitHub
- [ ] Connect ke Netlify Dashboard
- [ ] Set environment variables
- [ ] Trigger deploy
- [ ] Wait for deployment (2-5 minutes)
- [ ] Check Netlify deploy logs
- [ ] Test main page loads (no 404)
- [ ] Test API calls work
- [ ] Test admin page works
- [ ] Test checkout flow

---

**Status**: ✅ Ready to deploy!

**Next**: Push to GitHub and connect to Netlify 🚀
