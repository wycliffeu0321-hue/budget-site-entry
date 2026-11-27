// HomeLedger seed data — the Miller family, November 2026.
// All amounts are in USD. Spending is negative, income is positive.

export const FAMILY_NAME = 'The Miller Family';
export const CURRENT_MONTH = '2026-11';
export const CURRENT_MONTH_LABEL = 'November 2026';

export const CATEGORIES = [
  { id: 'income',        name: 'Income',        colour: '#1E6B52' },
  { id: 'groceries',     name: 'Groceries',     colour: '#4C9F70' },
  { id: 'housing',       name: 'Housing',       colour: '#2F5D8A' },
  { id: 'utilities',     name: 'Utilities',     colour: '#7A9E43' },
  { id: 'transport',     name: 'Transport',     colour: '#E8A33D' },
  { id: 'dining',        name: 'Dining Out',    colour: '#D96C33' },
  { id: 'health',        name: 'Health',        colour: '#3E9B9B' },
  { id: 'kids',          name: 'Kids & School', colour: '#8E6BC8' },
  { id: 'fun',           name: 'Fun',           colour: '#C85A8A' },
  { id: 'subscriptions', name: 'Subscriptions', colour: '#5B7FB4' },
  { id: 'household',     name: 'Household',     colour: '#9A7B4F' },
];

export const categoryById = (id) => CATEGORIES.find((c) => c.id === id) || CATEGORIES[0];

let txSeq = 0;
const tx = (date, description, categoryId, account, amount) => ({
  id: 'seed-' + (++txSeq),
  date,
  description,
  categoryId,
  account,
  amount,
});

export const SEED_TRANSACTIONS = [
  tx('2026-11-01', 'Rent — Maple Street apartment', 'housing', 'Checking', -1850.00),
  tx('2026-11-01', 'Paycheck — Daniel (Northwind Labs)', 'income', 'Checking', 4520.00),
  tx('2026-11-02', 'Trader Joe\u2019s — weekly shop', 'groceries', 'Checking', -142.36),
  tx('2026-11-02', 'Shell — fuel for the wagon', 'transport', 'Credit Card', -48.20),
  tx('2026-11-03', 'City Power & Light — electricity', 'utilities', 'Checking', -96.44),
  tx('2026-11-03', 'Netflix', 'subscriptions', 'Credit Card', -15.49),
  tx('2026-11-04', 'CVS Pharmacy — prescriptions', 'health', 'Checking', -32.75),
  tx('2026-11-05', 'Whole Foods Market', 'groceries', 'Credit Card', -88.12),
  tx('2026-11-05', 'Metro pass top-up', 'transport', 'Checking', -34.00),
  tx('2026-11-06', 'Bella Italia — family dinner', 'dining', 'Credit Card', -86.40),
  tx('2026-11-07', 'Target — cleaning supplies & towels', 'household', 'Credit Card', -57.83),
  tx('2026-11-08', 'Riverside Elementary — field trip fee', 'kids', 'Checking', -25.00),
  tx('2026-11-09', 'Safeway — groceries', 'groceries', 'Checking', -121.57),
  tx('2026-11-10', 'Water & sewer bill', 'utilities', 'Checking', -54.18),
  tx('2026-11-11', 'Dr. Patel — dental checkup, Emma', 'health', 'Checking', -120.00),
  tx('2026-11-12', 'Spotify Family', 'subscriptions', 'Credit Card', -17.99),
  tx('2026-11-12', 'Cinema City — movie night', 'fun', 'Credit Card', -42.00),
  tx('2026-11-13', 'Exxon — fuel', 'transport', 'Credit Card', -45.60),
  tx('2026-11-14', 'Paycheck — Priya (freelance design)', 'income', 'Checking', 3330.00),
  tx('2026-11-15', 'Mortgage top-up — extra principal', 'housing', 'Savings', -300.00),
  tx('2026-11-16', 'Trader Joe\u2019s — weekly shop', 'groceries', 'Checking', -135.94),
  tx('2026-11-17', 'Sushi Go — date night', 'dining', 'Credit Card', -64.25),
  tx('2026-11-18', 'Internet — FiberLink 1 Gbps', 'utilities', 'Checking', -69.99),
  tx('2026-11-19', 'Bookshop — school reading list', 'kids', 'Credit Card', -38.50),
  tx('2026-11-20', 'Gym — FitLife monthly', 'health', 'Credit Card', -39.00),
  tx('2026-11-21', 'IKEA — storage boxes & lamp', 'household', 'Credit Card', -74.25),
  tx('2026-11-22', 'Farmers market — produce', 'groceries', 'Cash', -46.30),
  tx('2026-11-23', 'City Museum — family tickets', 'fun', 'Credit Card', -36.00),
  tx('2026-11-24', 'Car insurance — monthly premium', 'transport', 'Checking', -128.40),
  tx('2026-11-25', 'iCloud storage', 'subscriptions', 'Credit Card', -2.99),
  tx('2026-11-26', 'Bakery & deli — Thanksgiving extras', 'groceries', 'Checking', -58.75),
  tx('2026-11-27', 'Coffee Corner — team coffees', 'dining', 'Cash', -18.60),
];

export const SEED_BUDGETS = {
  groceries: 650,
  housing: 2200,
  utilities: 260,
  transport: 320,
  dining: 220,
  health: 250,
  kids: 180,
  fun: 150,
  subscriptions: 60,
  household: 200,
};

export const SEED_BILLS = [
  { id: 'bill-rent',     name: 'Rent — Maple Street',      dueDay: 1,  amount: 1850.00, autopay: false, paid: true },
  { id: 'bill-electric', name: 'City Power & Light',       dueDay: 3,  amount: 96.44,   autopay: true,  paid: true },
  { id: 'bill-water',    name: 'Water & sewer',            dueDay: 10, amount: 54.18,   autopay: true,  paid: true },
  { id: 'bill-internet', name: 'FiberLink internet',       dueDay: 18, amount: 69.99,   autopay: true,  paid: true },
  { id: 'bill-insurance',name: 'Car insurance',            dueDay: 24, amount: 128.40,  autopay: true,  paid: true },
  { id: 'bill-phone',    name: 'Mobile phones (2 lines)',  dueDay: 27, amount: 84.00,   autopay: true,  paid: false },
  { id: 'bill-daycare',  name: 'Daycare — deposit for Dec', dueDay: 28, amount: 240.00,  autopay: false, paid: false },
  { id: 'bill-cleaning', name: 'House cleaning service',   dueDay: 30, amount: 110.00,  autopay: false, paid: false },
];

export const SEED_GOALS = [
  { id: 'goal-trip',   name: 'Family trip to the coast — spring break', target: 2400, saved: 1450 },
  { id: 'goal-car',    name: 'New car fund',                            target: 8000, saved: 3350 },
  { id: 'goal-safety', name: 'Emergency cushion (3 months)',            target: 12000, saved: 8900 },
  { id: 'goal-gift',   name: 'Holiday gifts fund',                      target: 600,  saved: 420 },
];

export const MONTHLY_HISTORY = [
  { month: 'Jun', income: 7620, spent: 5980 },
  { month: 'Jul', income: 7790, spent: 6310 },
  { month: 'Aug', income: 7850, spent: 6545 },
  { month: 'Sep', income: 7710, spent: 5890 },
  { month: 'Oct', income: 7920, spent: 6175 },
  { month: 'Nov', income: 7850, spent: 3891 },
];
