export type SeedStall = {
  id: string
  name: string
  owner: string
  market: string
  avatar: string
  photo: string
  goods: string
  price: string
}

const dice = (seed: string) =>
  `https://api.dicebear.com/9.x/adventurer/svg?seed=${encodeURIComponent(seed)}&backgroundColor=ffd5dc,ffdfbf,c0aede,b6e3f4`

const u = (id: string) =>
  `https://images.unsplash.com/${id}?q=60&w=640&auto=format&fit=crop`

/** Stall photo picked from what the trader actually sells — a tech company never gets rice. */
export function photoForGoods(goods: string): string {
  const g = goods.toLowerCase()
  const has = (...ws: string[]) => ws.some((w) => g.includes(w))
  if (has('tech', 'phone', 'laptop', 'computer', 'gadget', 'electronic', 'software', 'repair', 'data', 'cable')) return u('photo-1518770660439-4636190af475')
  if (has('fabric', 'cloth', 'ankara', 'fashion', 'tailor', 'sew', 'aso', 'wear')) return u('photo-1523381210434-271e8be1f52b')
  if (has('rice', 'grain', 'bean', 'maize')) return u('photo-1586201375761-83865001e31c')
  if (has('tomato')) return u('photo-1592924357228-91a4daadcfea')
  if (has('sukuma', 'green', 'vegetable', 'leaf', 'spinach', 'cabbage')) return u('photo-1488459716781-31db52582fe9')
  if (has('onion')) return u('photo-1518843875459-f738682238a6')
  if (has('spice', 'pepper', 'curry', 'thyme')) return u('photo-1596040033229-a9821ebd058d')
  if (has('oil', 'soap', 'sugar', 'provision', 'detergent')) return u('photo-1542838132-92c53300491e')
  if (has('fruit', 'orange', 'mango', 'apple', 'banana')) return u('photo-1610348725531-843dff563e2c')
  return u('photo-1542838132-92c53300491e')
}

/** One market typed two ways ("Mile 12, Lagos" vs "Mile 12 · Lagos") is the same chip. */
export const normMarket = (m: string) =>
  m.toLowerCase().replace(/[·,|/\\\-–—]/g, ' ').replace(/\s+/g, ' ').trim()

export const SEED_STALLS: SeedStall[] = [
  {
    id: 'amina',
    name: 'Amina Grains',
    owner: 'Amina',
    market: 'Mile 12 · Lagos',
    avatar: dice('Amina'),
    photo: u('photo-1586201375761-83865001e31c'),
    goods: '2 bags rice restock',
    price: '₦420',
  },
  {
    id: 'chidi',
    name: 'Chidi Tomatoes',
    owner: 'Chidi',
    market: 'Mile 12 · Lagos',
    avatar: dice('Chidi'),
    photo: u('photo-1592924357228-91a4daadcfea'),
    goods: '3 crates tomatoes',
    price: '₦180',
  },
  {
    id: 'wanjiru',
    name: 'Wanjiru Greens',
    owner: 'Wanjiru',
    market: 'Kibera · Nairobi',
    avatar: dice('Wanjiru'),
    photo: u('photo-1488459716781-31db52582fe9'),
    goods: 'Morning sukuma delivery',
    price: '₦90',
  },
  {
    id: 'fatou',
    name: 'Fatou Fabrics',
    owner: 'Fatou',
    market: 'Onitsha Main',
    avatar: dice('Fatou'),
    photo: u('photo-1523381210434-271e8be1f52b'),
    goods: '6 yards Ankara',
    price: '₦650',
  },
  {
    id: 'ibrahim',
    name: 'Ibrahim Onions',
    owner: 'Ibrahim',
    market: 'Kurmi · Kano',
    avatar: dice('Ibrahim'),
    photo: u('photo-1518843875459-f738682238a6'),
    goods: 'Bags of red onions',
    price: '₦150',
  },
  {
    id: 'aisha',
    name: 'Aisha Spices',
    owner: 'Aisha',
    market: 'Makola · Accra',
    avatar: dice('Aisha'),
    photo: u('photo-1596040033229-a9821ebd058d'),
    goods: 'Pepper, curry, thyme',
    price: '₦300',
  },
  {
    id: 'mamaeka',
    name: 'Mama Eka Provisions',
    owner: 'Eka',
    market: 'Mile 12 · Lagos',
    avatar: dice('Eka'),
    photo: u('photo-1542838132-92c53300491e'),
    goods: 'Oil, sugar, soap stock',
    price: '₦520',
  },
  {
    id: 'tunde',
    name: 'Tunde Fruits',
    owner: 'Tunde',
    market: 'Bodija · Ibadan',
    avatar: dice('Tunde'),
    photo: u('photo-1610348725531-843dff563e2c'),
    goods: 'Oranges and mangoes',
    price: '₦240',
  },
]

export type DemoSlip = {
  id: string
  seller: string
  sellerAvatar: string
  buyer: string
  buyerAvatar: string
  goods: string
  photo: string
  amount: string
  amountNum: number
  ccy: string
  market: string
  verbal: boolean
  sameName?: boolean
  confirmed: boolean
  witnessed: boolean
  attested: boolean
  createdAgo: string
}

export const CURRENCIES = ['₦', 'KSh', '$', 'GH₵', 'R', '€'] as const

export type TraderVoice = {
  who: string
  trade: string
  quote: string
}

/** Edit quotes here. Numbers on the cards are computed live from real slips. */
export const TRADER_VOICES: TraderVoice[] = [
  {
    who: 'Chidi',
    trade: 'tomatoes',
    quote: 'Tomatoes rot in two days. My standing moves faster than my stock.',
  },
  {
    who: 'Wanjiru',
    trade: 'greens',
    quote: 'My buyers confirm before I reach home. The bank finally picks my calls.',
  },
  {
    who: 'Fatou',
    trade: 'fabrics',
    quote: 'Six yards at a time, every one on record. My advance bought the next bale.',
  },
]

export const SEED_SLIPS: DemoSlip[] = [
  {
    id: 'RS-1042',
    market: 'Mile 12 · Lagos',
    seller: 'Amina',
    sellerAvatar: dice('Amina'),
    buyer: 'Musa',
    buyerAvatar: dice('Musa'),
    goods: '2 bags rice · stall sale',
    photo: u('photo-1586201375761-83865001e31c'),
    amount: '₦420',
    amountNum: 0.42,
    ccy: '₦',
    verbal: false,
    confirmed: true,
    witnessed: true,
    attested: true,
    createdAgo: '2h ago',
  },
  {
    id: 'RS-1043',
    market: 'Onitsha Main',
    seller: 'Amina',
    sellerAvatar: dice('Amina'),
    buyer: 'Zainab',
    buyerAvatar: dice('Zainab'),
    goods: '1 bag beans + maize',
    photo: u('photo-1595855759920-86582396756a'),
    amount: '₦210',
    amountNum: 0.21,
    ccy: '₦',
    verbal: false,
    confirmed: true,
    witnessed: false,
    attested: true,
    createdAgo: '5h ago',
  },
  {
    id: 'RS-1044',
    market: 'Mile 12 · Lagos',
    seller: 'Chidi',
    sellerAvatar: dice('Chidi'),
    buyer: 'Amina',
    buyerAvatar: dice('Amina'),
    goods: '3 crates tomatoes · restock',
    photo: u('photo-1592924357228-91a4daadcfea'),
    amount: '₦180',
    amountNum: 0.18,
    ccy: '₦',
    verbal: false,
    confirmed: false,
    witnessed: false,
    attested: false,
    createdAgo: '20m ago',
  },
  {
    id: 'RS-1045',
    market: 'Mile 12 · Lagos',
    seller: 'Chidi',
    sellerAvatar: dice('Chidi'),
    buyer: 'Musa',
    buyerAvatar: dice('Musa'),
    goods: '2 crates tomatoes',
    photo: u('photo-1592924357228-91a4daadcfea'),
    amount: '₦150',
    amountNum: 0.15,
    ccy: '₦',
    verbal: false,
    confirmed: true,
    witnessed: true,
    attested: false,
    createdAgo: '1d ago',
  },
  {
    id: 'RS-1046',
    market: 'Kibera · Nairobi',
    seller: 'Wanjiru',
    sellerAvatar: dice('Wanjiru'),
    buyer: 'Zainab',
    buyerAvatar: dice('Zainab'),
    goods: 'Sukuma and spinach',
    photo: u('photo-1488459716781-31db52582fe9'),
    amount: '₦90',
    amountNum: 0.09,
    ccy: '₦',
    verbal: false,
    confirmed: true,
    witnessed: true,
    attested: false,
    createdAgo: '1d ago',
  },
  {
    id: 'RS-1047',
    market: 'Onitsha Main',
    seller: 'Fatou',
    sellerAvatar: dice('Fatou'),
    buyer: 'Musa',
    buyerAvatar: dice('Musa'),
    goods: '3 yards Ankara',
    photo: u('photo-1523381210434-271e8be1f52b'),
    amount: '₦320',
    amountNum: 0.32,
    ccy: '₦',
    verbal: false,
    confirmed: true,
    witnessed: true,
    attested: true,
    createdAgo: '2d ago',
  },
]
