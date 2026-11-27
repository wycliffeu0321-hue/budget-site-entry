// HomeLedger store — state, localStorage persistence and budget maths.

import {
  CATEGORIES,
  SEED_TRANSACTIONS,
  SEED_BUDGETS,
  SEED_BILLS,
  SEED_GOALS,
} from './data.js';

const STORAGE_KEY = 'homeledger-v1';

export const fmt$ = (n) => {
  const sign = n < 0 ? '-' : '';
  const abs = Math.abs(n);
  return sign + '$' + abs.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

export const fmt$0 = (n) => {
  const sign = n < 0 ? '-' : '';
  return sign + '$' + Math.round(Math.abs(n)).toLocaleString('en-US');
};

function seedState() {
  return {
    transactions: SEED_TRANSACTIONS.map((t) => ({ ...t })),
    budgets: { ...SEED_BUDGETS },
    bills: SEED_BILLS.map((b) => ({ ...b })),
    goals: SEED_GOALS.map((g) => ({ ...g })),
  };
}

let state = null;

export function getState() {
  if (state) return state;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.transactions)) {
        state = parsed;
        return state;
      }
    }
  } catch (err) {
    // Corrupt or unavailable storage: fall through to a fresh seed.
  }
  state = seedState();
  saveState();
  return state;
}

export function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (err) {
    // Storage full or blocked — the in-memory state still works.
  }
}

// ------------------------------------------------------------- mutations

export function addTransaction({ date, description, categoryId, amount }) {
  const s = getState();
  const id = 'tx-' + Date.now().toString(36) + '-' + Math.floor(Math.random() * 1e6).toString(36);
  s.transactions.unshift({ id, date, description, categoryId, account: 'Checking', amount });
  saveState();
}

export function deleteTransaction(id) {
  const s = getState();
  s.transactions = s.transactions.filter((t) => t.id !== id);
  saveState();
}

export function setBudgetLimit(categoryId, limit) {
  const s = getState();
  const value = Math.max(0, Math.round(Number(limit) || 0));
  s.budgets[categoryId] = value;
  saveState();
}

export function toggleBillPaid(id) {
  const s = getState();
  const bill = s.bills.find((b) => b.id === id);
  if (bill) {
    bill.paid = !bill.paid;
    saveState();
  }
}

export function addToGoal(id, amount) {
  const s = getState();
  const goal = s.goals.find((g) => g.id === id);
  if (goal) {
    goal.saved = Math.min(goal.target, goal.saved + amount);
    saveState();
  }
}

// ---------------------------------------------------------- computations

export function monthIncome() {
  return getState().transactions
    .filter((t) => t.amount > 0)
    .reduce((sum, t) => sum + t.amount, 0);
}

export function monthSpent() {
  return -getState().transactions
    .filter((t) => t.amount < 0)
    .reduce((sum, t) => sum + t.amount, 0);
}

export function spentByCategory() {
  const totals = {};
  for (const t of getState().transactions) {
    if (t.amount < 0) totals[t.categoryId] = (totals[t.categoryId] || 0) + -t.amount;
  }
  return totals;
}

export function budgetRows() {
  const s = getState();
  const spent = spentByCategory();
  return CATEGORIES
    .filter((c) => c.id !== 'income')
    .map((c) => {
      const limit = s.budgets[c.id] || 0;
      const used = spent[c.id] || 0;
      return {
        category: c,
        limit,
        spent: used,
        left: limit - used,
        pct: limit > 0 ? Math.round((used / limit) * 100) : 0,
      };
    });
}

export function upcomingBills() {
  return getState().bills
    .filter((b) => !b.paid)
    .slice()
    .sort((a, b) => a.dueDay - b.dueDay);
}

export function allBillsSorted() {
  return getState().bills.slice().sort((a, b) => a.dueDay - b.dueDay);
}

export function goalRows() {
  return getState().goals.map((g) => ({
    ...g,
    pct: g.target > 0 ? Math.round((g.saved / g.target) * 100) : 0,
    left: g.target - g.saved,
  }));
}

export function recentTransactions(n) {
  return getState().transactions.slice(0, n);
}
