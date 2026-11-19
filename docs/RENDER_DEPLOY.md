# Deploy CineSeat on Render (Free) — one service

Yes: you can deploy the **whole website as one Web Service** (API + React together).  
Do **not** use Docker on Render Free for this project.

## Create one Free Web Service

1. [dashboard.render.com](https://dashboard.render.com) → **New** → **Web Service**
2. Connect GitHub repo `Ticket-booking-System`
3. Settings:

| Field | Value |
| --- | --- |
| Name | `cineseat` |
| Language / Runtime | **Node** (not Docker) |
| Branch | `main` |
| Root Directory | *(leave empty — repo root)* |
| Build Command | `npm run build` |
| Start Command | `npm start` |
| Plan | **Free** |

4. Environment variables:

```text
NODE_ENV=production
MONGODB_URI=your-atlas-uri
JWT_SECRET=your-long-secret
JWT_EXPIRATION=7d
FIREBASE_WEB_API_KEY=your-firebase-web-api-key
CLIENT_URL=https://cineseat.onrender.com
ALLOWED_ORIGINS=https://cineseat.onrender.com
```

Replace `cineseat.onrender.com` with the URL Render shows after create (then redeploy once).

Frontend Firebase vars are optional for same-origin deploy if already baked at build time. To inject at build:

```text
VITE_REACT_APP_FIREBASE_API_KEY=...
VITE_REACT_APP_FIREBASE_AUTH_DOMAIN=...
VITE_REACT_APP_FIREBASE_PROJECT_ID=...
VITE_REACT_APP_FIREBASE_STORAGE_BUCKET=...
VITE_REACT_APP_FIREBASE_MESSAGING_SENDER_ID=...
VITE_REACT_APP_FIREBASE_APP_ID=...
VITE_REACT_APP_FIREBASE_MEASUREMENT_ID=...
```

Leave `VITE_API_URL` **unset** so the browser calls the same Render URL for API + Socket.IO.

5. **Create Web Service** → wait until Live.
6. Firebase → Authentication → Authorized domains → add `your-service.onrender.com`
7. Atlas Network Access → `0.0.0.0/0`

Open `https://your-service.onrender.com` — UI + API on one site.

## If Render picks Docker

Service → **Settings** → **Build & Deploy** → set runtime to **Node**.

## Notes

- Free API sleeps after ~15 minutes idle (cold start ~1 min).
- No separate frontend service needed.
- Local dev is still two processes: Backend + Frontend.
