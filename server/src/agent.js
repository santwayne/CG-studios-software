// The AI DM agent. Uses Claude when ANTHROPIC_API_KEY is set; otherwise a
// scripted agent runs the same order flow so the demo always works.
import Anthropic from '@anthropic-ai/sdk';
import { BRAND, PRODUCTS, findProduct, findColor, inStockColors, isSingle, productLine } from './catalog.js';
import * as store from './store.js';

const MODEL = process.env.AGENT_MODEL || 'claude-haiku-5-5';
const client = process.env.ANTHROPIC_API_KEY ? new Anthropic() : null;
export const agentMode = () => (client ? `claude (${MODEL})` : 'scripted');

const rupees = (n) => `₹${Number(n).toLocaleString('en-IN')}`;

// ---------- Claude agent ----------
const TOOLS = [
  {
    name: 'create_order',
    description: 'Create the order once the customer has confirmed product, colour, payment method (COD or UPI), name, full address and 6-digit pincode.',
    input_schema: {
      type: 'object',
      properties: {
        product_id: { type: 'string', description: 'Catalogue id such as velvet-tracksuit' },
        color: { type: 'string', description: 'Colour name exactly as in the catalogue; "As shown" for single-colour designs' },
        qty: { type: 'integer', minimum: 1 },
        payment: { type: 'string', enum: ['COD', 'UPI'] },
        name: { type: 'string' },
        address: { type: 'string' },
        pincode: { type: 'string', pattern: '^[0-9]{6}$' },
      },
      required: ['product_id', 'color', 'payment', 'name', 'address', 'pincode'],
    },
  },
  {
    name: 'handoff_to_staff',
    description: 'Hand the chat to a CG STUDIOS team member: size or measurement questions, custom stitching, bulk orders, complaints, refunds, anything not in the catalogue or policies, or when the customer asks for a person.',
    input_schema: { type: 'object', properties: { reason: { type: 'string' } }, required: ['reason'] },
  },
];

function systemPrompt(conv) {
  const ctx = conv.context.productId ? `The customer came from a post about ${conv.context.productId}.` : '';
  return `You are the Instagram DM assistant for ${BRAND.name}, a women's clothing brand from Ludhiana (suits, pashmina, cordsets, winter wear).
Reply like a friendly shop assistant in short Hinglish (Roman script), 1 to 3 short sentences, the way the customer writes. Use "ji" politely.
Only use facts from this catalogue and policy. Never invent prices, sizes, stock, offers or delivery dates.
Catalogue (colour: in stock or out):
${PRODUCTS.map(p => `- ${p.id} | ${p.name} | ${rupees(p.price)} | ${p.category} | ${p.colors.map(c => `${c.name}${c.inStock ? '' : ' (out of stock)'}`).join(', ')}`).join('\n')}
Policy: ${BRAND.shipping}. ${BRAND.returns}. Payment by COD or UPI link. Website ${BRAND.website}.
${ctx}
To take an order collect: product, colour (must be in stock), COD or UPI, name, full address, pincode. Ask for missing details one or two at a time.
When everything is there, call create_order, then tell them the order number. For COD say they will get a short confirmation call. For UPI say a payment link is coming.
If a colour is out of stock, say so and offer the colours that are available.
Sizes are not listed in the catalogue: for size or measurement questions call handoff_to_staff.
Call handoff_to_staff for anything outside this, then tell the customer a team member will reply shortly.
Mention that you are ${BRAND.name}'s automated assistant in your first reply only.`;
}

function toClaudeMessages(conv) {
  const out = [];
  for (const m of conv.messages) {
    if (m.from === 'system') continue;
    const role = m.from === 'customer' ? 'user' : 'assistant';
    const last = out[out.length - 1];
    if (last && last.role === role) last.content += `\n${m.text}`;
    else out.push({ role, content: m.text });
  }
  while (out.length && out[0].role !== 'user') out.shift();
  return out;
}

async function claudeReply(handle) {
  const conv = store.getConversation(handle);
  const messages = toClaudeMessages(conv);
  for (let turn = 0; turn < 4; turn++) {
    const res = await client.messages.create({ model: MODEL, max_tokens: 400, system: systemPrompt(conv), tools: TOOLS, messages });
    if (res.stop_reason !== 'tool_use') {
      return res.content.filter(b => b.type === 'text').map(b => b.text).join('\n').trim();
    }
    messages.push({ role: 'assistant', content: res.content });
    const results = [];
    for (const b of res.content.filter(x => x.type === 'tool_use')) {
      results.push({ type: 'tool_result', tool_use_id: b.id, content: JSON.stringify(runTool(handle, b.name, b.input)) });
    }
    messages.push({ role: 'user', content: results });
  }
  return 'Ek minute ji, team member aapko reply karenge.';
}

function runTool(handle, name, input) {
  if (name === 'create_order') {
    const product = PRODUCTS.find(p => p.id === input.product_id);
    if (!product) return { error: 'Unknown product' };
    const color = isSingle(product) ? product.colors[0] : findColor(product, input.color);
    if (!color) return { error: `Unknown colour ${input.color}`, available: inStockColors(product) };
    if (!color.inStock) return { error: `${color.name} is out of stock`, available: inStockColors(product) };
    const order = store.createOrder({ handle, product, color: color.name, qty: input.qty || 1, payment: input.payment, name: input.name, address: input.address, pincode: input.pincode });
    return { order_id: order.id, total: order.total, payment: order.payment };
  }
  if (name === 'handoff_to_staff') {
    store.setMode(handle, 'staff');
    store.addMessage(handle, 'system', `Handed to team: ${input.reason}`);
    return { ok: true };
  }
  return { error: 'Unknown tool' };
}

// ---------- scripted agent ----------
const PIN_RE = /\b(\d{6})\b/;
const ORDER_WORDS = /\b(cod|cash|upi|online|gpay|paytm|phonepe|prepaid|chahiye|chaiye|wala|wali|colour|color|size)\b/gi;

function scriptedReply(handle, text) {
  const conv = store.getConversation(handle);
  const ctx = conv.context;
  const t = text.toLowerCase();
  const first = conv.messages.filter(m => m.from === 'ai').length === 0;
  const hello = first ? `Hi ji! ${BRAND.name} ka automated assistant. ` : '';

  if (/(human|person|call me|baat karni|manager|complaint|refund|custom|stitch|bulk|size chart|measurement|\bsize\b|\bxl\b|\bxxl\b)/.test(t)) {
    runTool(handle, 'handoff_to_staff', { reason: /size|xl|measure/.test(t) ? 'Size question' : 'Customer asked for a person or something outside the catalogue' });
    return `Theek hai ji, ${BRAND.name} ki team aapko thodi der mein reply karegi.`;
  }
  const p = findProduct(t);
  if (p && p.id !== ctx.productId) { ctx.productId = p.id; ctx.color = null; }
  const product = PRODUCTS.find(x => x.id === ctx.productId);

  if (/(deliver|kab tak|kitne din|shipping)/.test(t)) return `${hello}${BRAND.shipping}. ${product ? 'Order karna hai? Colour bata dijiye.' : ''}`.trim();
  if (/(return|exchange|wapas)/.test(t)) return `${hello}${BRAND.returns}.`;

  if (!product) {
    if (/(price|rate|kitna|cost|details|available)/.test(t) || first) {
      return `${hello}Kaunsa design pasand aaya? ${PRODUCTS.slice(0, 5).map(x => `${x.name} ${rupees(x.price)}`).join(' | ')}`;
    }
    return 'Design ka naam bata dijiye ji, main details bhejti hoon.';
  }

  if (isSingle(product)) ctx.color = product.colors[0].name;
  const hasPin = PIN_RE.test(text); // an address line can contain colour words (Green Park)
  const col = hasPin ? null : findColor(product, t);
  if (col) {
    if (col.inStock) ctx.color = col.name;
    else return `Sorry ji, ${product.name} ${col.name} abhi out of stock hai. Available: ${inStockColors(product).join(', ')}.`;
  }
  if (/\b(cod|cash)\b/.test(t)) ctx.payment = 'COD';
  if (/\b(upi|online|gpay|paytm|phonepe|prepaid)\b/.test(t)) ctx.payment = 'UPI';
  const pin = text.match(PIN_RE);
  if (pin && !ctx.pincode) {
    ctx.pincode = pin[1];
    const rest = text.replace(pin[1], '').replace(ORDER_WORDS, '').split(',').map(s => s.trim()).filter(Boolean);
    if (rest.length >= 2) { ctx.name = rest[0]; ctx.address = rest.slice(1).join(', '); }
    else if (rest.length === 1) ctx.address = rest[0];
  }

  if (!ctx.color) return `${hello}${productLine(product)} Kaunsa colour chahiye?`;
  if (!ctx.payment) return `${isSingle(product) ? `${hello}${productLine(product)} Available hai ji.` : `${ctx.color} available hai ji.`} COD chahiye ya UPI se pay karenge?`;
  if (!ctx.pincode) return 'Perfect! Apna naam, poora address aur pincode bhej dijiye.';
  if (!ctx.name) return 'Order kis naam pe banaun ji?';

  const order = store.createOrder({ handle, product, color: ctx.color, payment: ctx.payment, name: ctx.name, address: ctx.address || '', pincode: ctx.pincode });
  conv.context = { productId: null };
  const what = isSingle(product) ? product.name : `${product.name} (${ctx.color})`;
  const ship = order.total >= 1000 ? ' Free express shipping.' : '';
  return ctx.payment === 'COD'
    ? `Order #${order.id} ban gaya ji! ${what}, ${rupees(order.total)} COD.${ship} Packing se pehle ek chhoti si confirmation call aayegi.`
    : `Order #${order.id} ban gaya ji! ${rupees(order.total)} ka UPI payment link bhej rahe hain.${ship} Payment hote hi dispatch.`;
}

// ---------- public ----------
export async function respond(handle, latestText) {
  const conv = store.getConversation(handle);
  if (conv.mode !== 'ai') return null;
  let text;
  try {
    text = client ? await claudeReply(handle) : scriptedReply(handle, latestText);
  } catch (err) {
    console.error('agent error', err.message);
    text = scriptedReply(handle, latestText);
  }
  if (text) store.addMessage(handle, 'ai', text);
  return text;
}

export function commentToDm(handle, post) {
  const product = PRODUCTS.find(p => p.id === post.productId);
  const conv = store.getConversation(handle);
  conv.context.productId = product.id;
  const text = `Hi ji! Aapne ${product.name} ke baare mein poocha. ${productLine(product)} ${isSingle(product) ? 'Order karne ke liye reply kijiye 🙂' : 'Kaunsa colour chahiye? Reply kijiye 🙂'}`;
  store.addMessage(handle, 'ai', text, { kind: 'private_reply', button: 'Order now' });
  return text;
}
