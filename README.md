# PawBridge — animal emergency & welfare frontend (fresh build)

A completely fresh frontend for **PawBridge**, built against the existing
backend in `sanikasharma07/Animal-Lifeline` (`main` @ `80378a9`). The backend
is **read-only** for this project: never modify it from here.

## Stack

React + Vite, React Router, Tailwind CSS v4, axios, Leaflet + react-leaflet,
lucide-react. Payments use the Razorpay Checkout script loaded at runtime;
the backend returns the publishable key with every order, so the frontend
holds no secrets.

## Run

```bash
npm install
npm run dev      # Vite dev server
npm run build    # production build (must pass before any phase is done)
```

Backend base URL: `VITE_API_URL`, default `http://localhost:5000/api/v1`.
Run the backend on port 5000, and set its `CORS_ORIGIN` to the dev-server
origin if it differs from `http://localhost:3000`.

## Rules (from the Rebuild Guide — non-negotiable)

- No mock data, no fallback data on API failure, no fake success.
- No invented numbers, features, locations, or photos.
- Only `GET /api/v1/nearby/help` is public; every other data page shows an
  honest sign-in state to logged-out visitors.
- External OpenStreetMap listings in Nearby Help are always labelled
  "Not registered on Animal Lifeline" and can never accept rescues.
- Never commit a `.env` file. The frontend needs no secrets at all.

## Build order

Phase 0 scaffold → Phase 1 auth → Phase 2 Nearby Help → Phase 3 emergency →
Phase 4 NGO + vet → Phase 5 donations + supplies → Phase 6 volunteer +
foster/adoption + impact → Phase 7 notifications + reports + admin →
Phase 8 design polish + accessibility. One commit per phase, production
build passing before moving on.
