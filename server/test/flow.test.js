import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as store from '../src/store.js';
import { commentToDm, respond } from '../src/agent.js';
import { POSTS } from '../src/catalog.js';

const chat = async (h, lines) => {
  let last;
  for (const t of lines) { store.addMessage(h, 'customer', t); last = await respond(h, t); }
  return last;
};

test('comment to DM to COD order, scripted agent', async () => {
  store.reset();
  commentToDm('test.user', POSTS[0]);
  const reply = await chat('test.user', ['Peacock chahiye', 'COD', 'Test User, 12 Green Park, Jalandhar 144003']);
  const order = store.state().orders.find(o => o.handle === 'test.user');
  assert.ok(order, 'order created');
  assert.equal(order.status, 'cod_pending');
  assert.equal(order.items[0].name, 'Banarsi Weaving Jacquard');
  assert.equal(order.items[0].color, 'Peacock');
  assert.equal(order.customer.pincode, '144003');
  assert.equal(order.customer.name, 'Test User');
  assert.match(reply, /Free express shipping/);
});

test('out-of-stock colour is refused', async () => {
  store.reset();
  commentToDm('rust.user', POSTS[0]);
  const reply = await chat('rust.user', ['Rust wala chahiye']);
  assert.match(reply, /out of stock/);
  assert.match(reply, /Peacock, Green/);
});

test('product found by name in a fresh DM, UPI order', async () => {
  store.reset();
  await chat('new.user', ['hi price?', 'velvet tracksuit lavender', 'upi', 'Riya, 4 Sarabha Nagar, Ludhiana 141001']);
  const order = store.state().orders.find(o => o.handle === 'new.user');
  assert.equal(order.items[0].color, 'Lavender');
  assert.equal(order.status, 'awaiting_payment');
});

test('size question goes to staff', async () => {
  store.reset();
  commentToDm('size.user', POSTS[1]);
  await chat('size.user', ['XL size milega?']);
  assert.equal(store.getConversation('size.user').mode, 'staff');
});
