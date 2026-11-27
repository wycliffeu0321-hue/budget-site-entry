// HomeLedger views — each returns an HTML string for the app shell.

import {
  fmt$,
  fmt$0,
  getState,
  monthIncome,
  monthSpent,
  spentByCategory,
  budgetRows,
  upcomingBills,
  allBillsSorted,
  goalRows,
  recentTransactions,
} from './store.js';
import { CATEGORIES, categoryById, MONTHLY_HISTORY, CURRENT_MONTH_LABEL } from './data.js';

const esc = (s) => String(s)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;');

const prettyDate = (iso) => {
  const parts = iso.split('-');
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return months[Number(parts[1]) - 1] + ' ' + Number(parts[2]);
};

const barClass = (pct) => (pct >= 100 ? 'bar-red' : pct >= 80 ? 'bar-amber' : 'bar-green');

function progressBar(pct, colour) {
  const width = Math.max(0, Math.min(100, pct));
  const style = colour ? ' style="width:' + width + '%;background:' + colour + '"' : ' style="width:' + width + '%"';
  const cls = colour ? 'bar-fill' : 'bar-fill ' + barClass(pct);
  return '<div class="bar"><div class="' + cls + '"' + style + '></div></div>';
}

// ------------------------------------------------------------ SVG charts

export function donutSVG(totals, size = 190) {
  const entries = Object.entries(totals).sort((a, b) => b[1] - a[1]);
  const total = entries.reduce((s, [, v]) => s + v, 0) || 1;
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - 6;
  const inner = r * 0.62;
  let angle = -Math.PI / 2;
  let paths = '';
  for (const [id, value] of entries) {
    const sweep = (value / total) * Math.PI * 2;
    const a0 = angle;
    const a1 = angle + sweep;
    angle = a1;
    const large = sweep > Math.PI ? 1 : 0;
    const x0 = cx + r * Math.cos(a0), y0 = cy + r * Math.sin(a0);
    const x1 = cx + r * Math.cos(a1), y1 = cy + r * Math.sin(a1);
    const xi1 = cx + inner * Math.cos(a1), yi1 = cy + inner * Math.sin(a1);
    const xi0 = cx + inner * Math.cos(a0), yi0 = cy + inner * Math.sin(a0);
    const colour = categoryById(id).colour;
    if (entries.length === 1) {
      paths += '<circle cx="' + cx + '" cy="' + cy + '" r="' + ((r + inner) / 2) + '" fill="none" stroke="' + colour + '" stroke-width="' + (r - inner) + '"/>';
    } else {
      paths += '<path d="M ' + x0.toFixed(1) + ' ' + y0.toFixed(1) +
        ' A ' + r + ' ' + r + ' 0 ' + large + ' 1 ' + x1.toFixed(1) + ' ' + y1.toFixed(1) +
        ' L ' + xi1.toFixed(1) + ' ' + yi1.toFixed(1) +
        ' A ' + inner + ' ' + inner + ' 0 ' + large + ' 0 ' + xi0.toFixed(1) + ' ' + yi0.toFixed(1) +
        ' Z" fill="' + colour + '"/>';
    }
  }
  return '<svg class="donut" width="' + size + '" height="' + size + '" viewBox="0 0 ' + size + ' ' + size + '" role="img" aria-label="Spending by category">' +
    paths +
    '<text x="' + cx + '" y="' + (cy - 4) + '" class="donut-total">' + fmt$0(total) + '</text>' +
    '<text x="' + cx + '" y="' + (cy + 16) + '" class="donut-label">spent</text></svg>';
}

export function barChartSVG(history, width = 640, height = 250) {
  const max = Math.max(...history.map((h) => Math.max(h.income, h.spent))) * 1.12;
  const padL = 8, padB = 26, padT = 14;
  const plotH = height - padB - padT;
  const groupW = (width - padL * 2) / history.length;
  const barW = Math.min(26, groupW / 3.4);
  let out = '<svg class="barchart" viewBox="0 0 ' + width + ' ' + height + '" role="img" aria-label="Income versus spending by month">';
  // gridlines
  for (let i = 1; i <= 3; i++) {
    const y = padT + plotH - (plotH * i) / 3;
    out += '<line x1="' + padL + '" y1="' + y + '" x2="' + (width - padL) + '" y2="' + y + '" class="gridline"/>';
  }
  history.forEach((h, i) => {
    const gx = padL + i * groupW + groupW / 2;
    const ih = (h.income / max) * plotH;
    const sh = (h.spent / max) * plotH;
    const base = padT + plotH;
    out += '<rect x="' + (gx - barW - 3) + '" y="' + (base - ih) + '" width="' + barW + '" height="' + ih + '" rx="4" class="bar-income"/>';
    out += '<rect x="' + (gx + 3) + '" y="' + (base - sh) + '" width="' + barW + '" height="' + sh + '" rx="4" class="bar-spent"/>';
    out += '<text x="' + gx + '" y="' + (height - 8) + '" class="axis-label">' + h.month + '</text>';
  });
  out += '</svg>';
  return out;
}

// --------------------------------------------------------------- pieces

function txRow(t, withDelete) {
  const cat = categoryById(t.categoryId);
  const amountCls = t.amount < 0 ? 'amt-out' : 'amt-in';
  const del = withDelete
    ? '<td class="col-action"><button class="btn btn-ghost btn-small" data-delete-tx="' + t.id + '" title="Delete transaction">Delete</button></td>'
    : '';
  return '<tr>' +
    '<td class="col-date">' + prettyDate(t.date) + '</td>' +
    '<td>' + esc(t.description) + '<span class="tx-account">' + esc(t.account) + '</span></td>' +
    '<td><span class="cat-chip"><span class="dot" style="background:' + cat.colour + '"></span>' + cat.name + '</span></td>' +
    '<td class="col-amt ' + amountCls + '">' + (t.amount < 0 ? '-' : '+') + fmt$(Math.abs(t.amount)).slice(0) + '</td>' +
    del + '</tr>';
}

// ------------------------------------------------------------ dashboard

export function dashboardView() {
  const income = monthIncome();
  const spent = monthSpent();
  const left = income - spent;
  const rate = income > 0 ? Math.round(((income - spent) / income) * 100) : 0;
  const totals = spentByCategory();
  const budgets = budgetRows().slice().sort((a, b) => b.pct - a.pct).slice(0, 4);
  const bills = upcomingBills().slice(0, 3);
  const goals = goalRows();
  const recent = recentTransactions(6);

  const legend = Object.entries(totals)
    .sort((a, b) => b[1] - a[1])
    .map(([id, v]) => {
      const cat = categoryById(id);
      return '<li><span class="dot" style="background:' + cat.colour + '"></span><span class="legend-name">' + cat.name + '</span><span class="legend-amt">' + fmt$0(v) + '</span></li>';
    }).join('');

  const budgetHtml = budgets.map((r) =>
    '<div class="mini-budget">' +
      '<div class="mini-budget-head"><span>' + r.category.name + '</span><span class="muted">' + fmt$0(r.spent) + ' of ' + fmt$0(r.limit) + '</span></div>' +
      progressBar(r.pct) +
    '</div>').join('');

  const billsHtml = bills.length
    ? bills.map((b) => '<li><span class="bill-when">Nov ' + b.dueDay + '</span><span class="bill-name">' + esc(b.name) + '</span><span class="bill-amt">' + fmt$(b.amount) + '</span></li>').join('')
    : '<li class="muted">All bills are paid for November.</li>';

  const goalsHtml = goals.map((g) =>
    '<div class="mini-budget">' +
      '<div class="mini-budget-head"><span>' + esc(g.name) + '</span><span class="muted">' + g.pct + '%</span></div>' +
      progressBar(g.pct, '#1E6B52') +
    '</div>').join('');

  return '' +
  '<section class="page-head"><h1>Dashboard</h1><p class="muted">' + CURRENT_MONTH_LABEL + ' at a glance for the Miller family.</p></section>' +
  '<section class="cards">' +
    '<div class="card stat"><span class="stat-label">Income</span><span class="stat-value">' + fmt$0(income) + '</span><span class="stat-sub">2 paychecks this month</span></div>' +
    '<div class="card stat"><span class="stat-label">Spent</span><span class="stat-value">' + fmt$0(spent) + '</span><span class="stat-sub">' + getState().transactions.filter((t) => t.amount < 0).length + ' purchases &amp; bills</span></div>' +
    '<div class="card stat"><span class="stat-label">Left to spend</span><span class="stat-value accent">' + fmt$0(left) + '</span><span class="stat-sub">before December 1</span></div>' +
    '<div class="card stat"><span class="stat-label">Savings rate</span><span class="stat-value">' + rate + '%</span><span class="stat-sub">of income kept so far</span></div>' +
  '</section>' +
  '<section class="grid-2">' +
    '<div class="card"><h2>Spending by category</h2><div class="donut-wrap">' + donutSVG(totals) + '<ul class="legend">' + legend + '</ul></div></div>' +
    '<div class="card"><h2>Budgets to watch</h2>' + budgetHtml + '<p class="card-link"><a href="#/budgets">See all budgets</a></p></div>' +
  '</section>' +
  '<section class="grid-2">' +
    '<div class="card"><h2>Upcoming bills</h2><ul class="bill-list">' + billsHtml + '</ul><p class="card-link"><a href="#/bills">See all bills</a></p></div>' +
    '<div class="card"><h2>Savings goals</h2>' + goalsHtml + '<p class="card-link"><a href="#/goals">See all goals</a></p></div>' +
  '</section>' +
  '<section class="card"><h2>Recent activity</h2><table class="tx-table"><tbody>' +
    recent.map((t) => txRow(t, false)).join('') +
  '</tbody></table><p class="card-link"><a href="#/transactions">See all transactions</a></p></section>';
}

// ---------------------------------------------------------- transactions

export function transactionsView(filter = {}) {
  const s = getState();
  const catFilter = filter.category || 'all';
  const query = (filter.query || '').toLowerCase();
  const rows = s.transactions.filter((t) => {
    if (catFilter !== 'all' && t.categoryId !== catFilter) return false;
    if (query && !t.description.toLowerCase().includes(query)) return false;
    return true;
  });
  const totalIn = rows.filter((t) => t.amount > 0).reduce((sum, t) => sum + t.amount, 0);
  const totalOut = -rows.filter((t) => t.amount < 0).reduce((sum, t) => sum + t.amount, 0);

  const options = ['<option value="all">All categories</option>']
    .concat(CATEGORIES.map((c) => '<option value="' + c.id + '"' + (c.id === catFilter ? ' selected' : '') + '>' + c.name + '</option>'))
    .join('');
  const formOptions = CATEGORIES.filter((c) => c.id !== 'income')
    .map((c) => '<option value="' + c.id + '">' + c.name + '</option>').join('');

  return '' +
  '<section class="page-head"><h1>Transactions</h1><p class="muted">Every dollar in and out for ' + CURRENT_MONTH_LABEL + '.</p></section>' +
  '<section class="card">' +
    '<form id="tx-form" class="tx-form">' +
      '<label>Date<input type="date" name="date" value="2026-11-27" required></label>' +
      '<label class="grow">Description<input type="text" name="description" placeholder="e.g. Weekly groceries" required></label>' +
      '<label>Category<select name="categoryId">' + formOptions + '</select></label>' +
      '<label>Amount $<input type="number" name="amount" step="0.01" min="0.01" placeholder="0.00" required></label>' +
      '<button class="btn btn-primary" type="submit">Add expense</button>' +
    '</form>' +
    '<div class="tx-tools">' +
      '<label>Filter<select id="tx-filter">' + options + '</select></label>' +
      '<label class="grow">Search<input type="search" id="tx-search" placeholder="Search descriptions" value="' + esc(filter.query || '') + '"></label>' +
    '</div>' +
    '<table class="tx-table"><thead><tr><th>Date</th><th>Description</th><th>Category</th><th class="col-amt">Amount</th><th></th></tr></thead><tbody>' +
      (rows.length ? rows.map((t) => txRow(t, true)).join('') : '<tr><td colspan="5" class="muted empty-row">No transactions match.</td></tr>') +
    '</tbody></table>' +
    '<div class="tx-totals"><span>In: <strong class="amt-in">' + fmt$(totalIn) + '</strong></span><span>Out: <strong class="amt-out">' + fmt$(totalOut) + '</strong></span><span>Net: <strong>' + fmt$(totalIn - totalOut) + '</strong></span></div>' +
  '</section>';
}

// --------------------------------------------------------------- budgets

export function budgetsView() {
  const rows = budgetRows();
  const totalLimit = rows.reduce((s, r) => s + r.limit, 0);
  const totalSpent = rows.reduce((s, r) => s + r.spent, 0);
  const cards = rows.map((r) => {
    const status = r.pct >= 100 ? 'Over budget' : r.pct >= 80 ? 'Getting close' : 'On track';
    return '<div class="card budget-card">' +
      '<div class="budget-head"><span class="cat-chip"><span class="dot" style="background:' + r.category.colour + '"></span><strong>' + r.category.name + '</strong></span><span class="badge ' + barClass(r.pct) + '-badge">' + status + '</span></div>' +
      '<div class="budget-nums"><span class="budget-spent">' + fmt$0(r.spent) + '</span><span class="muted"> spent of </span>' +
      '<span class="budget-left">' + fmt$0(Math.abs(r.left)) + (r.left < 0 ? ' over' : ' left') + '</span></div>' +
      progressBar(r.pct) +
      '<div class="budget-edit"><label>Monthly limit $<input type="number" min="0" step="10" value="' + r.limit + '" data-budget-input="' + r.category.id + '"></label>' +
      '<span class="muted">' + r.pct + '% used</span></div>' +
    '</div>';
  }).join('');
  return '' +
  '<section class="page-head"><h1>Budgets</h1><p class="muted">November limits by category — edit a limit and it saves instantly. Total planned: ' + fmt$0(totalLimit) + ', spent so far: ' + fmt$0(totalSpent) + '.</p></section>' +
  '<section class="budget-grid">' + cards + '</section>';
}

// ----------------------------------------------------------------- bills

export function billsView() {
  const bills = allBillsSorted();
  const total = bills.reduce((s, b) => s + b.amount, 0);
  const unpaid = bills.filter((b) => !b.paid).reduce((s, b) => s + b.amount, 0);
  const rows = bills.map((b) =>
    '<div class="card bill-card' + (b.paid ? ' is-paid' : '') + '">' +
      '<div class="bill-main"><span class="bill-day">Nov ' + b.dueDay + '</span>' +
      '<div><strong>' + esc(b.name) + '</strong><span class="bill-tags">' +
        (b.autopay ? '<span class="tag">Autopay</span>' : '<span class="tag tag-manual">Manual</span>') +
        (b.paid ? '<span class="tag tag-paid">Paid</span>' : '<span class="tag tag-due">Due</span>') +
      '</span></div></div>' +
      '<div class="bill-side"><span class="bill-amount">' + fmt$(b.amount) + '</span>' +
      '<button class="btn ' + (b.paid ? 'btn-ghost' : 'btn-primary') + ' btn-small" data-toggle-bill="' + b.id + '">' + (b.paid ? 'Mark unpaid' : 'Mark paid') + '</button></div>' +
    '</div>').join('');
  return '' +
  '<section class="page-head"><h1>Bills</h1><p class="muted">Recurring bills for November. Monthly total ' + fmt$(total) + ' — still to pay: ' + fmt$(unpaid) + '.</p></section>' +
  '<section class="bill-stack">' + rows + '</section>';
}

// ----------------------------------------------------------------- goals

export function goalsView() {
  const goals = goalRows();
  const cards = goals.map((g) =>
    '<div class="card goal-card">' +
      '<h2>' + esc(g.name) + '</h2>' +
      '<div class="goal-nums"><span class="goal-saved">' + fmt$0(g.saved) + '</span><span class="muted"> of ' + fmt$0(g.target) + ' · ' + fmt$0(g.left) + ' to go</span></div>' +
      progressBar(g.pct, '#1E6B52') +
      '<div class="goal-foot"><span class="muted">' + g.pct + '% there</span>' +
      '<button class="btn btn-primary btn-small" data-add-goal="' + g.id + '"' + (g.saved >= g.target ? ' disabled' : '') + '>Add $50</button></div>' +
    '</div>').join('');
  return '' +
  '<section class="page-head"><h1>Savings goals</h1><p class="muted">What the Millers are putting money aside for. Add $50 with one tap.</p></section>' +
  '<section class="budget-grid">' + cards + '</section>';
}

// --------------------------------------------------------------- reports

export function reportsView() {
  const totals = spentByCategory();
  const maxCat = Math.max(...Object.values(totals));
  const income = monthIncome();
  const spent = monthSpent();
  const topEntry = Object.entries(totals).sort((a, b) => b[1] - a[1])[0];
  const topCat = categoryById(topEntry[0]);
  const diningPct = Math.round(((totals.dining || 0) / spent) * 100);
  const avgSpent = Math.round(MONTHLY_HISTORY.slice(0, 5).reduce((s, h) => s + h.spent, 0) / 5);

  const hbars = Object.entries(totals).sort((a, b) => b[1] - a[1]).map(([id, v]) => {
    const cat = categoryById(id);
    const w = Math.round((v / maxCat) * 100);
    return '<div class="hbar-row"><span class="hbar-name">' + cat.name + '</span>' +
      '<div class="bar hbar"><div class="bar-fill" style="width:' + w + '%;background:' + cat.colour + '"></div></div>' +
      '<span class="hbar-amt">' + fmt$0(v) + '</span></div>';
  }).join('');

  return '' +
  '<section class="page-head"><h1>Reports</h1><p class="muted">Six months of the Miller household, and where November\u2019s money went.</p></section>' +
  '<section class="card"><h2>Income vs spending</h2>' +
    '<div class="chart-legend"><span><span class="dot" style="background:#1E6B52"></span>Income</span><span><span class="dot" style="background:#E8A33D"></span>Spending</span></div>' +
    barChartSVG(MONTHLY_HISTORY) +
  '</section>' +
  '<section class="card"><h2>November by category</h2>' + hbars + '</section>' +
  '<section class="card"><h2>Insights</h2><ul class="insights">' +
    '<li>' + topCat.name + ' is November\u2019s biggest cost at ' + fmt$0(topEntry[1]) + ' — ' + Math.round((topEntry[1] / spent) * 100) + '% of everything spent.</li>' +
    '<li>Spending of ' + fmt$0(spent) + ' is running ' + fmt$0(Math.max(0, avgSpent - Math.round(spent))) + ' below the June–October average of ' + fmt$0(avgSpent) + ', while income held steady at ' + fmt$0(income) + '.</li>' +
    '<li>Dining out took ' + fmt$0(totals.dining || 0) + ' (' + diningPct + '% of spending) — the family\u2019s most flexible lever before December.</li>' +
  '</ul></section>';
}
