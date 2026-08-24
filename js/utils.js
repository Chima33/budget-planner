export const $ = (s) => document.querySelector(s);
export const $$ = (s) => document.querySelectorAll(s);

export const fmt0 = (n) => (n < 0 ? '−' : '') + 'HK$' + Math.round(Math.abs(n)).toLocaleString('en-US');
export const fmt2 = (n) => (n < 0 ? '−' : '') + 'HK$' + Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
export const fmtK = (v) => v >= 1000 ? 'HK$' + (v / 1000).toFixed(v >= 10000 ? 0 : 1).replace(/\.0$/, '') + 'k' : 'HK$' + Math.round(v);

export const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

// Robust date parser — avoids timezone bugs by treating ISO strings as local dates
export const fromISO = (s) => {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
};

export const esc = (s) => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

export const uid = () => 't' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

export function addDays(d, n) { const x = new Date(d); x.setDate(x.getDate() + n); return x; }
export function weekStart(d) { const x = new Date(d); const day = (x.getDay() + 6) % 7; x.setDate(x.getDate() - day); return x; }

export function mulberry32(a) {
  return function () {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

export function animateMoney(el, to, fmt = fmt0) {
  if (!el) return;
  const from = el._v ?? to * 0.55;
  el._v = to;
  const t0 = performance.now(), D = 850;
  (function step(t) {
    const p = Math.min(1, (t - t0) / D), e = 1 - Math.pow(1 - p, 3);
    el.textContent = fmt(from + (to - from) * e);
    if (p < 1) requestAnimationFrame(step);
  })(t0);
}

let obs = null;
export function revealInit(root) {
  if (!root) return;
  if (!obs) obs = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('in'); obs.unobserve(e.target); }
  }), { threshold: 0.06 });
  root.querySelectorAll('.reveal').forEach((el, i) => {
    el.style.transitionDelay = Math.min(i, 9) * 70 + 'ms';
    obs.observe(el);
  });
}

export function tooltip(wrap) {
  let tip = wrap.querySelector('.tip');
  if (!tip) { tip = document.createElement('div'); tip.className = 'tip'; wrap.appendChild(tip); }
  return {
    show(html, x, y) {
      tip.innerHTML = html; tip.classList.add('show');
      const w = wrap.offsetWidth;
      tip.style.left = Math.max(92, Math.min(w - 92, x)) + 'px';
      tip.style.top = Math.max(60, y) + 'px';
    },
    hide() { tip.classList.remove('show'); }
  };
}
