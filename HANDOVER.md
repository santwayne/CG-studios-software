# Handover: CG STUDIOS Order Desk (Arpan ke liye)

Arpan, yeh CG STUDIOS ke liye Order Desk ka **demo build** hai. CG STUDIOS ne proposal dekh ke demo maanga hai aur demo 1–2 din mein dikhana hai. Code ready hai aur tests pass ho rahe hain. Tumhara kaam: repo banana, deploy karna, Anthropic key lagana aur demo se pehle ek baar poora flow chala ke dekhna.

---

## 1. Yeh product karta kya hai

CG STUDIOS ko Instagram pe bahut orders aate hain, comments aur DMs mein. Order Desk ka kaam hai unko confirmed orders mein badalna:

1. Customer reel pe "Price?" comment karta hai → AI apne aap DM bhejta hai: price, kaunse colours stock mein hain, aur **Order now** button.
2. AI Hinglish mein baat karta hai: product, colour, COD ya UPI, naam, address aur pincode leta hai, phir order bana deta hai.
3. Order turant dashboard pe aa jaata hai (live, refresh ki zaroorat nahi).
4. COD order pe **Call to confirm** dabao → AI confirmation call (abhi simulated). **Try: no answer** dabao to order "On hold" ho jaata hai.
5. Team kabhi bhi **Take over chat** karke khud reply kar sakti hai, phir **Hand back to AI**.
6. Order aage badhta hai: Confirmed → Packed → Shipped → Delivered.

**Demo mein kya asli hai, kya simulated:**

| Part | Status |
|---|---|
| AI DM agent (Claude) | Asli, key lagte hi chalega |
| Dashboard, orders, chat takeover | Asli |
| CG STUDIOS products, prices, colours, photos | Asli, unki website se (Nov 2026) |
| Instagram | **Simulated**: screen ke left mein phone. Meta app approval ke baad asli hoga |
| COD confirmation call | **Simulated**: 3.5 second ka fake call. Phase 2 mein WayneRing se |
| Data | Memory mein, server restart pe reset |

---

## 2. Local pe chalao

Node 20+ chahiye.

```bash
cd server && npm install && npm run dev     # API: http://localhost:4000
cd web && npm install && npm run dev        # App: http://localhost:5173
```

Web app `/api` ko apne aap port 4000 pe bhej deta hai.

**Anthropic key nahi hai to bhi demo chalega.** Key na ho to ek scripted agent wahi flow chalata hai. Top-right pill dikhata hai kaunsa chal raha hai: "AI: Demo script" ya "AI: Claude".

Tests:

```bash
cd server && npm test     # 4 tests: COD order, out-of-stock colour, UPI order, size question → team
```

---

## 3. Repo banao

1. Wayneesolutions org mein naya repo banao (naam suggestion: `cg-studios-order-desk`, private).
2. Zip extract karo, phir:

```bash
cd cg-studios-order-desk
git init && git add -A && git commit -m "Order Desk demo for CG STUDIOS"
git branch -M main
git remote add origin git@github.com:Wayneesolutions/cg-studios-order-desk.git
git push -u origin main
```

`.env` file kabhi commit mat karna. `.gitignore` mein pehle se hai. Zip mein git history nahi hai, isliye `git init` se shuru karna hai.

---

## 4. Deploy karo

### API → Render
- Repo connect karo. `render.yaml` already hai (root `server/`), Blueprint se uthaa lega.
- Environment variables:

| Variable | Value |
|---|---|
| `ANTHROPIC_API_KEY` | Anthropic key (sirf Render mein, code mein kabhi nahi) |
| `AGENT_MODEL` | `claude-haiku-5-5` (default yahi hai; better replies chahiye to `claude-sonnet-5-5`) |
| `WEB_ORIGIN` | Vercel wala URL, jaise `https://cg-order-desk.vercel.app` |
| `IG_VERIFY_TOKEN` | Koi bhi random string (Instagram webhook ke liye, abhi zaroori nahi) |

- Check: `https://<render-url>/api/health` pe `{"ok":true,...}` aana chahiye.

### Web → Vercel
- Naya project, root directory `web/`.
- Env variable: `VITE_API_URL` = Render ka URL (end mein `/` nahi).
- Deploy ke baad pill mein "AI: Claude" dikhna chahiye. "Demo script" dikhe to Render pe key check karo.

**Dhyan do:** Render ka free plan 15 min idle ke baad so jaata hai, pehli request pe 30–50 sec lagte hain. Demo se 5 minute pehle site ek baar khol lena.

---

## 5. Code kahan kya hai

```
server/src/index.js     Saare API routes, simulated Instagram, COD call simulation, live updates (SSE)
server/src/agent.js     AI agent: Claude + 2 tools (create_order, handoff_to_staff), aur scripted fallback
server/src/store.js     Memory mein conversations, comments, orders; 2 purane orders seed hote hain
server/src/catalog.js   CG STUDIOS ke products, colours, stock, photos, policies, reels
server/test/            Flow tests
web/src/App.jsx         Customer ka phone (left) + Order Desk dashboard (right)
web/src/styles.css      Styling
```

- **Product badalna ho:** sirf `catalog.js` edit karo. Har product mein colours hain, har colour ka `inStock` aur photo URL. AI ka prompt catalogue se khud banta hai.
- **AI ka behaviour badalna ho:** `agent.js` mein `systemPrompt()`.
- **Reels badalni ho:** `catalog.js` mein `POSTS`.

---

## 6. Catalogue: kya pata hai, kya assume kiya

9 products daale hain jo website pe stock mein the: Banarsi Weaving Jacquard ₹1,995, Pashmina ₹795, Dori Paint ₹1,095, Velvet Tracksuit ₹565, Orpat Cordset ₹595, Korean Pant ₹665, Winter Fleece Legging ₹795, Flower Bunch ₹1,395, Rising Angels ₹1,395.

**Demo se pehle CG STUDIOS se confirm karna hai:**

- **COD:** website pe kahin nahi likha. Demo mein COD aur UPI dono hain.
- **Sizes:** website pe sizes nahi hain. Isliye size ka sawaal AI team ko pass kar deta hai.
- **₹1,000 se kam ka shipping charge:** published nahi hai. ₹1,000+ pe free express shipping hai (website se).
- **Instagram handle:** phone pe "cgstudios" likha hai. Yeh guess hai, asli handle pata karke `App.jsx` mein badal do.
- **Photos:** unki website se seedhe load hoti hain. Agar woh band karein to reel pe plain colour dikhega.

Policy: no exchange, no return (website se).

---

## 7. Demo kaise dikhana hai (5 minute)

1. **Reset demo** dabao (top-right).
2. Left phone pe customer `simran.k` chuno, Banarsi reel pe comment: `Price?` → 1 sec mein "DM sent" aur dashboard pe DM dikhega.
3. Phone pe **DMs** kholo. Reply karo: `Peacock chahiye` → `COD` → `Simran Kaur, 22 Model Town, Ludhiana 141002`.
4. Dashboard pe order **#CG-1044** aa jaayega. **Call to confirm** dabao → AI call → Confirmed.
5. Dikhane ke liye: `Rust wala chahiye` likho → AI bolega out of stock, Peacock ya Green le lo.
6. **Take over chat** dabao → team ki taraf se reply karo → **Hand back to AI**.
7. Order ko **Mark packed** → **Mark shipped** karo.

Claude key lagi ho to customer kuch bhi Hinglish mein likh sakta hai, AI samjhega. Scripted mode mein upar wale messages hi use karna.

---

## 8. Phase 2 (CG STUDIOS haan bole tab)

1. **Asli COD calls, WayneRing se.** WayneRing calling ab fix hai. Sirf ek jagah badalni hai: `server/src/index.js` mein `POST /api/orders/:id/cod-call`. Abhi woh 3.5 sec wait karke result set karta hai. Wahan WayneRing ka outbound call trigger karo, aur call result ke webhook se `store.updateOrder()` call karo (`codCall.status`: `confirmed` ya `no_answer`).
2. **Asli Instagram.** Meta app with Instagram API (Instagram Login), comments aur messages ke webhooks, private replies. Verify endpoint `GET /webhooks/instagram` already bana hai. Meta ke rules: customer ke last message ke 24 ghante tak hi reply; har comment pe ek private reply, 7 din ke andar. Doosre brands ke liye Advanced Access chahiye (App Review).
3. **Postgres** memory ki jagah, aur staff logins.
4. **Live stock:** unka store WooCommerce pe hai. Catalogue file ki jagah wahan se sync.
5. **Payment links** (gateway) aur courier booking/tracking.

---

## 9. Kuch atke to

- Dashboard update nahi ho raha → browser console mein `/api/stream` dekho; Render pe `WEB_ORIGIN` sahi hai ya nahi.
- AI reply nahi aa raha → Render logs mein `agent error`. Error aaye to agent apne aap scripted reply pe gir jaata hai, demo nahi rukega.
- CORS error → `WEB_ORIGIN` mein Vercel URL bilkul exact (https ke saath, end mein `/` nahi).
