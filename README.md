# Diet Coke — Kinetic Scroll Experience & Admin Command Center 🧊⚡

An award-winning Apple-style canvas scroll animation, interactive Silver Aesthetic Lookbook, and serverless Admin Order Dashboard for Diet Coke.

Flat retail price: **₹40 per 355ml Can** across all packs.

---

## ✨ Features

- **240-Frame Canvas Engine**: 60 FPS responsive `<canvas>` rendering with linear interpolation (`lerp`) dampening and Retina display support.
- **4 Cinematic Story Stages**:
  - `01. Rest`: Frosted can at rest, ice condensation, and nutrition specs.
  - `02. Burst`: High-velocity cola and ice splash eruption with physics HUD telemetry.
  - `03. Zero-G`: Bullet-time suspended ice cubes orbiting the silver silhouette.
  - `04. Settle`: Ice cubes settling into place with call-to-action controls.
- **Interactive Scrubber & Timeline Markers**: Live frame scrubber (`001 / 240`) and quick-jump buttons to any phase.
- **Cinematic Auto-Play Mode**: Smooth 60 FPS playback without needing to scroll.
- **Web Audio API Sound Design**: Pure synthesized audio feedback for carbonation fizz, tab cracking, and ice clinks.
- **Silver Aesthetic Showcase**:
  - Anatomy of Crispness (sensory engineering)
  - Interactive ASMR Audio Ritual (synthesized triggers)
  - Pinterest-style Silver Pinboard with bookmarking
  - Gastronomy Suite (Truffle Fries, Smash Burger, Dark Chocolate pairings)
  - Concierge Cold Reserve pack selector with interactive cart feedback
  - Brand Manifesto & Silver Circle newsletter signup

---

## ⚡ Pricing Standard (INR)

- **Flat Rate**: **₹40 / can**
- **The Chic Sleek 6-Pack**: **₹240** (6 Cans × ₹40)
- **Classic 12-Pack Chiller**: **₹480** (12 Cans × ₹40)
- **The Silver Subscription**: **₹960/mo** (24 Cans × ₹40)

---

## 🛠️ Backend & Serverless API Architecture

Pre-configured for Vercel Serverless Functions in `/api`:

- **`GET /api/orders`**: Retrieve live orders, total revenue (₹), and cans dispatched.
- **`POST /api/orders`**: Create a new customer order at ₹40/can.
- **`PATCH /api/orders`**: Advance order status (`Sub-Zero Chilled` -> `Out for Delivery` -> `Delivered`).
- **`GET /api/dashboard`**: Telemetry metrics, warehouse chiller temperatures (-2.4°C), and stock levels.
- **`POST /api/subscribe`**: Add email to the Silver Circle newsletter list.
- **Functional API Key**: `DC_PROD_LIVE_KEY_8204`

---

## 📊 Admin Dashboard

Access the real-time command center at:
👉 **`/dashboard.html`**

- Live order status progression (Chilled → Out for Delivery → Delivered).
- Interactive order creator modal with automatic ₹40/can pricing.
- API Key manager & live serverless latency ping test.
- Export orders dataset as JSON.

---

## 🚀 Local Development

Run with Python:
```bash
python3 -m http.server 3000
```
Open [http://localhost:3000](http://localhost:3000) or [http://localhost:3000/dashboard.html](http://localhost:3000/dashboard.html).

---

## 🌐 Vercel Deployment

Configured for one-click deployment on Vercel:
1. Import repository on [Vercel](https://vercel.com/new).
2. Framework: **Other**
3. Serverless functions in `/api` and static assets in `./` deploy automatically.
