# 🚀 Deployment Guide (Render + Vercel — always free)

Backend → **Render Free Web Service** (.NET 8, via Docker). Frontend → **Vercel**.
Dono hamesha-free hain, koi credit card ya trial expiry nahi — Azure free trial
khatam hone ke baad yeh switch kiya gaya hai.

> Pehle yeh app Azure App Service (F1 free) + Azure Static Web Apps pe thi.
> Azure ke free trial/credits khatam hone ke baad app down ho gayi thi.
> Woh GitHub Actions workflows (`.github/workflows/deploy-*.yml`) ab disabled
> hain (reference ke liye rakhe hain) — naya deploy Render/Vercel apne GitHub
> integration se khud karte hain, alag workflow ki zaroorat nahi.

---

## 🛠️ Maintenance Mode (update ke time use karo)

App me maintenance mode hai — jab aap update kar rahe ho, users ko error ke bajaye
ek friendly **"Maintenance chal raha hai"** screen dikhta hai.

**Kaise kaam karta hai:**
- **Manual**: backend pe `Maintenance__Enabled=true` set karo → `/api/identify` 503 deta hai,
  frontend maintenance screen dikhata hai. Health endpoint (`/api/health`) chalu rehta hai.
- **Auto**: agar backend down/slow ho (deploy ke beech, cold-start) → frontend khud detect
  karke maintenance screen dikha deta hai. Koi manual kaam nahi.

**Render pe set karne ke liye**: Dashboard → service → **Environment** →
`Maintenance__Enabled` = `true`/`false` → Save (service apne aap redeploy/restart ho jata hai).

> **Local dev me**: `backend/appsettings.json` me `"Maintenance": { "Enabled": true }`.
> Message change karna ho: `Maintenance__Message` set karo.

**Recommended update flow**: maintenance ON → push/deploy → verify → maintenance OFF.

---

## ⚠️ Free tier ka ek downside — cold start

Render ka **free** Web Service 15 min tak koi request na aane par **sleep** ho jata hai.
Agle request pe wake-up hone me ~30-60 sec lagte hain (pehla request slow lagega,
usme "Maintenance" screen bhi flash ho sakti hai — woh normal hai, retry karo).
Yeh Azure F1 jaisa hi tradeoff hai. Vercel frontend kabhi sleep nahi hota.

---

## Option A — Render + Vercel se deploy (Recommended)

### Step 1 — Code GitHub pe push karo (agar pehle se nahi hai)
```bash
cd "Plant Name App"
git add .
git commit -m "Switch deployment to Render + Vercel"
git push
```

### Step 2 — Backend: Render pe deploy karo
1. https://render.com pe signup/login karo (GitHub se login karna easiest hai)
2. **New → Web Service** → apna GitHub repo connect karo
3. Render repo me `render.yaml` dhoondh lega (Blueprint) — ya manually set karo:
   - **Runtime**: Docker
   - **Dockerfile Path**: `backend/Dockerfile`
   - **Docker Build Context**: `backend`
   - **Plan**: Free
4. **Environment** tab me add karo:
   - `Api__PlantNet__ApiKey` = `2b10PjE5drvzEYxb6Ps0JEQrgO`
   - `Cors__AllowedOrigins__0` = (frontend ka URL — Step 3 ke baad mil jayega, e.g. `https://xxx.vercel.app`)
5. **Create Web Service** → build/deploy shuru ho jayega. URL milega jaisे
   `https://tree-id-api.onrender.com`

### Step 3 — Frontend: Vercel pe deploy karo
1. https://vercel.com pe signup/login karo (GitHub se login)
2. **Add New → Project** → apna GitHub repo import karo
3. **Root Directory**: `frontend`
4. Framework preset: **Vite** (auto-detect ho jayega)
5. **Environment Variables** me add karo:
   - `VITE_API_BASE_URL` = `https://tree-id-api.onrender.com` (Step 2 ka backend URL)
6. **Deploy** → URL milega jaise `https://tree-id-app.vercel.app`

### Step 4 — CORS finalize
Render dashboard → backend service → **Environment** → `Cors__AllowedOrigins__0`
me Vercel ka final URL daal do (agar Step 2 me pata nahi tha) → Save
(auto-redeploy ho jayega).

### Step 5 — Auto-deploy on push
Dono Render aur Vercel GitHub repo se connected hain — ab jab bhi `main` branch
pe push karoge, dono automatically redeploy ho jayenge. Alag CI/CD setup ki
zaroorat nahi.

---

## Option B — CLI se manual deploy

```bash
# Backend: Render CLI ya dashboard se hi deploy karna aasan hai (Docker build).
# Local test:
cd backend
docker build -t tree-id-api .
docker run -p 10000:10000 -e Api__PlantNet__ApiKey=2b10PjE5drvzEYxb6Ps0JEQrgO tree-id-api

# Frontend: Vercel CLI
cd frontend
npm install -g vercel
npm install && npm run build
vercel --prod
```

---

## Cost note 💰
- **Render Free Web Service** + **Vercel Free** = **₹0**, hamesha, koi card nahi.
- Render free tier: 15 min idle → sleep, wake-up ~30-60 sec. Zyada traffic ya
  no-cold-start chahiye to Starter plan (~$7/month) pe upgrade.
- Vercel free tier: sleep nahi hota, generous bandwidth, hamesha free.

## Troubleshooting
- **Frontend se API call fail (CORS)** → Render backend ke `Cors__AllowedOrigins__0`
  me Vercel ka exact URL check karo (https, trailing slash na ho).
- **First request slow / maintenance flash** → cold start hai, normal hai, retry karo.
- **502 / identify fail** → Render service → Environment me `Api__PlantNet__ApiKey`
  set hai kya, confirm karo.
- **Backend build fail** → Render dashboard → service → **Logs** dekho.
