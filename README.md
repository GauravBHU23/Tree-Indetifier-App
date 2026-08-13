# 🌳 Tree Identifier

Camera se tree/leaf/flower ki photo click karo → app automatically identify karta hai aur
botanical details (leaf, flower, fruit, bark, habit, branch, bud, seed, habitat, uses) +
description dikhata hai.

**100% FREE** — PlantNet (identify) + Wikipedia (details). Sirf ek free PlantNet key chahiye,
Wikipedia ko koi key nahi.

## 🌐 Live (Azure — deployed)

| | URL |
|-|-----|
| **App (frontend)** | https://green-forest-0725e4500.7.azurestaticapps.net |
| **API (backend)** | https://tree-id-api-1253.azurewebsites.net |

Azure "for Students" subscription, region `southeastasia`/`eastasia`, sab **free tier** (₹0).
Resource group: `tree-id-rg`. Redeploy ke liye niche DEPLOY.md dekho.

## 🔗 Carbon App handoff

Ye app **Delhi Tree Carbon Calculator** ke saath juda hua hai. Jab Carbon app ki
species dropdown me **OTHER** chuna jaata hai, wo is app ko aise kholta hai:

```
https://green-forest-0725e4500.7.azurestaticapps.net/?handoff=1&return=<carbon-app-origin>
```

Us mode me result screen par ek extra button aata hai — **"🌳 Use this species in
Carbon App"**. Dabate hi scanned species `postMessage` se wapas chala jaata hai
aur ye tab band ho jaata hai; surveyor ko naam dobara type nahi karna padta.

- Button **sirf** `?handoff=1&return=…` ke saath khulne par dikhta hai; normal
  use me app bilkul pehle jaisa hai.
- Result sirf **return origin** par bheja jaata hai (kabhi `"*"` par nahi), aur
  origin ek allow-list se check hota hai — dekho `src/services/handoff.ts`.
- Payload: `{ type:'tree-identified', commonName, scientificName,
  confidenceScore, wikipediaUrl }`.

Badlaav sirf do jagah: `src/services/handoff.ts` (naya) aur
`src/components/ResultCard.tsx` (button) + thoda CSS. Live site par kaam karne ke
liye `npm run build` + redeploy chahiye (dekho DEPLOY.md).

## ✨ Features
- 📷 **Camera capture** + 🖼️ **Gallery upload** (dono se identify)
- 🎯 **Top matches** — best guess + 3 aur possible matches with confidence
- 🕘 **Scan History** — pichle scans localStorage me save (offline), tap karke wapas kholo
- 🌙 **Dark / Light mode** toggle (preference save hoti hai)
- 📤 **Share** result (WhatsApp/anywhere) + 🔊 **Listen** (text-to-speech)
- 📲 **Installable PWA** (niche dekho)

### 📲 Installable App (PWA)
App ek **PWA** hai — phone/desktop pe **install** ho jaata hai (home screen icon,
standalone window, offline app-shell).
- **Android/Chrome**: site kholo → header me **"⬇️ Install app"** button, ya browser menu → *Install app*
- **iPhone/Safari**: Share button → *Add to Home Screen*
- Manifest (`vite-plugin-pwa`) + service worker build ke time auto-generate hote hain.
- Icons `public/app-icon.svg` se bante hain: `node scripts/gen-icons.mjs`.

## Architecture

| Layer | Tech | Kaam |
|-------|------|------|
| Frontend | React + Vite + TypeScript | Camera capture, auto-upload, result UI |
| Backend | ASP.NET Core 8 Web API | Image receive → identify → enrich → JSON |
| Identification | [PlantNet](https://my.plantnet.org/) API (free) | Photo se tree ka naam + confidence |
| Enrichment | [Wikipedia](https://en.wikipedia.org/api/rest_v1/) REST API (free, no key) | Naam se description + botanical parts |

### Flow
```
Camera → Capture (auto) → POST /api/identify
        → PlantNet (name)  → Wikipedia (details)  → Result card
```

> Note: Wikipedia se structured leaf/flower/bark alag-alag nahi milte — app summary text ko
> keyword-scan karke jo parts mil jaate hain wo fill kar deta hai, plus poora description dikhata hai.

## Project Structure
```
Plant Name App/
├── backend/                       ASP.NET Core Web API
│   ├── Controllers/IdentifyController.cs
│   ├── Services/PlantNetService.cs              (PlantNet — identify)
│   ├── Services/WikipediaPlantDetailService.cs  (Wikipedia — details)
│   ├── Models/TreeDetailDto.cs
│   └── appsettings.json                         (PlantNet key yahan)
└── frontend/                      React + Vite + TS
    ├── src/components/CameraCapture.tsx
    ├── src/components/ResultCard.tsx
    ├── src/services/api.ts
    └── src/App.tsx
```

## Prerequisites
- .NET 8 SDK
- Node.js 18+
- PlantNet API key (free) → https://my.plantnet.org/ → account banao → My account → Settings → API key

## Setup

### 1. API key
`backend/appsettings.json` me apni PlantNet key daalo (ya `backend/appsettings.Development.json` banao):
```json
{
  "Api": {
    "PlantNet": { "ApiKey": "YOUR_PLANTNET_KEY" }
  }
}
```
> Key ko git me commit mat karo. Chaho to environment variable use karo:
> `Api__PlantNet__ApiKey`. Wikipedia ko koi key nahi chahiye.

### 2. Backend
```bash
cd backend
dotnet run
```
API `http://localhost:5000` pe chalega (Swagger: `/swagger`).

### 3. Frontend
```bash
cd frontend
npm install
npm run dev
```
App `http://localhost:5173` pe khulega. Vite `/api` ko backend pe proxy karta hai.

## Usage
1. App kholo → camera permission allow karo.
2. **Capture & Identify** dabao → photo click hote hi automatically identify hota hai.
3. Result card me naam + full botanical details dikhta hai.
4. **Scan another tree** se dobara.

## Notes
- Backend ka default port `5000` hai; agar alag hai to `frontend/vite.config.ts` ka proxy target update karo.
- Camera ke liye HTTPS ya `localhost` chahiye (browsers `getUserMedia` sirf secure context me dete hain).
- Mobile pe camera na khule to `CameraCapture` ka file-picker fallback chal jaayega.
