import { $, $$, iso, fromISO, fmt2, esc } from './utils.js';
import { state, MONTHS, CATS, catById, seedTxs, today } from './data.js';
import { renderTopbar, viewRenderers } from './views.js';
import { checkSession, showLoginScreen, loadCloudData, cloudSaveTx, cloudDeleteTx, cloudSaveBudgets, logout } from './auth.js';

function toast(msg, opt = {}) {
  const box = $('#toasts');
  if (!box) return;
  const el = document.createElement('div');
  el.className = 'toast';
  el.innerHTML = `<span>${msg}</span>${opt.action ? `<button>${opt.action}</button>` : ''}<div class="tbar"></div>`;
  box.appendChild(el);
  const kill = () => { el.classList.add('out'); setTimeout(() => el.remove(), 360); };
  const timer = setTimeout(kill, 4200);
  if (opt.action) el.querySelector('button').onclick = () => { clearTimeout(timer); opt.on(); kill(); };
}

function setView(v) {
  state.view = v;
  $$('.nav-btn').forEach(b => b.classList.toggle('active', b.dataset.view === v));
  $$('.view').forEach(s => s.classList.toggle('active', s.id === 'view-' + v));
  if (viewRenderers[v]) viewRenderers[v]();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function renderAll() {
  renderTopbar();
  if (viewRenderers[state.view]) viewRenderers[state.view]();
}

function shiftMonth(d) {
  const nd = new Date(state.cursor.y, state.cursor.m + d, 1);
  state.cursor = { y: nd.getFullYear(), m: nd.getMonth() };
  renderAll();
}

let mType = 'out';
let mCat = CATS.out[0].id;

function buildChips() {
  const grid = $('#catGrid');
  if (!grid) return;
  grid.innerHTML = CATS[mType].map(c => `<button class="cat-chip ${c.id === mCat ? 'sel' : ''}" data-cat="${c.id}" style="--c:${c.color}">${c.emoji} ${c.name}</button>`).join('');
}

function setType(t) {
  mType = t;
  const toggle = $('#typeToggle');
  const btnIn = $('#btnIn');
  const btnOut = $('#btnOut');
  const submitTx = $('#submitTx');
  if (toggle) toggle.classList.toggle('income', t === 'in');
  if (btnIn) btnIn.classList.toggle('on', t === 'in');
  if (btnOut) btnOut.classList.toggle('on', t === 'out');
  if (submitTx) {
    submitTx.textContent = t === 'in' ? 'Add inflow' : 'Add outflow';
    submitTx.classList.toggle('income', t === 'in');
  }
  mCat = CATS[t][0].id;
  buildChips();
}

function openModal() {
  setType('out');
  const amtInput = $('#amtInput');
  const noteInput = $('#noteInput');
  const dateInput = $('#dateInput');
  const modal = $('#txModal');
  if (amtInput) amtInput.value = '';
  if (noteInput) noteInput.value = '';
  if (dateInput) dateInput.value = iso(new Date());
  if (modal) modal.classList.add('open');
  setTimeout(() => { if (amtInput) amtInput.focus(); }, 250);
}

function closeModal() {
  const modal = $('#txModal');
  if (modal) modal.classList.remove('open');
}

function bindUI() {
  const prevM = $('#prevM');
  const nextM = $('#nextM');
  const todayBtn = $('#todayBtn');
  const btnIn = $('#btnIn');
  const btnOut = $('#btnOut');
  const catGrid = $('#catGrid');
  const amtInput = $('#amtInput');
  const amtBox = $('#amtBox');
  const addBtn = $('#addBtn');
  const fab = $('#fab');
  const modalX = $('#modalX');
  const modalBg = $('#modalBg');
  const submitTx = $('#submitTx');
  const dateInput = $('#dateInput');
  const noteInput = $('#noteInput');
  const mainNav = $('#mainNav');
  const txSeg = $('#txSeg');
  const txSearch = $('#txSearch');
  const resetBtn = $('#resetBtn');
  const sideFoot = $('.side-foot');

  if (prevM) prevM.onclick = () => shiftMonth(-1);
  if (nextM) nextM.onclick = () => shiftMonth(1);
  if (todayBtn) todayBtn.onclick = () => { state.cursor = { y: today.getFullYear(), m: today.getMonth() }; renderAll(); };
  if (btnIn) btnIn.onclick = () => setType('in');
  if (btnOut) btnOut.onclick = () => setType('out');

  if (catGrid) {
    catGrid.addEventListener('click', e => {
      const c = e.target.closest('.cat-chip');
      if (c) { mCat = c.dataset.cat; buildChips(); }
    });
  }

  if (amtInput) {
    amtInput.addEventListener('input', e => {
      e.target.value = e.target.value.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1');
      if (amtBox) amtBox.classList.remove('err');
    });
  }

  if (addBtn) addBtn.onclick = openModal;
  if (fab) fab.onclick = openModal;
  if (modalX) modalX.onclick = closeModal;
  if (modalBg) modalBg.onclick = closeModal;

  if (submitTx) {
    submitTx.onclick = async () => {
      const amt = parseFloat(amtInput.value);
      if (!(amt > 0)) {
        if (amtBox) amtBox.classList.add('err');
        if (amtInput) amtInput.focus();
        return;
      }
      const date = dateInput.value || iso(new Date());
      const tx = {
        id: 'tx' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
        type: mType,
        cat: mCat,
        amount: Math.round(amt * 100) / 100,
        note: noteInput.value.trim(),
        date
      };

      state.TX.push(tx);
      await cloudSaveTx(tx);
      closeModal();

      const d = fromISO(date);
      if (d.getFullYear() !== state.cursor.y || d.getMonth() !== state.cursor.m) {
        toast(`Added ${fmt2(tx.amount)} to ${MONTHS[d.getMonth()].slice(0, 3)} ${d.getFullYear()}`, {
          action: 'Open month',
          on() { state.cursor = { y: d.getFullYear(), m: d.getMonth() }; renderAll(); }
        });
      } else {
        renderAll();
        toast(`Added ${fmt2(tx.amount)}`);
      }
    };
  }

  document.addEventListener('click', e => {
    const del = e.target.closest('[data-del]');
    if (del) {
      const id = del.dataset.del;
      const i = state.TX.findIndex(t => t.id === id);
      if (i > -1) {
        const t = state.TX[i];
        const c = catById(t.cat);
        // CONFIRMATION DIALOG BEFORE DELETE
        const confirmMsg = `Are you sure you want to delete this ${t.type === 'in' ? 'income' : 'expense'}?\n\n${c.emoji} ${t.note || c.name}\n${fmt2(t.amount)}\n\nThis cannot be undone.`;
        if (confirm(confirmMsg)) {
          state.TX.splice(i, 1);
          cloudDeleteTx(id);
          renderAll();
          toast(`Removed ${fmt2(t.amount)}`, {
            action: 'Undo',
            on() { state.TX.push(t); cloudSaveTx(t); renderAll(); }
          });
        }
      }
    }

    const lim = e.target.closest('.limit-btn');
    if (lim) {
      const cat = lim.dataset.cat;
      const input = document.createElement('input');
      input.type = 'number';
      input.className = 'limit-input';
      input.value = Math.round(state.BG[cat] ?? 0);
      let done = false;
      const commit = async () => {
        if (done) return;
        done = true;
        const v = parseFloat(input.value);
        if (!isNaN(v) && v >= 0) {
          state.BG[cat] = v;
          await cloudSaveBudgets();
        }
        renderAll();
      };
      input.addEventListener('blur', commit);
      input.addEventListener('keydown', e => {
        if (e.key === 'Enter') input.blur();
        if (e.key === 'Escape') { done = true; renderAll(); }
      });
      lim.replaceWith(input);
      input.focus();
      input.select();
    }

    const go = e.target.closest('[data-goto]');
    if (go) setView(go.dataset.goto);
    if (e.target.closest('[data-open-modal]')) openModal();
  });

  if (mainNav) {
    mainNav.addEventListener('click', e => {
      const b = e.target.closest('.nav-btn');
      if (b) setView(b.dataset.view);
    });
  }

  if (txSeg) {
    txSeg.addEventListener('click', e => {
      const b = e.target.closest('button');
      if (b) {
        state.txFilters.seg = b.dataset.seg;
        $$('#txSeg button').forEach(x => x.classList.toggle('active', x === b));
        if (viewRenderers.transactions) viewRenderers.transactions();
      }
    });
  }

  if (txSearch) {
    txSearch.addEventListener('input', e => {
      state.txFilters.q = e.target.value;
      if (viewRenderers.transactions) viewRenderers.transactions();
    });
  }

  if (resetBtn) {
    resetBtn.onclick = async () => {
      if (confirm('Reset to seed data? This will replace all your transactions.')) {
        state.TX = seedTxs();
        for (const t of state.TX) await cloudSaveTx(t);
        renderAll();
        toast('Data reset');
      }
    };
  }

  if (sideFoot && !$('#logoutBtn')) {
    const btn = document.createElement('button');
    btn.id = 'logoutBtn';
    btn.className = 'reset-btn';
    btn.textContent = '🚪 Sign out';
    btn.style.marginTop = '10px';
    btn.onclick = logout;
    sideFoot.insertBefore(btn, sideFoot.firstChild);
  }

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeModal();
    if ((e.key === 'n' || e.key === 'N') && !$('#txModal').classList.contains('open') && !/(INPUT|TEXTAREA)/.test(document.activeElement.tagName)) {
      e.preventDefault();
      openModal();
    }
  });

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () =>
      navigator.serviceWorker.register('./sw.js').catch(err => console.warn('SW failed:', err))
    );
  }

  let deferredPrompt = null;
  const installBtn = $('#installBtn');
  window.addEventListener('beforeinstallprompt', e => {
    e.preventDefault(); deferredPrompt = e;
    if (installBtn) installBtn.hidden = false;
  });
  if (installBtn) {
    installBtn.addEventListener('click', async () => {
      if (!deferredPrompt) return;
      deferredPrompt.prompt();
      await deferredPrompt.userChoice;
      deferredPrompt = null; installBtn.hidden = true;
    });
  }
}

async function boot() {
  const session = await checkSession();

  if (!session) {
    showLoginScreen(async (user) => {
      await loadCloudData();
      const mainApp = document.getElementById('main-app');
      if (mainApp) mainApp.style.display = 'block';
      bindUI();
      renderAll();
    });
  } else {
    await loadCloudData();
    const mainApp = document.getElementById('main-app');
    if (mainApp) mainApp.style.display = 'block';
    bindUI();
    renderAll();
  }
}

boot();
