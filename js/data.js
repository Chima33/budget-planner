export const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

export const CATS = {
  out: [
    { id: 'food', name: 'Food', emoji: '🍜', color: '#E15A72' },
    { id: 'transport', name: 'Transport', emoji: '🚇', color: '#2F8FD1' },
    { id: 'school', name: 'School', emoji: '', color: '#A66DD4' },
    { id: 'home', name: 'Home', emoji: '🏠', color: '#E2762D' },
    { id: 'health', name: 'Health & Wellness', emoji: '🩺', color: '#2EC4B6' },
    { id: 'data', name: 'Data', emoji: '📶', color: '#F2B33D' },
    { id: 'transferOut', name: 'Transfers', emoji: '🔁', color: '#8B9AA6' },
    { id: 'misc', name: 'Miscellaneous', emoji: '', color: '#7CB342' },
  ],
  in: [
    { id: 'salary', name: 'Salary', emoji: '💼', color: '#2FBF71' },
    { id: 'bank', name: 'Bank Money', emoji: '🏦', color: '#F2A93B' },
    { id: 'freelance', name: 'Freelance', emoji: '🧾', color: '#21B3A8' },
    { id: 'refund', name: 'Refunds', emoji: '💸', color: '#7CB342' },
    { id: 'transferIn', name: 'Transfers', emoji: '🔁', color: '#8B9AA6' },
  ]
};

export const catById = (id) => [...CATS.out, ...CATS.in].find(c => c.id === id) || { name: 'Other', emoji: '📦', color: '#8B9AA6' };
export const DEF_BUDGETS = { food: 1800, transport: 250, school: 400, home: 200, health: 150, data: 100, transferOut: 250, misc: 100 };

const RAW = [
  ['2026-08-22','out','food','Victori Bakery',31],['2026-08-22','out','data','Data',50],['2026-08-22','out','transport','KMB',10.2],
  ['2026-08-21','in','salary','Research Incentive',200],['2026-08-20','out','food','Victori Bakery',20],['2026-08-19','out','food','Groceries',59],
  ['2026-08-18','out','food','Groceries',128.5],['2026-08-18','in','transferIn','Elliot refund',77],['2026-08-18','out','transport','MTR',3.2],
  ['2026-08-18','out','transport','KMB',11.5],['2026-08-18','out','food','Chicken factory',96],['2026-08-18','out','food','Groceries',88.7],
  ['2026-08-17','out','transport','KMB',7.1],['2026-08-17','out','food','Egg tart',17],['2026-08-17','out','food','8FIVE2SHOP',35],
  ['2026-08-16','out','school','Air con',2.64],['2026-08-16','out','food','Mcdonalds',40],['2026-08-16','out','transport','Lalamove',135],
  ['2026-08-16','out','food','Chicken factory',48],['2026-08-15','out','food','Groceries',76.8],['2026-08-15','out','school','Air con',5.28],
  ['2026-08-14','out','school','Laundry',18],['2026-08-14','out','school','Air con',5.28],['2026-08-13','out','transferOut','Transfer to Shansel',200],
  ['2026-08-13','out','food','Air con',2.64],['2026-08-13','out','food','Groceries',91.8],['2026-08-13','in','salary','Library Salary',340],
  ['2026-08-13','out','school','Air con',2.64],['2026-08-12','out','school','Air con',2.64],['2026-08-11','out','school','Air con',2.64],
  ['2026-08-11','out','food','7-eleven',54.2],['2026-08-09','out','home','Taobao',84.56],['2026-08-09','out','school','Air con',10.56],
  ['2026-08-09','out','food','7-eleven',58.9],['2026-08-09','out','food','Mcdonalds',40],['2026-08-08','out','food','Mcdonalds',40],
  ['2026-08-07','out','food','Mcdonalds',40],['2026-08-07','out','school','Air con',11],['2026-08-06','out','food','Groceries',131.8],
  ['2026-08-05','out','food','Groceries',149.6],['2026-08-04','out','health','Acid reflux drug',50.2],['2026-08-04','out','food','McDonalds',40],
  ['2026-08-02','out','school','Laundry',18],['2026-08-01','out','food','Mcdonalds',40],['2026-08-01','out','food','Groceries',33.1],
  ['2026-08-01','out','food','7-eleven',29.4],['2026-08-01','out','school','Air con',22],['2026-08-01','in','bank','July carryover',1944.89],
  ['2026-07-31','out','food','7-eleven',19],['2026-07-30','out','food','7-Eleven',29],['2026-07-30','out','food','Mcdonalds',40],
  ['2026-07-29','out','food','Groceries',69.1],['2026-07-28','out','food','Mcdonalds',40],['2026-07-28','out','food','Groceries',182.2],
  ['2026-07-26','out','food','Ebeneezers',44],['2026-07-26','in','freelance','Research Survey Incentive',100],['2026-07-26','out','school','Laundry',18],
  ['2026-07-25','out','data','Data',48],['2026-07-25','out','food','Groceries',94.8],['2026-07-25','out','food','7-eleven',24],
  ['2026-07-25','out','school','Air con',3.96],['2026-07-24','out','food','7-eleven',23.5],['2026-07-23','out','food','Chinese cuisine',49],
  ['2026-07-23','out','food','Mcdonalds',39],['2026-07-23','in','salary','Sci School Salary',204],['2026-07-22','out','misc','HK Accessory',38],
  ['2026-07-22','out','food','Groceries',24.2],['2026-07-21','out','home','Groceries',38.7],['2026-07-21','out','food','Ebeneezers',39.5],
  ['2026-07-20','out','school','Air con',20.24],['2026-07-20','out','food','Mcdonalds',44],['2026-07-20','out','food','7-eleven',24],
  ['2026-07-19','out','home','Groceries',41.1],['2026-07-19','out','food','Gum',10.2],['2026-07-18','out','school','Laundry',18],
  ['2026-07-17','out','school','Taobao',168.38],['2026-07-16','out','food','Groceries',68.9],['2026-07-15','out','school','Air con',22],
  ['2026-07-15','out','food','Groceries',41.1],['2026-07-15','out','food','Tam jai',45],['2026-07-13','out','food','Chinese cuisine',56],
  ['2026-07-13','out','food','Groceries',68.1],['2026-07-12','out','food','Mcdonalds',40],['2026-07-12','out','school','Laundry',18],
  ['2026-07-12','out','school','Air con',5.28],['2026-07-11','out','food','Groceries',47.8],['2026-07-11','out','home','Taobao',92.91],
  ['2026-07-11','out','school','Air con',2.64],['2026-07-10','out','food','Chinese cuisine',51],['2026-07-10','out','food','Japanese Cuisine',39],
  ['2026-07-09','out','school','Air con',2.64],['2026-07-09','out','food','Ebeneezers',44],['2026-07-08','out','school','Air con',2.64],
  ['2026-07-08','out','food','Groceries',143.5],['2026-07-08','out','school','Air con',5.28],['2026-07-07','out','food','Mcdonalds',40],
  ['2026-07-07','out','food','Groceries',18.8],['2026-07-07','out','food','Subway',37],['2026-07-06','out','food','Mcdonalds',40],
  ['2026-07-06','out','food','Groceries',48.8],['2026-07-06','out','school','Laundry',23],['2026-07-06','out','school','Air con',2.64],
  ['2026-07-05','out','transport','Minibus',8.3],['2026-07-05','out','transport','MTR',8.8],['2026-07-05','out','transport','KMB',6.4],
  ['2026-07-05','out','food','Groceries',31.6],['2026-07-05','out','school','Air con',2.64],['2026-07-04','out','transport','MTR',17.4],
  ['2026-07-04','out','transport','KMB',6.4],['2026-07-04','out','transport','Tram',3.3],['2026-07-04','out','transport','Minibus',6],
  ['2026-07-04','out','food','Eat-out',158],['2026-07-04','out','data','Data',48],['2026-07-04','out','school','Air con',2.64],
  ['2026-07-03','out','food','Groceries',27.2],['2026-07-03','out','school','Air con',2.64],['2026-07-02','out','food','Ebeneezers',46],
  ['2026-07-02','out','school','Air con',2.64],['2026-07-01','out','food','Mcdonalds',40],['2026-07-01','out','school','Air con',2.64],
  ['2026-07-01','in','bank','June Carryover',4340],['2026-07-01','out','food','Groceries',74.6],['2026-07-01','out','food','Drinks',8],
  ['2026-06-30','out','food','Groceries',19.7],['2026-06-30','out','food','Ebeneezers',46],['2026-06-29','out','food','Mcdonalds',40],
  ['2026-06-28','out','food','Groceries',98.4],['2026-06-28','out','school','Laundry',23],['2026-06-27','out','food','Groceries',45.4],
  ['2026-06-26','out','food','Groceries',24],['2026-06-26','out','food','Ebeneezers',46],['2026-06-25','out','food','Mcdonalds',40],
  ['2026-06-24','out','food','Groceries',67.8],['2026-06-24','in','refund','ANSHK refund',1200],['2026-06-24','out','food','Groceries',28.3],
  ['2026-06-24','out','school','Air con',6.6],['2026-06-23','out','food','Ebeneezers',46],['2026-06-23','out','food','Sweet potatoes & apples',21.6],
  ['2026-06-23','out','transport','Minibus',6.5],['2026-06-23','out','health','Emollient Cream',55],['2026-06-23','out','transport','Minibus',6.5],
  ['2026-06-22','out','food','Snacks',33.2],['2026-06-22','in','bank','E-Octopus',16.3],['2026-06-22','in','bank','Octopus Student',10],
  ['2026-06-22','in','bank','Alipay HK',6.88],['2026-06-22','in','bank','MOX',16.41],['2026-06-22','in','bank','HSBC',3536.1],['2026-06-22','in','bank','BOCHK',208.31]
];

export const seedTxs = () => RAW.map((r, i) => ({ id: 'r' + i, date: r[0], type: r[1], cat: r[2], note: r[3], amount: r[4] }));

export const today = new Date();
export const state = {
  TX: [],
  BG: { ...DEF_BUDGETS },
  cursor: { y: today.getFullYear(), m: today.getMonth() },
  view: 'overview',
  txFilters: { seg: 'all', q: '' },
  report: { period: 'month', cursor: null },
};

// Robust month check — uses string splitting to avoid timezone bugs
export const inMonth = (t, y, m) => {
  const parts = t.date.split('-');
  return parseInt(parts[0]) === y && (parseInt(parts[1]) - 1) === m;
};

export function totals(y, m) {
  let i = 0, o = 0;
  for (const t of state.TX) if (inMonth(t, y, m)) t.type === 'in' ? i += t.amount : o += t.amount;
  return { in: i, out: o, net: i - o };
}

export function catTotals(y, m, type = 'out') {
  const map = {};
  for (const t of state.TX) if (t.type === type && inMonth(t, y, m)) map[t.cat] = (map[t.cat] || 0) + t.amount;
  return Object.entries(map).map(([id, v]) => ({ cat: catById(id), v })).sort((a, b) => b.v - a.v);
}

export function monthList(endY, endM, n) {
  const arr = [];
  for (let k = n - 1; k >= 0; k--) { const d = new Date(endY, endM - k, 1); arr.push({ y: d.getFullYear(), m: d.getMonth() }); }
  return arr;
}

export function allMonths() {
  if (!state.TX.length) return [];
  const keys = [...new Set(state.TX.map(t => t.date.slice(0, 7)))].sort();
  const [fy, fm] = keys[0].split('-').map(Number), [ly, lm] = keys[keys.length - 1].split('-').map(Number);
  const out = [], d = new Date(fy, fm - 1, 1);
  while (d.getFullYear() < ly || (d.getFullYear() === ly && d.getMonth() <= lm)) { out.push({ y: d.getFullYear(), m: d.getMonth() }); d.setMonth(d.getMonth() + 1); }
  return out;
}

export const mLabel = mo => MONTHS[mo.m].slice(0, 3);
export const mFull = mo => `${MONTHS[mo.m]} ${mo.y}`;
