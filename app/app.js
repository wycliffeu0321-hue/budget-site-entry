// HomeLedger app — hash router, shell rendering and event wiring.

import {
  dashboardView,
  transactionsView,
  budgetsView,
  billsView,
  goalsView,
  reportsView,
} from './views.js';
import {
  getState,
  addTransaction,
  deleteTransaction,
  setBudgetLimit,
  toggleBillPaid,
  addToGoal,
} from './store.js';
import { CURRENT_MONTH_LABEL, FAMILY_NAME } from './data.js';

const NAV = [
  { hash: '#/', label: 'Dashboard' },
  { hash: '#/transactions', label: 'Transactions' },
  { hash: '#/budgets', label: 'Budgets' },
  { hash: '#/bills', label: 'Bills' },
  { hash: '#/goals', label: 'Goals' },
  { hash: '#/reports', label: 'Reports' },
];

const txFilterState = { category: 'all', query: '' };

function currentRoute() {
  const hash = location.hash || '#/';
  return NAV.some((n) => n.hash === hash) ? hash : '#/';
}

function shell(route, bodyHtml) {
  const links = NAV.map((n) =>
    '<a href="' + n.hash + '" class="nav-link' + (n.hash === route ? ' active' : '') + '">' + n.label + '</a>'
  ).join('');
  return '' +
  '<aside class="sidebar">' +
    '<div class="brand"><span class="brand-mark">HL</span><div><strong>HomeLedger</strong><span class="brand-sub">' + FAMILY_NAME + '</span></div></div>' +
    '<nav class="nav">' + links + '</nav>' +
    '<div class="sidebar-foot"><span class="month-pill">' + CURRENT_MONTH_LABEL + '</span></div>' +
  '</aside>' +
  '<main class="content">' + bodyHtml + '</main>';
}

function render() {
  getState(); // ensure the store is seeded before any view reads it
  const route = currentRoute();
  let body;
  if (route === '#/transactions') body = transactionsView(txFilterState);
  else if (route === '#/budgets') body = budgetsView();
  else if (route === '#/bills') body = billsView();
  else if (route === '#/goals') body = goalsView();
  else if (route === '#/reports') body = reportsView();
  else body = dashboardView();
  document.getElementById('app').innerHTML = shell(route, body);
  wireEvents(route);
}

function wireEvents(route) {
  const root = document.getElementById('app');

  root.querySelectorAll('[data-delete-tx]').forEach((btn) => {
    btn.addEventListener('click', () => {
      deleteTransaction(btn.getAttribute('data-delete-tx'));
      render();
    });
  });

  root.querySelectorAll('[data-toggle-bill]').forEach((btn) => {
    btn.addEventListener('click', () => {
      toggleBillPaid(btn.getAttribute('data-toggle-bill'));
      render();
    });
  });

  root.querySelectorAll('[data-add-goal]').forEach((btn) => {
    btn.addEventListener('click', () => {
      addToGoal(btn.getAttribute('data-add-goal'), 50);
      render();
    });
  });

  root.querySelectorAll('[data-budget-input]').forEach((input) => {
    input.addEventListener('change', () => {
      setBudgetLimit(input.getAttribute('data-budget-input'), input.value);
      render();
    });
  });

  if (route === '#/transactions') {
    const form = document.getElementById('tx-form');
    if (form) {
      form.addEventListener('submit', (ev) => {
        ev.preventDefault();
        const data = new FormData(form);
        const amount = Math.abs(parseFloat(data.get('amount')));
        if (!amount || amount <= 0) return;
        addTransaction({
          date: data.get('date') || '2026-11-27',
          description: String(data.get('description') || 'Expense').trim(),
          categoryId: data.get('categoryId'),
          amount: -amount,
        });
        render();
      });
    }
    const filterSel = document.getElementById('tx-filter');
    if (filterSel) {
      filterSel.addEventListener('change', () => {
        txFilterState.category = filterSel.value;
        render();
        const el = document.getElementById('tx-filter');
        if (el) el.focus();
      });
    }
    const search = document.getElementById('tx-search');
    if (search) {
      search.addEventListener('input', () => {
        txFilterState.query = search.value;
        const pos = search.selectionStart;
        render();
        const el = document.getElementById('tx-search');
        if (el) {
          el.focus();
          try { el.setSelectionRange(pos, pos); } catch (err) { /* search inputs vary */ }
        }
      });
    }
  }
}

window.addEventListener('hashchange', render);
render();
