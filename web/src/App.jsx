import React, { useEffect, useMemo, useRef, useState } from 'react';

const API = import.meta.env.VITE_API_URL || '';
const post = (path, body) => fetch(`${API}${path}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body || {}) }).then(r => r.json());
const rupees = (n) => `₹${Number(n).toLocaleString('en-IN')}`;
const time = (iso) => new Date(iso).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' });

const STATUS = {
  cod_pending: { label: 'Needs COD call', tone: 'amber' },
  awaiting_payment: { label: 'Waiting for UPI', tone: 'amber' },
  confirmed: { label: 'Confirmed', tone: 'mint' },
  paid: { label: 'Paid', tone: 'mint' },
  on_hold: { label: 'On hold', tone: 'coral' },
  packed: { label: 'Packed', tone: 'plum' },
  shipped: { label: 'Shipped', tone: 'plum' },
  delivered: { label: 'Delivered', tone: 'ink' },
};
const NEXT_LABEL = { awaiting_payment: 'Mark paid', confirmed: 'Mark packed', paid: 'Mark packed', packed: 'Mark shipped', shipped: 'Mark delivered' };
const PERSONAS = ['simran.k', 'aman.kaur', 'riya.m', 'jas.sandhu'];

function useDesk() {
  const [s, setS] = useState(null);
  const load = () => fetch(`${API}/api/state`).then(r => r.json()).then(setS).catch(() => {});
  useEffect(() => {
    load();
    const es = new EventSource(`${API}/api/stream`);
    let t;
    es.onmessage = () => { clearTimeout(t); t = setTimeout(load, 80); };
    return () => es.close();
  }, []);
  return [s, load];
}

export default function App() {
  const [s, reload] = useDesk();
  const [persona, setPersona] = useState(PERSONAS[0]);
  const [selected, setSelected] = useState(null);
  if (!s) return <div className="loading">Connecting to Order Desk…</div>;

  const today = s.orders.length;
  const codWaiting = s.orders.filter(o => o.status === 'cod_pending').length;
  const aiMsgs = s.conversations.flatMap(c => c.messages).filter(m => m.from === 'ai').length;
  const staffMsgs = s.conversations.flatMap(c => c.messages).filter(m => m.from === 'staff').length;
  const aiShare = aiMsgs + staffMsgs ? Math.round((aiMsgs / (aiMsgs + staffMsgs)) * 100) : 100;
  const active = selected || s.conversations[0]?.handle;

  return (
    <div className="app">
      <section className="stage" aria-label="Customer's Instagram, simulated">
        <div className="stage-head">
          <p className="stage-title">Customer's phone</p>
          <p className="stage-sub">Simulated Instagram for the demo. Type as a customer.</p>
          <label className="persona">Customer
            <select id="persona" value={persona} onChange={e => setPersona(e.target.value)}>
              {PERSONAS.map(p => <option key={p}>{p}</option>)}
            </select>
          </label>
        </div>
        <Phone s={s} persona={persona} />
      </section>

      <main className="desk">
        <header className="desk-top">
          <div className="brand"><span className="mark">OD</span><div><h1>Order Desk</h1><p>CG STUDIOS</p></div></div>
          <div className="top-right">
            <span className="agent-pill" title="AI that replies to DMs">AI: {s.agent.startsWith('claude') ? 'Claude' : 'Demo script'}</span>
            <button className="ghost" onClick={() => post('/api/reset').then(reload)}>Reset demo</button>
          </div>
        </header>

        <div className="stats">
          <Stat n={today} label="Orders today" />
          <Stat n={codWaiting} label="Waiting for COD call" warn={codWaiting > 0} />
          <Stat n={`${aiShare}%`} label="Replies sent by AI" />
          <Stat n={s.comments.filter(c => c.autoDm).length} label="Comments turned into DMs" />
        </div>

        <div className="cols">
          <Orders orders={s.orders} onOpenChat={setSelected} />
          <Chats s={s} active={active} onSelect={setSelected} />
        </div>
      </main>
    </div>
  );
}

function Stat({ n, label, warn }) {
  return <div className={`stat ${warn ? 'warn' : ''}`}><b>{n}</b><span>{label}</span></div>;
}

// ---------------- Orders ----------------
function Orders({ orders, onOpenChat }) {
  return (
    <section className="panel orders">
      <div className="panel-head"><h2>Orders</h2><span className="hint">New orders appear here the moment the AI creates them</span></div>
      <ul className="order-list">
        {orders.map(o => <OrderRow key={o.id} o={o} onOpenChat={onOpenChat} />)}
      </ul>
    </section>
  );
}

function OrderRow({ o, onOpenChat }) {
  const st = STATUS[o.status] || { label: o.status, tone: 'ink' };
  const item = o.items[0];
  const calling = o.codCall?.status === 'calling';
  return (
    <li className={`order ${o.seeded ? '' : 'fresh'}`}>
      <div className="o-main">
        <div className="o-line1"><b>#{o.id}</b><span className={`pill ${st.tone}`}>{st.label}</span><span className="o-time">{time(o.createdAt)}</span></div>
        <div className="o-line2">{item.name}{item.color && item.color !== 'As shown' ? ` · ${item.color}` : ''} · {rupees(o.total)} · {o.payment}</div>
        <div className="o-line3">
          <button className="link" onClick={() => onOpenChat(o.handle)}>@{o.handle}</button>
          {o.customer?.name && <span>{o.customer.name}, {o.customer.address} {o.customer.pincode}</span>}
        </div>
        {o.codCall?.note && <div className={`call-note ${o.codCall.status}`}>{o.codCall.status === 'confirmed' ? 'AI call: ' : 'AI call: '}{o.codCall.note}</div>}
      </div>
      <div className="o-act">
        {o.status === 'cod_pending' && !calling && (
          <>
            <button className="primary" onClick={() => post(`/api/orders/${o.id}/cod-call`)}>Call to confirm</button>
            <button className="tiny" onClick={() => post(`/api/orders/${o.id}/cod-call`, { outcome: 'no_answer' })}>Try: no answer</button>
          </>
        )}
        {calling && <span className="calling"><i />AI is calling…</span>}
        {NEXT_LABEL[o.status] && <button className="secondary" onClick={() => post(`/api/orders/${o.id}/advance`)}>{NEXT_LABEL[o.status]}</button>}
      </div>
    </li>
  );
}

// ---------------- Chats ----------------
function Chats({ s, active, onSelect }) {
  const conv = s.conversations.find(c => c.handle === active);
  const [draft, setDraft] = useState('');
  const endRef = useRef(null);
  useEffect(() => { endRef.current?.scrollIntoView({ block: 'end' }); }, [conv?.messages.length, active]);
  useEffect(() => { if (conv?.unread) post(`/api/conversations/${conv.handle}/read`); }, [active, conv?.unread]);

  return (
    <section className="panel chats">
      <div className="panel-head"><h2>Instagram DMs</h2></div>
      {s.conversations.length === 0 ? (
        <p className="empty">No DMs yet. Comment "price" on the reel from the customer's phone to start one.</p>
      ) : (
        <div className="chat-wrap">
          <ul className="conv-list">
            {s.conversations.map(c => (
              <li key={c.handle}>
                <button className={c.handle === active ? 'on' : ''} onClick={() => onSelect(c.handle)}>
                  <span className="who">@{c.handle}{c.unread > 0 && <i className="dot" />}</span>
                  <span className={`mode ${c.mode}`}>{c.mode === 'ai' ? 'AI replying' : 'Team'}</span>
                </button>
              </li>
            ))}
          </ul>
          {conv && (
            <div className="thread">
              <div className="thread-head">
                <b>@{conv.handle}</b>
                {conv.mode === 'ai'
                  ? <button className="secondary" onClick={() => post(`/api/conversations/${conv.handle}/takeover`)}>Take over chat</button>
                  : <button className="secondary" onClick={() => post(`/api/conversations/${conv.handle}/release`)}>Hand back to AI</button>}
              </div>
              <div className="msgs">
                {conv.messages.map(m => m.from === 'system'
                  ? <p key={m.id} className="sys">{m.text}</p>
                  : <div key={m.id} className={`msg ${m.from}`}>
                      <span className="by">{m.from === 'customer' ? `@${conv.handle}` : m.from === 'ai' ? (m.kind === 'private_reply' ? 'AI · reply to comment' : 'AI') : 'Team'}</span>
                      <p>{m.text}</p>
                    </div>)}
                <div ref={endRef} />
              </div>
              {conv.mode === 'staff' && (
                <form className="compose" onSubmit={e => { e.preventDefault(); if (!draft.trim()) return; post(`/api/conversations/${conv.handle}/staff`, { text: draft }); setDraft(''); }}>
                  <input id="staff-reply" value={draft} onChange={e => setDraft(e.target.value)} placeholder="Reply as CG STUDIOS team" />
                  <button className="primary">Send</button>
                </form>
              )}
            </div>
          )}
        </div>
      )}
    </section>
  );
}

// ---------------- Simulated phone ----------------
function Phone({ s, persona }) {
  const [tab, setTab] = useState('reel');
  const [postId, setPostId] = useState(s.posts[0].id);
  const conv = s.conversations.find(c => c.handle === persona);
  const unread = conv ? conv.messages.filter(m => m.from !== 'customer').length : 0;
  useEffect(() => { if (conv && conv.messages.length && tab === 'reel') { /* badge only */ } }, [conv?.messages.length]);
  return (
    <div className="phone">
      <div className="notch" />
      <div className="ig-top"><b>cgstudios</b><div className="tabs">
        <button className={tab === 'reel' ? 'on' : ''} onClick={() => setTab('reel')}>Reels</button>
        <button className={tab === 'dm' ? 'on' : ''} onClick={() => setTab('dm')}>DMs{unread > 0 && <i className="badge">{unread}</i>}</button>
      </div></div>
      {tab === 'reel' ? <Reel s={s} postId={postId} setPostId={setPostId} persona={persona} /> : <Dm conv={conv} persona={persona} />}
    </div>
  );
}

function Reel({ s, postId, setPostId, persona }) {
  const p = s.posts.find(x => x.id === postId);
  const prod = s.products.find(x => x.id === p.productId);
  const [text, setText] = useState('');
  const comments = s.comments.filter(c => c.postId === postId);
  return (
    <div className="reel">
      <div className="reel-media">
        <img src={(prod.colors.find(c => c.name === p.colorName) || prod.colors[0]).image} alt={`${prod.name} ${p.colorName || ''}`} onError={e => { e.currentTarget.style.visibility = 'hidden'; }} onLoad={e => { e.currentTarget.style.visibility = 'visible'; }} />
        <div className="reel-cap"><b>{prod.name}</b><span>{rupees(prod.price)} · {prod.colors.filter(c => c.inStock).length} colours in stock</span></div>
        <div className="reel-switch">{s.posts.map(x => <button key={x.id} aria-label={`Show ${x.id}`} className={x.id === postId ? 'on' : ''} onClick={() => setPostId(x.id)} />)}</div>
      </div>
      <p className="caption"><b>cgstudios</b> {p.caption}</p>
      <ul className="comments">
        {comments.map(c => <li key={c.id}><b>{c.handle}</b> {c.text}{c.autoDm && <span className="sent">DM sent</span>}</li>)}
      </ul>
      <form className="ig-input" onSubmit={e => { e.preventDefault(); if (!text.trim()) return; post('/api/comments', { handle: persona, text, postId }); setText(''); }}>
        <input id="comment" value={text} onChange={e => setText(e.target.value)} placeholder={`Comment as ${persona}… try "Price?"`} />
        <button>Post</button>
      </form>
    </div>
  );
}

function Dm({ conv, persona }) {
  const [text, setText] = useState('');
  const endRef = useRef(null);
  useEffect(() => { endRef.current?.scrollIntoView({ block: 'end' }); }, [conv?.messages.length]);
  const send = (t) => post(`/api/dm/${persona}`, { text: t });
  return (
    <div className="dm">
      <div className="dm-head"><span className="av">CG</span><div><b>CG STUDIOS</b><small>Business account</small></div></div>
      <div className="dm-msgs">
        {!conv && <p className="dm-empty">No messages yet. Comment on the reel or say hi.</p>}
        {conv?.messages.filter(m => m.from !== 'system').map(m => (
          <div key={m.id} className={`b ${m.from === 'customer' ? 'me' : 'them'}`}>
            {m.text}
            {m.button && <button className="b-btn" onClick={() => send('Order karna hai')}>{m.button}</button>}
          </div>
        ))}
        <div ref={endRef} />
      </div>
      <form className="ig-input" onSubmit={e => { e.preventDefault(); if (!text.trim()) return; send(text); setText(''); }}>
        <input id="dm" value={text} onChange={e => setText(e.target.value)} placeholder="Message…" />
        <button>Send</button>
      </form>
    </div>
  );
}
