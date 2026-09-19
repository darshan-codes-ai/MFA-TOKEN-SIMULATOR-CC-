# MFA Token Simulator — Web App

Local visual simulation of the ESP32 MFA token workflow.

## Run

Backend:

```bash
cd web/backend
npm install
npm start
```

Frontend:

```bash
cd web/frontend
npm install
npm run dev
```

Open http://localhost:5173

Demo login: `demo` / `mfa123`

The Vite dev server proxies `/api` to `http://localhost:3001`.
