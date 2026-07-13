# 🚀 Azure Deployment Guide

Backend → **Azure App Service** (.NET 8). Frontend → **Azure Static Web Apps**.
Deploy GitHub Actions se automatic hota hai (workflows already ready hain in `.github/workflows/`).

---

## 🛠️ Maintenance Mode (update ke time use karo)

App me maintenance mode hai — jab aap update kar rahe ho, users ko error ke bajaye
ek friendly **"Maintenance chal raha hai"** screen dikhta hai.

**Kaise kaam karta hai:**
- **Manual**: backend pe `Maintenance__Enabled=true` set karo → `/api/identify` 503 deta hai,
  frontend maintenance screen dikhata hai. Health endpoint (`/api/health`) chalu rehta hai.
- **Auto**: agar backend down/slow ho (deploy ke beech, cold-start) → frontend khud detect
  karke maintenance screen dikha deta hai. Koi manual kaam nahi.

**ON karne ke liye** (deployed app pe — update se pehle):
```bash
az webapp config appsettings set -g tree-id-rg -n tree-id-api-1253 --settings Maintenance__Enabled=true
az webapp restart -g tree-id-rg -n tree-id-api-1253
```

**OFF karne ke liye** (update ho jaane ke baad):
```bash
az webapp config appsettings set -g tree-id-rg -n tree-id-api-1253 --settings Maintenance__Enabled=false
az webapp restart -g tree-id-rg -n tree-id-api-1253
```

> ⚠️ Setting change ke baad **`az webapp restart` zaroor chalao** — warna flag turant apply nahi hota.
> Portal se bhi kar sakte ho: App Service → **Configuration** → `Maintenance__Enabled` → true/false → Save.
> **Local dev me**: `backend/appsettings.json` me `"Maintenance": { "Enabled": true }`.
> Message change karna ho: `Maintenance__Message` set karo.

**Recommended update flow**: maintenance ON → deploy backend/frontend → verify → maintenance OFF.

---

## ⚠️ Pehle ye 2 cheezein (blockers)

1. **C: drive space free karo** — abhi ~44 MB free hai. Azure CLI (~1 GB) aur `npm install` (~200 MB)
   ke liye kam se kam **~1.5 GB** chahiye. (Ya Azure CLI D:/E: drive pe install karo.)
2. **Azure account** chahiye — https://azure.microsoft.com/free (free tier available).

---

## Option A — GitHub Actions se deploy (Recommended)

### Step 1 — Code GitHub pe push karo
```bash
cd "Plant Name App"
git init
git add .
git commit -m "Tree Identifier app"
git branch -M main
git remote add origin https://github.com/<you>/<repo>.git
git push -u origin main
```
> `.gitignore` already API key (`appsettings.Development.json`) ko ignore karta hai — safe.

### Step 2 — Azure me resources banao (portal ya CLI)

**Backend — App Service:**
1. Azure Portal → **Create a resource → Web App**
2. Runtime: **.NET 8 (LTS)**, OS: **Linux**, Plan: **F1 (Free)** ya B1
3. Naam yaad rakho (e.g. `tree-id-api`) → URL banega `https://tree-id-api.azurewebsites.net`
4. Ban jaane ke baad → **Get publish profile** button → file download hoti hai (iska content chahiye)
5. App Service → **Configuration → Application settings** me add karo:
   - `Api__PlantNet__ApiKey` = `2b10PjE5drvzEYxb6Ps0JEQrgO`
   - `Cors__AllowedOrigins__0` = (frontend ka URL — Step 3 ke baad mil jayega, e.g. `https://xxx.azurestaticapps.net`)

**Frontend — Static Web App:**
1. Azure Portal → **Create a resource → Static Web App**
2. Plan: **Free**
3. Deployment: **Other** (GitHub Actions manually use kar rahe hain) → ya GitHub connect kar lo
4. Ban jaane ke baad → **Manage deployment token** → token copy karo
5. URL yaad rakho (e.g. `https://xxx.azurestaticapps.net`)

### Step 3 — GitHub repo me secrets/variables set karo
Repo → **Settings → Secrets and variables → Actions**:

| Type | Name | Value |
|------|------|-------|
| Secret | `AZURE_WEBAPP_PUBLISH_PROFILE` | Step 2 ki publish profile file ka **poora content** |
| Secret | `AZURE_STATIC_WEB_APPS_API_TOKEN` | Step 2 ka deployment token |
| Variable | `AZURE_WEBAPP_NAME` | App Service ka naam (e.g. `tree-id-api`) |
| Variable | `VITE_API_BASE_URL` | Backend URL (e.g. `https://tree-id-api.azurewebsites.net`) |

### Step 4 — Deploy trigger karo
```bash
git commit --allow-empty -m "trigger deploy"
git push
```
GitHub → **Actions** tab me dono workflows chalenge. Ho jaane ke baad:
- Backend live: `https://<AZURE_WEBAPP_NAME>.azurewebsites.net/swagger`
- Frontend live: Static Web App ka URL

### Step 5 — CORS finalize
Backend App Service → Configuration → `Cors__AllowedOrigins__0` me frontend ka final URL daal do
(agar Step 2 me nahi pata tha). Save → restart.

---

## Option B — Azure CLI se manual deploy (bina GitHub)

Azure CLI install hone ke baad:
```bash
az login

# Backend publish + deploy
az group create -n tree-id-rg -l centralindia
az appservice plan create -g tree-id-rg -n tree-id-plan --sku F1 --is-linux
az webapp create -g tree-id-rg -p tree-id-plan -n tree-id-api --runtime "DOTNETCORE:8.0"
az webapp config appsettings set -g tree-id-rg -n tree-id-api --settings \
  Api__PlantNet__ApiKey=2b10PjE5drvzEYxb6Ps0JEQrgO

dotnet publish backend/TreeIdentifier.Api.csproj -c Release -o publish
cd publish && zip -r ../app.zip . && cd ..
az webapp deploy -g tree-id-rg -n tree-id-api --src-path app.zip --type zip

# Frontend (Static Web Apps CLI ya portal se — build pehle)
cd frontend
# set VITE_API_BASE_URL in .env.production first
npm install && npm run build
npx @azure/static-web-apps-cli deploy ./dist --deployment-token <TOKEN>
```

---

## Cost note 💰
- **App Service F1** + **Static Web Apps Free** = **₹0** (free tiers).
- F1 me thodi limitations hain (cold start, 60 min/day compute) par testing/demo ke liye kaafi.
- Zyada traffic → B1 (~₹1000/month) pe upgrade.

## Troubleshooting
- **Frontend se API call fail (CORS)** → backend ke `Cors__AllowedOrigins__0` me frontend URL check karo.
- **502 / identify fail** → App Service Configuration me `Api__PlantNet__ApiKey` set hai kya, confirm karo.
- **Backend 500 on start** → App Service → Log stream dekho.
