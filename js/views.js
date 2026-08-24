import { $, $$, fmt0, fmt2, esc, animateMoney, revealInit, fromISO, iso, addDays, weekStart } from './utils.js';
import { state, MONTHS, catById, inMonth, totals, catTotals, allMonths, mLabel, mFull } from './data.js';

export function renderTopbar() {
  const monthLabel = $('#monthLabel');
  const netChip = $('#netChip');
  const netChipVal = $('#netChipVal');
  const txBadge = $('#txBadge');
  const sideNet = $('#sideNet');

  if (monthLabel) monthLabel.textContent = `${MONTHS[state.cursor.m]} ${state.cursor.y}`;

  const t = totals(state.cursor.y, state.cursor.m);
  if (netChip) netChip.classList.toggle('neg', t.net < 0);
  if (netChipVal) animateMoney(netChipVal, t.net, fmt0);
  if (txBadge) txBadge.textContent = state.TX.filter(x => inMonth(x, state.cursor.y, state.cursor.m)).length;

  const allNet = state.TX.reduce((s, t) => s + (t.type === 'in' ? t.amount : -t.amount), 0);
  if (sideNet) animateMoney(sideNet, allNet, fmt0);
}

export function renderTransactions() {
  console.log(' renderTransactions called');
  console.log(' Total transactions in state:', state.TX.length);

  const list = $('#txList');
  if (!list) {
    console.error('❌ #txList element not found in HTML!');
    return;
  }

  const { y, m } = state.cursor;

  // Filter strictly by year and month using string splitting (avoids timezone bugs)
  const rows = state.TX.filter(t => {
    const parts = t.date.split('-');
    return parseInt(parts[0]) === y && (parseInt(parts[1]) - 1) === m;
  });

  console.log(`📅 Transactions in ${mFull(state.cursor)}:`, rows.length);

  // Apply filters
  let filteredRows = rows;
  if (state.txFilters.seg !== 'all') {
    filteredRows = filteredRows.filter(t => t.type === state.txFilters.seg);
  }
  if (state.txFilters.q) {
    const q = state.txFilters.q.toLowerCase();
    filteredRows = filteredRows.filter(t => {
      const note = (t.note || '').toLowerCase();
      const cat = catById(t.cat).name.toLowerCase();
      return note.includes(q) || cat.includes(q);
    });
  }

  // Sort by date (newest first)
  filteredRows.sort((a, b) => b.date.localeCompare(a.date));

  const sumIn = filteredRows.filter(r => r.type === 'in').reduce((s, r) => s + r.amount, 0);
  const sumOut = filteredRows.filter(r => r.type === 'out').reduce((s, r) => s + r.amount, 0);

  const txSummary = $('#txSummary');
  if (txSummary) {
    txSummary.textContent = `${filteredRows.length} shown · +${fmt0(sumIn)} / −${fmt0(sumOut)}`;
  }

  const txMonthSub = $('#txMonthSub');
  if (txMonthSub) txMonthSub.textContent = mFull(state.cursor);

  if (!filteredRows.length) {
    console.log('⚠️ No rows to display');
    list.innerHTML = `<div class="empty"><div class="big">🍃</div><p>No matching transactions in ${mFull(state.cursor)}.</p></div>`;
    return;
  }

  // Build HTML
  let html = '';
  let lastDate = '';

  for (const t of filteredRows) {
    if (t.date !== lastDate) {
      lastDate = t.date;
      const d = fromISO(t.date);
      const dateStr = d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
      html += `<div class="date-head"><span>${dateStr}</span></div>`;
    }

    const c = catById(t.cat);
    html += `<div class="tx-row" data-id="${t.id}">
      <div class="cat-ico" style="background:color-mix(in srgb,${c.color} 16%,#fff)">${c.emoji}</div>
      <div class="meta"><b>${esc(t.note || c.name)}</b><small>${c.name}</small></div>
      <span class="amt ${t.type === 'in' ? 'pos' : 'neg'}">${t.type === 'in' ? '+' : '−'}${fmt2(t.amount)}</span>
      <button class="del" data-del="${t.id}" title="Delete">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2m-8 0 1 13h8l1-13"/></svg>
      </button>
    </div>`;
  }

  console.log(`✅ Generated HTML for ${filteredRows.length} transactions`);
  list.innerHTML = html;
}

export function renderOverview() {
  const t = totals(state.cursor.y, state.cursor.m);
  const pm = new Date(state.cursor.y, state.cursor.m - 1, 1);
  const pt = totals(pm.getFullYear(), pm.getMonth());
  const dIn = pt.in ? ((t.in - pt.in) / pt.in * 100) : 0;
  const dOut = pt.out ? ((t.out - pt.out) / pt.out * 100) : 0;
  const rate = t.in > 0 ? Math.max(0, (t.in - t.out) / t.in) : 0;
  const topCats = catTotals(state.cursor.y, state.cursor.m, 'out');

  const sparkMonths = [];
  for (let k = 5; k >= 0; k--) {
    const d = new Date(state.cursor.y, state.cursor.m - k, 1);
    sparkMonths.push(totals(d.getFullYear(), d.getMonth()).net);
  }

  const ovGrid = $('#ovGrid');
  if (!ovGrid) return;

  ovGrid.innerHTML = `
  <div class="card hero reveal">
    <div class="rings"><i></i><i></i><i></i></div>
    <span class="eyebrow">Net position — ${MONTHS[state.cursor.m]}</span>
    <span class="net-tag ${t.net >= 0 ? 'pos' : 'neg'}">${t.net >= 0 ? '▲ surplus' : '▼ deficit'} ${fmt0(Math.abs(t.net))}</span>
    <div class="big-amt"><span class="cur">HK$</span><span id="heroAmt">0</span></div>
    <div class="hero-sub">inflow minus outflow · ${state.TX.filter(x => inMonth(x, state.cursor.y, state.cursor.m)).length} transactions this month</div>
    <div class="hero-row">
      <div class="mini-stats">
        <div class="mini"><span><i style="background:var(--leaf)"></i>Inflow</span><b id="heroIn">$0</b><em class="${dIn >= 0 ? 'down' : 'up'}">${dIn >= 0 ? '▲' : '▼'} ${Math.abs(dIn).toFixed(1)}% MoM</em></div>
        <div class="mini"><span><i style="background:var(--coral)"></i>Outflow</span><b id="heroOut">$0</b><em class="${dOut <= 0 ? 'down' : 'up'}">${dOut >= 0 ? '▲' : '▼'} ${Math.abs(dOut).toFixed(1)}% MoM</em></div>
      </div>
      <div class="spark-wrap"><small>6-mo net</small><div id="sparkline"></div></div>
    </div>
  </div>

  <div class="card ring-card hoverable reveal">
    <div class="ring-svg">
      <svg viewBox="0 0 120 120" width="148" height="148">
        <circle class="ring-track" cx="60" cy="60" r="50" fill="none" stroke-width="11"/>
        <circle class="ring-prog" id="ringProg" cx="60" cy="60" r="50" fill="none" stroke-width="11"
          stroke-dasharray="${2 * Math.PI * 50}" stroke-dashoffset="${2 * Math.PI * 50}" transform="rotate(-90 60 60)"/>
      </svg>
      <div class="ctr"><b id="ringPct">0%</b><small>kept</small></div>
    </div>
    <div class="ring-info">
      <h3>Savings rate</h3>
      <p>${t.in > 0
        ? (t.net >= 0
          ? `You kept <b>${fmt0(t.net)}</b> of the <b>${fmt0(t.in)}</b> that came in this month.`
          : `Outflow exceeded inflow by <b>${fmt0(Math.abs(t.net))}</b>. Time to trim the plan.`)
        : `No inflow recorded in ${MONTHS[state.cursor.m]} yet.`}</p>
    </div>
  </div>

  <div class="signals" id="signalRow"></div>

  <div class="card span-7 hoverable reveal">
    <div class="card-head">
      <div><h3>Cashflow</h3><div class="sub">last 6 months ending ${mLabel(state.cursor)} ${state.cursor.y}</div></div>
      <div class="legend"><span><i style="background:var(--leaf)"></i>Inflow</span><span><i style="background:var(--coral)"></i>Outflow</span></div>
    </div>
    <div class="chart-wrap" id="cashflowWrap"></div>
  </div>

  <div class="card span-5 hoverable reveal">
    <div class="card-head"><div><h3>Where it goes</h3><div class="sub">outflow by category</div></div></div>
    <div class="donut-flex" id="donutWrap"></div>
  </div>

  <div class="card span-7 reveal">
    <div class="card-head"><div><h3>Recent activity</h3></div><button class="link-more" data-goto="transactions">See all →</button></div>
    <div id="recentList"></div>
  </div>

  <div class="card span-5 reveal">
    <div class="card-head"><div><h3>Budget pulse</h3><div class="sub">click a limit in Budgets to edit</div></div><button class="link-more" data-goto="budgets">Manage →</button></div>
    <div id="budgetSnap"></div>
  </div>`;

  const heroAmt = $('#heroAmt');
  const heroIn = $('#heroIn');
  const heroOut = $('#heroOut');
  if (heroAmt) animateMoney(heroAmt, t.net, fmt0);
  if (heroIn) animateMoney(heroIn, t.in, fmt0);
  if (heroOut) animateMoney(heroOut, t.out, fmt0);

  requestAnimationFrame(() => requestAnimationFrame(() => {
    const ringProg = $('#ringProg');
    const ringPct = $('#ringPct');
    if (ringProg) ringProg.style.strokeDashoffset = 2 * Math.PI * 50 * (1 - Math.min(1, rate));
    if (ringPct) ringPct.textContent = Math.round(rate * 100) + '%';
  }));

  renderSignals(topCats, t, pt);
  renderRecent();
  renderBudgetSnap();
  revealInit(ovGrid);
}

function renderSignals(topCats, t, pt) {
  const sigs = [];
  if (topCats[0]) {
    const pct = t.out ? Math.round(topCats[0].v / t.out * 100) : 0;
    sigs.push({ i: '🔍', bg: '#FFF3E2', txt: `Top spend: <b>${topCats[0].cat.emoji} ${topCats[0].cat.name}</b> — <b>${fmt0(topCats[0].v)}</b> (${pct}% of outflow)` });
  }
  if (pt.out > 0) {
    const ch = (t.out - pt.out) / pt.out * 100;
    sigs.push({
      i: ch <= 0 ? '🌱' : '🔥', bg: ch <= 0 ? 'var(--leaf-soft)' : '#FDE3DF',
      txt: `Outflow is <b>${ch <= 0 ? 'down' : 'up'} ${Math.abs(ch).toFixed(0)}%</b> vs ${MONTHS[new Date(state.cursor.y, state.cursor.m - 1, 1).getMonth()].slice(0, 3)}`
    });
  }
  const outs = state.TX.filter(x => x.type === 'out' && inMonth(x, state.cursor.y, state.cursor.m)).sort((a, b) => b.amount - a.amount);
  if (outs[0]) {
    const d = fromISO(outs[0].date);
    sigs.push({ i: '🧾', bg: '#EAF1FB', txt: `Biggest single outflow: <b>${esc(outs[0].note || catById(outs[0].cat).name)}</b> · ${fmt0(outs[0].amount)} on ${MONTHS[d.getMonth()].slice(0, 3)} ${d.getDate()}` });
  }
  if (!sigs.length) sigs.push({ i: '🌱', bg: 'var(--leaf-soft)', txt: `No activity yet this month. Add your first transaction to see signals.` });

  const signalRow = $('#signalRow');
  if (signalRow) {
    signalRow.innerHTML = sigs.slice(0, 3).map(s => `<div class="sig reveal"><div class="ico" style="background:${s.bg}">${s.i}</div><p>${s.txt}</p></div>`).join('');
  }
}

function txRowHtml(t) {
  const c = catById(t.cat);
  const d = fromISO(t.date);
  return `<div class="tx-row" data-id="${t.id}">
    <div class="cat-ico" style="background:color-mix(in srgb,${c.color} 16%,#fff)">${c.emoji}</div>
    <div class="meta"><b>${esc(t.note || c.name)}</b><small>${c.name} · ${MONTHS[d.getMonth()].slice(0, 3)} ${d.getDate()}</small></div>
    <span class="amt ${t.type === 'in' ? 'pos' : 'neg'}">${t.type === 'in' ? '+' : '−'}${fmt2(t.amount)}</span>
    <button class="del" data-del="${t.id}" title="Delete"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2m-8 0 1 13h8l1-13"/></svg></button>
  </div>`;
}

function renderRecent() {
  const list = $('#recentList');
  if (!list) return;
  const rows = state.TX.filter(t => inMonth(t, state.cursor.y, state.cursor.m))
    .sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id)).slice(0, 6);
  list.innerHTML = rows.length ? rows.map(txRowHtml).join('')
    : `<div class="empty"><div class="big"></div><p>Nothing planned in ${mFull(state.cursor)} yet.</p></div>`;
}

function renderBudgetSnap() {
  const el = $('#budgetSnap');
  if (!el) return;
  const spent = {};
  for (const t of state.TX) if (t.type === 'out' && inMonth(t, state.cursor.y, state.cursor.m)) spent[t.cat] = (spent[t.cat] || 0) + t.amount;
  const rows = Object.entries(state.BG).map(([id, lim]) => ({ cat: catById(id), lim, v: spent[id] || 0 }))
    .map(r => ({ ...r, pct: r.lim ? r.v / r.lim : 0 })).sort((a, b) => b.pct - a.pct).slice(0, 4);
  if (!rows.length) { el.innerHTML = '<div class="empty"><p>No budgets set.</p></div>'; return; }
  el.innerHTML = rows.map(r => {
    const cls = r.pct >= 1 ? 'over' : r.pct >= .8 ? 'warn' : 'ok';
    const st = r.pct >= 1 ? `over by ${fmt0(r.v - r.lim)}` : `${fmt0(r.lim - r.v)} left`;
    return `<div class="b-row"><div class="b-top"><div class="cat-ico" style="width:32px;height:32px;font-size:14px;border-radius:9px;background:color-mix(in srgb,${r.cat.color} 16%,#fff)">${r.cat.emoji}</div>
      <b>${r.cat.name}</b><span class="b-nums">${fmt0(r.v)} / ${fmt0(r.lim)}</span></div>
      <div class="bar"><i class="${cls}" data-w="${Math.min(100, r.pct * 100)}"></i></div>
      <div class="b-state ${cls === 'ok' ? 'good' : cls}">${st}</div></div>`;
  }).join('');
  requestAnimationFrame(() => requestAnimationFrame(() => el.querySelectorAll('.bar i').forEach(i => i.style.width = i.dataset.w + '%')));
}

export function renderBudgets() {
  const spent = {};
  for (const t of state.TX) if (t.type === 'out' && inMonth(t, state.cursor.y, state.cursor.m)) spent[t.cat] = (spent[t.cat] || 0) + t.amount;
  const rows = Object.entries(state.BG).map(([id, lim]) => ({ cat: catById(id), lim, v: spent[id] || 0 }));
  const totLim = rows.reduce((s, r) => s + r.lim, 0), totSp = rows.reduce((s, r) => s + r.v, 0);
  const pct = totLim ? totSp / totLim : 0;

  const budgetWrap = $('#budgetWrap');
  if (!budgetWrap) return;

  budgetWrap.innerHTML = `
  <div class="card span-12 reveal">
    <div class="card-head"><div><h3>Monthly budgets</h3><div class="sub">${mFull(state.cursor)} · click any limit to edit it</div></div>
      <div class="legend"><span><i style="background:var(--leaf)"></i>Under</span><span><i style="background:var(--amber)"></i>≥ 80%</span><span><i style="background:var(--coral)"></i>Over</span></div>
    </div>
    <div class="budget-hero">
      <div style="min-width:200px"><span class="eyebrow" style="color:var(--ink-faint)">Total envelope</span>
        <div style="font-family:var(--mono);font-size:24px;margin-top:6px"><b>${fmt0(totSp)}</b> <span style="color:var(--ink-faint);font-size:15px">/ ${fmt0(totLim)}</span></div>
        <div class="b-state ${pct >= 1 ? 'over' : pct >= .8 ? 'warn' : 'good'}" style="margin-top:2px">${pct >= 1 ? `over by ${fmt0(totSp - totLim)}` : `${fmt0(totLim - totSp)} remaining · ${Math.round(pct * 100)}% used`}</div>
      </div>
      <div class="big-bar"><i class="${pct >= 1 ? 'over' : pct >= .8 ? 'warn' : ''}" data-w="${Math.min(100, pct * 100)}"></i></div>
    </div>
  </div>
  <div class="card span-7 reveal">
    <div class="card-head"><h3>By category</h3></div>
    ${rows.sort((a, b) => (b.v / (b.lim || 1)) - (a.v / (a.lim || 1))).map(r => {
      const p = r.lim ? r.v / r.lim : 0, cls = p >= 1 ? 'over' : p >= .8 ? 'warn' : 'ok';
      return `<div class="b-row"><div class="b-top"><div class="cat-ico" style="background:color-mix(in srgb,${r.cat.color} 16%,#fff)">${r.cat.emoji}</div><b>${r.cat.name}</b>
        <span class="b-nums">${fmt0(r.v)} / <button class="limit-btn" data-cat="${r.cat.id}" title="Click to edit limit">${fmt0(r.lim)}</button></span></div>
        <div class="bar"><i class="${cls}" data-w="${Math.min(100, p * 100)}"></i></div>
        <div class="b-state ${cls === 'ok' ? 'good' : cls}">${p >= 1 ? `over by ${fmt0(r.v - r.lim)}` : `${Math.round(p * 100)}% used · ${fmt0(r.lim - r.v)} left`}</div></div>`;
    }).join('')}
  </div>
  <div class="card span-5 reveal">
    <div class="card-head"><h3>Planner notes</h3></div>
    <div id="budgetAdvice" style="font-size:14px;line-height:1.7;color:var(--ink-soft)"></div>
  </div>`;

  requestAnimationFrame(() => requestAnimationFrame(() => budgetWrap.querySelectorAll('.bar i,.big-bar i').forEach(i => i.style.width = i.dataset.w + '%')));

  const over = rows.filter(r => r.lim && r.v > r.lim), near = rows.filter(r => r.lim && r.v / r.lim >= .8 && r.v <= r.lim);
  let adv = '';
  if (over.length) adv += `<p style="margin-bottom:12px">🚨 <b style="color:var(--ink)">${over.map(o => o.cat.name).join(', ')}</b> ${over.length > 1 ? 'are' : 'is'} past ${over.length > 1 ? 'their' : 'its'} limit — consider trimming before month-end.</p>`;
  if (near.length) adv += `<p style="margin-bottom:12px">⚠️ <b style="color:var(--ink)">${near.map(o => o.cat.name).join(', ')}</b> ${near.length > 1 ? 'are' : 'is'} above 80% — pace yourself.</p>`;
  if (!over.length && !near.length) adv += `<p>🌿 Every category is comfortably under budget. Lovely discipline.</p>`;
  const unused = rows.filter(r => r.v === 0);
  if (unused.length) adv += `<p style="margin-top:12px;color:var(--ink-faint);font-size:13px">Untouched so far: ${unused.map(u => u.cat.emoji + ' ' + u.cat.name).join(' · ')}</p>`;

  const budgetAdvice = $('#budgetAdvice');
  if (budgetAdvice) budgetAdvice.innerHTML = adv;
  revealInit(budgetWrap);
}

function repKey(dateStr, period) {
  if (period === 'day') return dateStr;
  if (period === 'week') return iso(weekStart(fromISO(dateStr)));
  if (period === 'month') return dateStr.slice(0, 7);
  return 'all';
}

function repLabel(key, period) {
  if (period === 'day') return fromISO(key).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
  if (period === 'week') {
    const d = fromISO(key), e = addDays(d, 6);
    return `Wk of ${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${e.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
  }
  if (period === 'month') { const [y, m] = key.split('-').map(Number); return `${MONTHS[m - 1]} ${y}`; }
  const all = [...state.TX].sort((a, b) => a.date.localeCompare(b.date));
  const f = fromISO(all[0].date), l = fromISO(all[all.length - 1].date);
  return `${f.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${l.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
}

function catBreakdown(txs, type) {
  const m = {};
  for (const t of txs) if (t.type === type) (m[t.cat] ||= []).push(t);
  return Object.entries(m)
    .map(([id, items]) => ({ cat: catById(id), items, total: items.reduce((s, x) => s + x.amount, 0) }))
    .sort((a, b) => b.total - a.total);
}

function breakdownHtml(list, type, grand) {
  if (!list.length) return `<div class="empty"><p>Nothing in this period.</p></div>`;
  return list.map(g => `
    <details class="rep-cat">
      <summary>
        <span class="cat-ico" style="width:32px;height:32px;font-size:14px;border-radius:9px;background:color-mix(in srgb,${g.cat.color} 16%,#fff)">${g.cat.emoji}</span>
        <b>${g.cat.name} <span style="color:var(--ink-faint);font-weight:400;font-size:11px">${Math.round(g.total / (grand || 1) * 100)}%</span></b>
        <span class="amt ${type === 'in' ? 'pos' : 'neg'}">${fmt2(g.total)}</span>
        <span class="chev" style="color:var(--ink-faint)">›</span>
      </summary>
      <div class="rep-items">
        ${[...g.items].sort((a, b) => b.date.localeCompare(a.date)).map(t => `
          <div class="rep-item">
            <span>${fromISO(t.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
            <span class="nm">${esc(t.note)}</span>
            <span class="amt ${type === 'in' ? 'pos' : 'neg'}">${fmt2(t.amount)}</span>
          </div>`).join('')}
      </div>
    </details>`).join('');
}

export function renderReports() {
  const rep = state.report;
  if (!rep.cursor) {
    const latest = state.TX.reduce((m, t) => t.date > m ? t.date : m, state.TX[0]?.date || '2026-08-22');
    rep.cursor = fromISO(latest);
  }
  const period = rep.period;
  const selKey = period === 'all' ? 'all' : repKey(iso(rep.cursor), period);
  const bucketMode = period === 'all' ? 'month' : period;

  const map = {};
  for (const t of state.TX) {
    const k = repKey(t.date, bucketMode);
    (map[k] ||= { in: 0, out: 0 });
    t.type === 'in' ? map[k].in += t.amount : map[k].out += t.amount;
  }
  const rows = Object.entries(map).sort((a, b) => a[0].localeCompare(b[0]));

  const selTx = state.TX.filter(t => repKey(t.date, period) === selKey);
  const sIn = selTx.filter(t => t.type === 'in').reduce((s, t) => s + t.amount, 0);
  const sOut = selTx.filter(t => t.type === 'out').reduce((s, t) => s + t.amount, 0);
  const nIn = selTx.filter(t => t.type === 'in').length;
  const nOut = selTx.filter(t => t.type === 'out').length;

  const repWrap = $('#repWrap');
  if (!repWrap) return;

  repWrap.innerHTML = `
  <style>
    .span-6{grid-column:span 6}
    @media(max-width:1020px){.span-6{grid-column:span 12}}
    .rep-bar{display:flex;gap:10px;align-items:center;flex-wrap:wrap}
    .rep-bar .chev{width:32px;height:32px;border-radius:99px;display:grid;place-items:center;color:var(--ink-soft);border:1px solid var(--line);background:var(--panel);transition:all .2s}
    .rep-bar .chev:hover{background:var(--leaf-soft);color:var(--leaf-deep)}
    .rep-cat summary{display:grid;grid-template-columns:auto 1fr auto auto;gap:10px;align-items:center;padding:9px 8px;border-radius:10px;cursor:pointer;list-style:none}
    .rep-cat summary::-webkit-details-marker{display:none}
    .rep-cat summary:hover{background:var(--panel-2)}
    .rep-cat summary .chev{transition:transform .2s}
    .rep-cat[open] summary .chev{transform:rotate(90deg)}
    .rep-items{padding:4px 8px 10px 48px;display:flex;flex-direction:column;gap:6px}
    .rep-item{display:grid;grid-template-columns:52px 1fr auto;gap:10px;font-size:12.5px;color:var(--ink-soft)}
    .rep-item .nm{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
    .rep-row{display:grid;grid-template-columns:1.3fr auto auto auto;gap:12px;padding:9px 12px;border-radius:10px;cursor:pointer;align-items:center;font-size:13px}
    .rep-row:hover{background:var(--panel-2)}
    .rep-row.sel{background:var(--leaf-soft);box-shadow:inset 0 0 0 1px var(--leaf)}
    .rep-row .lbl{font-weight:600}
    .rep-head{display:grid;grid-template-columns:1.3fr auto auto auto;gap:12px;padding:0 12px 8px;font-size:10.5px;letter-spacing:.14em;text-transform:uppercase;color:var(--ink-faint);font-weight:600}
  </style>

  <div class="card span-12 reveal">
    <div class="card-head">
      <div><h3>Reports</h3><div class="sub">income · expenses · net — sliced by day, week, month or all time</div></div>
      <div class="seg">
        <button data-rep-period="day" class="${period === 'day' ? 'active' : ''}">Day</button>
        <button data-rep-period="week" class="${period === 'week' ? 'active' : ''}">Week</button>
        <button data-rep-period="month" class="${period === 'month' ? 'active' : ''}">Month</button>
        <button data-rep-period="all" class="${period === 'all' ? 'active' : ''}">All time</button>
      </div>
    </div>
    <div class="rep-bar">
      <button class="chev" id="repPrev" ${period === 'all' ? 'hidden' : ''}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" width="15"><path d="M15 18l-6-6 6-6"/></svg></button>
      <b style="font-family:var(--disp);font-size:18px;min-width:230px;text-align:center">${repLabel(selKey, period)}</b>
      <button class="chev" id="repNext" ${period === 'all' ? 'hidden' : ''}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" width="15"><path d="M9 6l6 6-6 6"/></svg></button>
      <button class="today-btn" id="repLatest" ${period === 'all' ? 'hidden' : ''}>Latest</button>
    </div>
    <div class="stat-row" style="grid-template-columns:repeat(3,1fr);margin:16px 0 0">
      <div class="stat"><span>Inflow</span><b style="color:var(--leaf-deep)">+${fmt0(sIn)}</b><small>${nIn} item${nIn === 1 ? '' : 's'}</small></div>
      <div class="stat"><span>Outflow</span><b style="color:var(--coral-deep)">−${fmt0(sOut)}</b><small>${nOut} item${nOut === 1 ? '' : 's'}</small></div>
      <div class="stat"><span>Net</span><b style="color:${sIn - sOut >= 0 ? 'var(--leaf-deep)' : 'var(--coral-deep)'}">${fmt0(sIn - sOut)}</b><small>${sIn - sOut >= 0 ? 'surplus' : 'deficit'}</small></div>
    </div>
  </div>

  <div class="card span-12 reveal">
    <div class="card-head"><div><h3>${bucketMode === 'month' ? 'Month-by-month' : bucketMode === 'week' ? 'Week-by-week' : 'Day-by-day'} overview</h3>
      <div class="sub">click a row to inspect that ${bucketMode}</div></div></div>
    <div class="rep-head"><span>Period</span><span>Income</span><span>Expenses</span><span>Net</span></div>
    ${rows.map(([k, v]) => `
      <div class="rep-row ${k === selKey && period !== 'all' ? 'sel' : ''}" data-rep-goto="${k}">
        <span class="lbl">${repLabel(k, bucketMode)}</span>
        <span class="amt pos">+${fmt0(v.in)}</span>
        <span class="amt neg">−${fmt0(v.out)}</span>
        <span class="amt" style="color:${v.in - v.out >= 0 ? 'var(--leaf-deep)' : 'var(--coral-deep)'}">${fmt0(v.in - v.out)}</span>
      </div>`).join('')}
  </div>

  <div class="card span-6 reveal">
    <div class="card-head"><div><h3>Expenses by category</h3><div class="sub">${repLabel(selKey, period)} · tap a category for its items</div></div></div>
    ${breakdownHtml(catBreakdown(selTx, 'out'), 'out', sOut)}
  </div>

  <div class="card span-6 reveal">
    <div class="card-head"><div><h3>Income by category</h3><div class="sub">${repLabel(selKey, period)} · tap a category for its items</div></div></div>
    ${breakdownHtml(catBreakdown(selTx, 'in'), 'in', sIn)}
  </div>`;

  repWrap.querySelectorAll('[data-rep-period]').forEach(b => b.onclick = () => { rep.period = b.dataset.repPeriod; renderReports(); });
  const shift = dir => {
    const c = rep.cursor;
    if (rep.period === 'day') rep.cursor = addDays(c, dir);
    else if (rep.period === 'week') rep.cursor = addDays(c, 7 * dir);
    else if (rep.period === 'month') rep.cursor = new Date(c.getFullYear(), c.getMonth() + dir, Math.min(c.getDate(), 28));
    renderReports();
  };
  const repPrev = $('#repPrev');
  const repNext = $('#repNext');
  const repLatest = $('#repLatest');
  if (repPrev) repPrev.onclick = () => shift(-1);
  if (repNext) repNext.onclick = () => shift(1);
  if (repLatest) repLatest.onclick = () => {
    const latest = state.TX.reduce((m, t) => t.date > m ? t.date : m, state.TX[0]?.date || '2026-08-22');
    rep.cursor = fromISO(latest);
    renderReports();
  };
  repWrap.querySelectorAll('[data-rep-goto]').forEach(r => r.onclick = () => {
    const k = r.dataset.repGoto;
    if (period === 'all') rep.period = bucketMode;
    if (bucketMode === 'month') { const [y, m] = k.split('-').map(Number); rep.cursor = new Date(y, m - 1, 15); }
    else rep.cursor = fromISO(k);
    renderReports();
  });
  revealInit(repWrap);
}

export function renderTrends() {
  const months = allMonths().map(mo => ({ ...mo, ...totals(mo.y, mo.m) }));
  const trendWrap = $('#trendWrap');
  if (!trendWrap) return;

  if (!months.length) {
    trendWrap.innerHTML = '<div class="card span-12"><div class="empty"><p>No data yet.</p></div></div>';
    return;
  }
  let cum = 0;
  const data = months.map(m => { cum += m.net; return { ...m, cum }; });
  const totalIn = months.reduce((s, m) => s + m.in, 0), totalOut = months.reduce((s, m) => s + m.out, 0);
  const best = [...months].sort((a, b) => b.net - a.net)[0];
  const avgOut = totalOut / months.length;
  const savRate = totalIn ? (totalIn - totalOut) / totalIn : 0;

  trendWrap.innerHTML = `
  <div class="stat-row">
    <div class="stat reveal"><span>All-time net</span><b style="color:${cum >= 0 ? 'var(--leaf-deep)' : 'var(--coral-deep)'}">${fmt0(cum)}</b><small>${months.length} months tracked</small></div>
    <div class="stat reveal"><span>Best month</span><b>${fmt0(best.net)}</b><small>${mFull(best)}</small></div>
    <div class="stat reveal"><span>Avg monthly out</span><b>${fmt0(avgOut)}</b><small>total ${fmt0(totalOut)}</small></div>
    <div class="stat reveal"><span>All-time savings</span><b>${Math.round(savRate * 100)}%</b><small>of ${fmt0(totalIn)} earned</small></div>
  </div>
  <div class="card span-12 reveal">
    <div class="card-head"><div><h3>Net position over time</h3><div class="sub">cumulative balance, month by month — hover to explore</div></div>
      <div class="legend"><span><i style="background:var(--leaf-deep)"></i>Balance</span></div></div>
    <div class="chart-wrap" id="trendChartWrap"></div>
  </div>`;
  revealInit(trendWrap);
}

export const viewRenderers = {
  overview: renderOverview,
  transactions: renderTransactions,
  budgets: renderBudgets,
  reports: renderReports,
  trends: renderTrends,
};
