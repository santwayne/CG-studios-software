// CG STUDIOS catalogue, taken from thecgstudios.com (Nov 2026 homepage).
// Each product is listed per colour on their store, with no sizes, so the
// agent asks for the colour. Stock is in/out only, as shown on the site.
// Replace with a live sync from their WooCommerce store for production.
const IMG = 'https://thecgstudios.com/wp-content/uploads';

export const BRAND = {
  name: 'CG STUDIOS',
  instagram: 'cgstudios',
  shipping: 'FREE express shipping on orders above ₹1,000',
  returns: 'No exchange and no return (store policy)',
  cod: true, // confirm with CG Studios: COD is not mentioned on the website
  phone: '+91 88376 33577',
  email: 'info@thecgstudios.com',
  address: '953, Street No. 7, Dashmesh Nagar, Ludhiana',
  website: 'https://thecgstudios.com',
};

const c = (name, inStock, img, slug) => ({ name, inStock, image: `${IMG}/${img}`, url: `https://thecgstudios.com/product/${slug}/` });

export const PRODUCTS = [
  {
    id: 'banarsi-jacquard', name: 'Banarsi Weaving Jacquard', price: 1995, category: 'Suits', keywords: ['banarsi', 'banarasi', 'jacquard'],
    colors: [
      c('Peacock', true, '2026/11/d22df14e-3f65-4871-ba38-3b66dc069995-300x300.jpeg', 'banarsi-weaving-jacquard-peacock'),
      c('Green', true, '2026/11/504cec04-4501-4827-9108-af9c84087601-300x300.jpeg', 'banarsi-weaving-jacquard-green'),
      c('Rust', false, '2026/11/16c59fab-2932-408d-858e-be75558fa35e-300x300.jpeg', 'banarsi-weaving-jacquard-rust'),
    ],
  },
  {
    id: 'pashmina', name: 'Pashmina', price: 795, category: 'Pashmina', keywords: ['pashmina'],
    colors: [
      c('Blue', true, '2026/10/bfe04957-f796-47aa-b574-4f201ce9c95f-300x300.png', 'pashmina-blue-2'),
      c('Hot pink', true, '2026/10/a7eee90c-1796-488a-b4f0-56d89a13d27f-300x300.png', 'pashmina-rust-2'),
      c('Peacock', true, '2026/10/855361f8-b8a5-461c-8632-392b79e46689-300x300.png', 'pashmina-green'),
      c('Purple', true, '2026/10/c3dcba2b-56ee-4407-9bca-f4079be900ea-1-300x300.png', 'pashmina-purple'),
      c('Mustard', true, '2026/10/85deb162-c5bb-4095-b837-eb9ff60d42c2-1-300x300.png', 'pashmina-mustard'),
    ],
  },
  {
    id: 'dori-paint', name: 'Dori Paint', price: 1095, category: 'Suits', keywords: ['dori'],
    colors: [
      c('Pink', true, '2026/09/60b73521-5bf3-41e1-9e2e-e54fe29a0877-300x300.jpeg', 'dori-paint-pink'),
      c('Pista', false, '2026/09/6b35a40b-ebdd-4de5-a7db-f57dbf8b87ff-300x300.jpeg', 'dori-paint-pista'),
      c('Blue', false, '2026/09/f6fb6912-1117-4f3f-837a-1347eb421a1a-300x300.jpeg', 'dori-paint-blue'),
      c('Lemon', false, '2026/09/9d99b5bf-f767-4405-bd21-8293138b9043-300x300.jpeg', 'dori-paint-lemon'),
    ],
  },
  {
    id: 'velvet-tracksuit', name: 'Velvet Tracksuit', price: 565, category: 'Velvet', keywords: ['tracksuit', 'track suit', 'velvet'],
    colors: [
      c('Peacock', true, '2026/10/a741dd3a-5f02-4ac8-88bf-1d8e4f162ef4-300x300.png', 'velvet-tracksuit-peacock'),
      c('Marun', true, '2026/10/e16fa387-04a3-458a-9f17-ee1188d8e334-300x300.png', 'velvet-tracksuit-marun-2'),
      c('Coffee', true, '2026/10/1b0ead17-6878-4807-a26b-4b27817f045c-300x300.png', 'velvet-tracksuit-coffee'),
      c('Mouse', true, '2026/10/27ce20b5-6e45-4d38-a78c-628a9e95d380-300x300.png', 'velvet-tracksuit-mouse'),
      c('Lavender', true, '2026/10/132825ad-da18-45f4-ad7c-62a13977cc36-300x300.png', 'velvet-tracksuit-lavender'),
      c('Wine', true, '2026/10/a1535885-7fc7-40bb-99f3-69430c36214b-300x300.png', 'velvet-tracksuit-marun'),
    ],
  },
  {
    id: 'orpat-cordset', name: 'Orpat Cordset', price: 595, category: 'Cordsets', keywords: ['orpat', 'cordset', 'cord set', 'co-ord', 'coord'],
    colors: [
      c('Coffee', true, '2026/10/484a34c8-af21-4ff0-8e31-676771dc47fa-300x300.jpeg', 'orpat-coffee-cordset'),
      c('Mehndi', true, '2026/10/0c26614c-7acb-4424-9e30-57b1bfc2f5c0-300x300.jpeg', 'orpat-cordset-mehndi'),
      c('Black', true, '2026/10/94b406c1-2b65-4487-809e-a2daa49835c0-300x300.jpeg', 'orpat-black-cordset'),
      c('Onion pink', true, '2026/10/62196050-851e-4465-9de6-e4d30c73817a-300x300.jpeg', 'orpat-cordset-onion-pink'),
      c('Blue', true, '2026/10/4811027d-ff84-45de-a28a-a568947f4609-1-300x300.png', 'orpat-blue-cordset'),
      c('Green', true, '2026/10/95d9da53-2e08-424a-8a92-6670e1d056fe-300x300.png', 'orpat-cordset-green'),
      c('Peacock', false, '2026/10/aafe8250-f6c6-452f-a985-17d17a7afbc3-300x300.jpeg', 'orpat-peacock-cordset'),
      c('Marun', false, '2026/10/5d19d511-7e3a-42cb-a3db-503fef894d8b-300x300.jpeg', 'orpat-marun-cordset'),
      c('Light pista', false, '2026/10/0c17d892-6fdf-4b3b-bb81-28935529ac84-300x300.jpeg', 'orpat-cordset-light-pista'),
    ],
  },
  {
    id: 'korean-pant', name: 'Korean Pant', price: 665, category: 'Bottoms', keywords: ['korean', 'pant'],
    colors: [
      c('Grey', true, '2026/10/dc1c13d4-06bc-4640-ab5b-528821982064-300x300.png', 'korean-pant-grey'),
      c('Skin', true, '2026/10/d978c951-6134-4786-a2b2-39a6f9d687b4-300x300.png', 'korean-pant-skin'),
      c('Beige', true, '2026/10/8f29ad9d-de18-41fa-b82a-6e1a7d371080-1-300x300.png', 'korean-pant-beige'),
    ],
  },
  {
    id: 'fleece-legging', name: 'Winter Fleece Legging', price: 795, category: 'Winter', keywords: ['fleece', 'legging', 'leggings'],
    colors: [
      c('Green', true, '2026/10/5003a668-6d18-4e6b-bf22-3f254d67bc50-300x300.jpeg', 'winter-fleece-green'),
      c('Mouse', true, '2026/10/b8bb7c58-d0f7-444f-85d3-48fb01fcaed6-300x300.jpeg', 'winter-fleece-legging-light-brown'),
      c('Coffee', true, '2026/10/1cb5ec8f-1cc6-4ccb-ac1a-dc51bef86364-300x300.jpeg', 'winter-fleece-legging-coffee'),
      c('Marun', true, '2026/10/d3c6007e-1a56-4d2e-a180-1762f5694c30-300x300.jpeg', 'winter-fleece-legging-brown'),
      c('Grey', false, '2026/10/17338402-e53f-4a7d-952c-dfa4fff7397c-1-300x300.jpeg', 'winter-fleece-legging-grey'),
    ],
  },
  {
    id: 'flower-bunch', name: 'Flower Bunch', price: 1395, category: 'Suits', keywords: ['flower bunch', 'flower'],
    colors: [c('As shown', true, '2026/09/1df1bc12-746a-4924-85e2-05388b8c1e05-300x300.jpeg', 'flower-bunch')],
  },
  {
    id: 'rising-angels', name: 'Rising Angels', price: 1395, category: 'Suits', keywords: ['rising angels', 'angels'],
    colors: [c('As shown', true, '2026/09/1baf3dbf-d2f8-4255-ba4d-5dcf3c1a6181-300x300.jpeg', 'beautiful-article')],
  },
];

export const POSTS = [
  { id: 'reel-1', productId: 'banarsi-jacquard', colorName: 'Peacock', caption: 'Banarsi Weaving Jacquard is here ✨ Peacock and Green in stock. Comment PRICE for details.' },
  { id: 'reel-2', productId: 'velvet-tracksuit', colorName: 'Wine', caption: 'Velvet tracksuits for winter, 6 colours 🤍 Comment PRICE.' },
  { id: 'reel-3', productId: 'pashmina', colorName: 'Hot pink', caption: 'New Pashmina colours just dropped. Comment PRICE 💗' },
];

export const inStockColors = (p) => p.colors.filter(x => x.inStock).map(x => x.name);
export const isSingle = (p) => p.colors.length === 1;

export const findProduct = (text) => {
  if (!text) return null;
  const s = String(text).toLowerCase();
  return PRODUCTS.find(p => p.id === s) || PRODUCTS.find(p => p.keywords.some(k => s.includes(k))) || null;
};

export const findColor = (p, text) => {
  if (!p || !text) return null;
  const s = String(text).toLowerCase();
  return [...p.colors].sort((a, b) => b.name.length - a.name.length).find(x => s.includes(x.name.toLowerCase())) || null;
};

export const productLine = (p) => isSingle(p)
  ? `${p.name}: ₹${p.price.toLocaleString('en-IN')}.`
  : `${p.name}: ₹${p.price.toLocaleString('en-IN')}. Colours in stock: ${inStockColors(p).join(', ')}.`;
