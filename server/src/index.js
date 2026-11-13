import express from 'express';
import cors from 'cors';
import * as store from './store.js';
import { respond, commentToDm, agentMode } from './agent.js';
import { POSTS } from './catalog.js';

const app = express();
app.use(cors({ origin: process.env.WEB_ORIGIN?.split(',') || true }));
app.use(express.json());

const KEYWORDS = /\b(price|prize|rate|kitna|kitne|cost|details|link|dm|interested|available)\b/i;
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

app.get('/api/health', (_req, res) => res.json({ ok: true, agent: agentMode() }));
app.get('/api/state', (_req, res) => res.json({ ...store.state(), agent: agentMode() }));

// Live updates for the dashboard.
app.get('/api/stream', (req, res) => {
  res.set({ 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive' });
  res.flushHeaders();
  const send = (ev) => res.write(`data: ${JSON.stringify(ev)}\n\n`);
  store.bus.on('change', send);
  const ping = setInterval(() => res.write(': ping\n\n'), 20000);
  req.on('close', () => { clearInterval(ping); store.bus.off('change', send); });
});

// Simulated Instagram: a customer comments on a reel.
app.post('/api/comments', async (req, res) => {
  const { handle, text, postId } = req.body || {};
  if (!handle || !text) return res.status(400).json({ error: 'handle and text are required' });
  const post = POSTS.find(p => p.id === postId) || POSTS[0];
  const cm = store.addComment(handle, text, post.id);
  res.json(cm);
  if (KEYWORDS.test(text)) {
    await sleep(1200);
    commentToDm(handle, post);
    store.markCommentReplied(cm.id);
  }
});

// Simulated Instagram: a customer sends a DM.
app.post('/api/dm/:handle', async (req, res) => {
  const { handle } = req.params;
  const { text } = req.body || {};
  if (!text) return res.status(400).json({ error: 'text is required' });
  const m = store.addMessage(handle, 'customer', text);
  res.json(m);
  await sleep(900);
  await respond(handle, text);
});

// Staff actions.
app.post('/api/conversations/:handle/takeover', (req, res) => res.json(store.setMode(req.params.handle, 'staff')));
app.post('/api/conversations/:handle/release', (req, res) => res.json(store.setMode(req.params.handle, 'ai')));
app.post('/api/conversations/:handle/read', (req, res) => { const c = store.getConversation(req.params.handle); c.unread = 0; res.json(c); });
app.post('/api/conversations/:handle/staff', (req, res) => {
  const { text } = req.body || {};
  if (!text) return res.status(400).json({ error: 'text is required' });
  res.json(store.addMessage(req.params.handle, 'staff', text));
});

// COD confirmation call. In the demo the call is simulated; in production
// this triggers a WayneRing outbound call and its result comes back here.
app.post('/api/orders/:id/cod-call', async (req, res) => {
  const o = store.getOrder(req.params.id);
  if (!o) return res.status(404).json({ error: 'Order not found' });
  const outcome = req.body?.outcome === 'no_answer' ? 'no_answer' : 'confirmed';
  store.updateOrder(o.id, { codCall: { status: 'calling', at: new Date().toISOString() } });
  res.json({ ok: true });
  await sleep(3500);
  if (outcome === 'confirmed') {
    store.updateOrder(o.id, { status: 'confirmed', codCall: { status: 'confirmed', at: new Date().toISOString(), note: 'Customer said: haan ji, confirm' } });
    store.addMessage(o.handle, 'ai', `Thank you ji! Order #${o.id} confirm ho gaya. Dispatch hote hi tracking link bhejenge.`);
  } else {
    store.updateOrder(o.id, { status: 'on_hold', codCall: { status: 'no_answer', at: new Date().toISOString(), note: 'Not reachable after 2 tries. Not packed.' } });
  }
});

const NEXT = { awaiting_payment: 'paid', confirmed: 'packed', paid: 'packed', packed: 'shipped', shipped: 'delivered' };
app.post('/api/orders/:id/advance', (req, res) => {
  const o = store.getOrder(req.params.id);
  if (!o) return res.status(404).json({ error: 'Order not found' });
  const next = NEXT[o.status];
  if (!next) return res.status(400).json({ error: `Cannot advance from ${o.status}` });
  store.updateOrder(o.id, { status: next });
  if (next === 'shipped') store.addMessage(o.handle, 'ai', `Aapka order #${o.id} dispatch ho gaya ji! 4 se 6 din mein pahunch jayega.`);
  res.json(store.getOrder(o.id));
});

app.post('/api/reset', (_req, res) => { store.reset(); res.json({ ok: true }); });

// Placeholder for the real Instagram webhook (Meta Messaging API). Not active
// in the demo; verifies the subscription so the Meta app can be wired later.
app.get('/webhooks/instagram', (req, res) => {
  if (req.query['hub.verify_token'] && req.query['hub.verify_token'] === process.env.IG_VERIFY_TOKEN) return res.send(req.query['hub.challenge']);
  res.sendStatus(403);
});

const port = process.env.PORT || 4000;
app.listen(port, () => console.log(`Order Desk API on :${port} · agent: ${agentMode()}`));
