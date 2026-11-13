// In-memory store for the demo. Every change is broadcast to the dashboard
// over server-sent events. Swap for Postgres when this goes to production.
import { EventEmitter } from 'node:events';
import { PRODUCTS, POSTS } from './catalog.js';

export const bus = new EventEmitter();
bus.setMaxListeners(100);

let db;
let orderSeq;

const now = () => new Date().toISOString();

export function reset() {
  orderSeq = 1042;
  db = {
    conversations: {},  // keyed by Instagram handle
    comments: [],
    orders: [],
  };
  seed();
  emit('reset');
}

function seed() {
  // A couple of earlier orders so the dashboard isn't empty on open.
  const past = [
    { handle: 'priya_23', name: 'Priya Sharma', city: 'Jaipur', pincode: '302001', productId: 'orpat-cordset', color: 'Black', payment: 'UPI', status: 'shipped' },
    { handle: 'neha.style', name: 'Neha Arora', city: 'Delhi', pincode: '110027', productId: 'banarsi-jacquard', color: 'Green', payment: 'COD', status: 'confirmed' },
  ];
  for (const p of past) {
    const prod = PRODUCTS.find(x => x.id === p.productId);
    db.orders.push({
      id: `CG-${orderSeq++}`, handle: p.handle, source: 'instagram',
      items: [{ productId: prod.id, name: prod.name, color: p.color, image: prod.colors.find(c => c.name === p.color)?.image, qty: 1, price: prod.price }],
      total: prod.price, payment: p.payment, customer: { name: p.name, address: `${p.city}`, pincode: p.pincode },
      status: p.status, createdAt: new Date(Date.now() - 1000 * 60 * 90).toISOString(), codCall: p.payment === 'COD' ? { status: 'confirmed', at: now() } : null,
      seeded: true,
    });
  }
}

export const state = () => ({
  conversations: Object.values(db.conversations).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
  comments: db.comments,
  orders: [...db.orders].sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
  products: PRODUCTS,
  posts: POSTS,
});

function emit(type, payload) { bus.emit('change', { type, payload, at: now() }); }

export function getConversation(handle) {
  if (!db.conversations[handle]) {
    db.conversations[handle] = {
      id: handle, handle, channel: 'instagram', mode: 'ai', messages: [],
      context: { productId: null }, createdAt: now(), updatedAt: now(), unread: 0,
    };
  }
  return db.conversations[handle];
}

export function addMessage(handle, from, text, extra = {}) {
  const c = getConversation(handle);
  const m = { id: `${handle}-${c.messages.length + 1}`, from, text, at: now(), ...extra };
  c.messages.push(m);
  c.updatedAt = m.at;
  if (from === 'customer') c.unread += 1;
  emit('message', { handle, message: m });
  return m;
}

export function setMode(handle, mode) {
  const c = getConversation(handle);
  c.mode = mode;
  c.updatedAt = now();
  emit('mode', { handle, mode });
  return c;
}

export function addComment(handle, text, postId) {
  const cm = { id: `cm-${db.comments.length + 1}`, handle, text, postId, at: now(), autoDm: false };
  db.comments.push(cm);
  emit('comment', cm);
  return cm;
}

export function markCommentReplied(id) {
  const cm = db.comments.find(c => c.id === id);
  if (cm) { cm.autoDm = true; emit('comment', cm); }
}

export function createOrder({ handle, product, color, qty = 1, payment, name, address, pincode }) {
  const order = {
    id: `CG-${orderSeq++}`, handle, source: 'instagram',
    items: [{ productId: product.id, name: product.name, color, image: product.colors.find(c => c.name === color)?.image, qty, price: product.price }],
    total: product.price * qty, payment, customer: { name, address, pincode },
    status: payment === 'COD' ? 'cod_pending' : 'awaiting_payment',
    createdAt: now(), codCall: null,
    paymentLink: payment === 'UPI' ? `https://pay.example/cg/${orderSeq}` : null,
  };
  db.orders.push(order);
  const c = getConversation(handle);
  c.lastOrderId = order.id;
  emit('order', order);
  return order;
}

export function updateOrder(id, patch) {
  const o = db.orders.find(x => x.id === id);
  if (!o) return null;
  Object.assign(o, patch);
  emit('order', o);
  return o;
}

export const getOrder = (id) => db.orders.find(x => x.id === id);

reset();
