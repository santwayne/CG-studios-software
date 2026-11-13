# Order Desk (CG STUDIOS demo)

Turns Instagram comments and DMs into confirmed orders. This is the **demo build** for CG STUDIOS: the order dashboard and AI DM agent are real; Instagram is simulated on screen so the flow can be shown before the Meta app is approved.

## What the demo shows

1. A customer comments "Price?" on a reel → an automatic DM goes out with price, colours in stock and an **Order now** button (comment-to-DM).
2. The AI replies in Hinglish, checks stock, collects colour, COD/UPI, name, address and pincode, and creates the order.
3. The order lands on the dashboard live. **Call to confirm** simulates the AI COD confirmation call (or **Try: no answer** to show an order put on hold).
4. Staff can **Take over chat** at any time and reply as the team, then hand back to AI.
5. Orders move through Confirmed → Packed → Shipped; the customer gets a WhatsApp-style dispatch message.

## Run locally

```bash
cd server && npm install && npm run dev      # API on :4000
cd web && npm install && npm run dev         # app on :5173 (proxies /api to :4000)
```

The AI agent uses Claude when `ANTHROPIC_API_KEY` is set (model from `AGENT_MODEL`). Without a key, a scripted agent runs the same flow, so the demo always works.

## Deploy

- **API → Render**: `render.yaml` (root `server/`). Set `ANTHROPIC_API_KEY` and `WEB_ORIGIN` (the Vercel URL).
- **Web → Vercel**: project root `web/`, set `VITE_API_URL` to the Render URL.

Data is in memory and resets when the API restarts (or with **Reset demo**). ## Catalogue

`server/src/catalog.js` holds 9 real CG STUDIOS products (names, prices, colours, in/out of stock, photos) taken from thecgstudios.com in November 2026. Photos load straight from their website. Before going live, confirm with CG STUDIOS:

- **COD**: their website doesn't mention it; the demo offers COD and UPI.
- **Sizes**: their website lists none, so the agent passes size questions to the team.
- **Shipping**: free express shipping above ₹1,000 (from their site); the charge below that isn't published.
- **Live stock**: production should sync from their WooCommerce store instead of this file.

## Layout

```
server/src/index.js     API routes, simulated Instagram endpoints, COD call simulation, live updates (SSE)
server/src/agent.js     AI DM agent (Claude with tools: create_order, handoff_to_staff) + scripted fallback
server/src/store.js     in-memory conversations, comments, orders
server/src/catalog.js   CG STUDIOS catalogue and policies
web/src/App.jsx         customer phone simulator + Order Desk dashboard
```

## Next, for production

- Instagram connector: Meta app with Instagram API (Instagram Login), webhooks for comments and messages, private replies. `GET /webhooks/instagram` already handles verification.
- Postgres instead of memory; staff logins.
- COD confirmation calls through WayneRing (calling now works) instead of the simulation: `POST /api/orders/:id/cod-call` is the one place to swap in.
- Payment links (gateway) and courier booking/tracking.
- Meta App Review for Advanced Access before onboarding other brands.

```bash
cd server && npm test
```
