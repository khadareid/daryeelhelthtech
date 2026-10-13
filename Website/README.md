# Daryeel Website

React + TypeScript + Vite frontend for the Daryeel health platform.

## Setup

```bash
cd Website
npm install
npm run dev
```

Runs on http://localhost:5173 and talks to `VITE_API_URL` (default `http://localhost:5000/api/v1`).

## Portals

- Public: `/`
- Auth: `/login` `/register`
- Patient: `/patient/dashboard`
- Provider: `/provider/dashboard`
- Tenant: `/tenant/dashboard`
- Admin: `/admin/dashboard`

Seed users from the Backend (`hodan@example.so` / `Patient@123`, etc.).
