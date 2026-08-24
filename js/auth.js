import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { SUPABASE_URL, SUPABASE_ANON_KEY, OWNER_EMAIL } from './config.js';
import { state, seedTxs, DEF_BUDGETS } from './data.js';

export const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export async function checkSession() {
  const { data: { session } } = await sb.auth.getSession();
  return session;
}

export function showLoginScreen(onSuccess) {
  const loginDiv = document.createElement('div');
  loginDiv.id = 'login-overlay';
  loginDiv.innerHTML = `
    <style>
      #login-overlay { position: fixed; inset: 0; z-index: 9999; background: #0E2B22; display: flex; align-items: center; justify-content: center; padding: 20px; }
      .auth-box { background: #FCFDFB; color: #122A20; padding: 32px; border-radius: 20px; width: 100%; max-width: 380px; box-shadow: 0 20px 40px rgba(0,0,0,0.4); }
      .auth-box h2 { font-family: 'Fraunces', serif; margin: 0 0 8px 0; }
      .auth-box p { margin: 0 0 24px 0; color: #7E948A; font-size: 14px; }
      .auth-input { width: 100%; padding: 12px; margin-bottom: 16px; border: 1.5px solid #DCE7DB; border-radius: 10px; font-size: 15px; box-sizing: border-box; outline: none; font-family: inherit; }
      .auth-input:focus { border-color: #2FBF71; box-shadow: 0 0 0 3px rgba(47,191,113,0.15); }
      .auth-btn { width: 100%; padding: 14px; background: #2FBF71; color: white; border: none; border-radius: 10px; font-size: 16px; font-weight: 600; cursor: pointer; margin-bottom: 12px; transition: background 0.2s; font-family: inherit; }
      .auth-btn:hover { background: #178A50; }
      .auth-link { background: none; border: none; color: #2FBF71; cursor: pointer; font-size: 14px; width: 100%; text-align: center; font-family: inherit; }
      .auth-err { color: #EF5E4A; font-size: 13px; margin-bottom: 12px; min-height: 18px; text-align: center; }
    </style>
    <div class="auth-box">
      <h2>Budget Planner</h2>
      <p id="auth-sub">Sign in to sync your data across devices.</p>
      <div class="auth-err" id="auth-err"></div>
      <input type="email" id="auth-email" class="auth-input" placeholder="Email address">
      <input type="password" id="auth-pass" class="auth-input" placeholder="Password">
      <button class="auth-btn" id="auth-action">Sign In</button>
      <button class="auth-link" id="auth-toggle">Need an account? Sign Up</button>
    </div>
  `;
  document.body.appendChild(loginDiv);

  let isSignup = false;
  const emailIn = document.getElementById('auth-email');
  const passIn = document.getElementById('auth-pass');
  const err = document.getElementById('auth-err');
  const btn = document.getElementById('auth-action');
  const toggle = document.getElementById('auth-toggle');
  const sub = document.getElementById('auth-sub');

  toggle.onclick = () => {
    isSignup = !isSignup;
    btn.textContent = isSignup ? 'Create Account' : 'Sign In';
    toggle.textContent = isSignup ? 'Have an account? Sign In' : 'Need an account? Sign Up';
    sub.textContent = isSignup ? 'Create an account to start tracking.' : 'Sign in to sync your data across devices.';
    err.textContent = '';
  };

  btn.onclick = async () => {
    err.textContent = 'Loading...';
    btn.disabled = true;
    try {
      const email = emailIn.value.trim();
      const pass = passIn.value;
      if (!email || !pass) throw new Error('Please enter email and password.');

      if (isSignup) {
        const { error } = await sb.auth.signUp({ email, password: pass });
        if (error) throw error;
        err.style.color = '#178A50';
        err.textContent = 'Account created! Please sign in.';
        isSignup = false; toggle.onclick();
      } else {
        const { data, error } = await sb.auth.signInWithPassword({ email, password: pass });
        if (error) throw error;
        loginDiv.remove();
        onSuccess(data.user);
      }
    } catch (e) {
      err.style.color = '#EF5E4A';
      err.textContent = e.message || 'An error occurred.';
    } finally {
      btn.disabled = false;
    }
  };
}

export async function loadCloudData() {
  try {
    const { data: { user } } = await sb.auth.getUser();
    const isOwner = user && user.email === OWNER_EMAIL;

    // Fetch up to 10,000 rows to avoid Supabase default limit
    const { data: txData, error: txErr } = await sb.from('transactions').select('*').range(0, 10000);
    const { data: bgData, error: bgErr } = await sb.from('budgets').select('limits').maybeSingle();

    if (txErr) throw txErr;
    if (bgErr) throw bgErr;

    // ONLY seed the 148 transactions if it is YOU and the database is empty
    if ((!txData || txData.length === 0) && isOwner) {
      console.log('🌱 Seeding data for owner...');
      const seeds = seedTxs();
      const rows = seeds.map(t => ({ id: t.id, date: t.date, type: t.type, cat: t.cat, note: t.note, amount: t.amount }));
      await sb.from('transactions').insert(rows);
      state.TX = seeds;
    } else {
      state.TX = txData ? txData.map(r => ({ ...r, amount: Number(r.amount) })) : [];
    }

    if (bgData && bgData.limits) {
      state.BG = bgData.limits;
    } else {
      state.BG = { ...DEF_BUDGETS };
      await sb.from('budgets').insert({ limits: state.BG });
    }
    console.log('✅ Data loaded:', state.TX.length, 'transactions');
  } catch (e) {
    console.warn('Cloud load failed, using local seed data:', e);
    state.TX = seedTxs();
    state.BG = { ...DEF_BUDGETS };
  }
}

export async function cloudSaveTx(tx) {
  await sb.from('transactions').upsert({ id: tx.id, date: tx.date, type: tx.type, cat: tx.cat, note: tx.note, amount: tx.amount });
}

export async function cloudDeleteTx(id) {
  await sb.from('transactions').delete().eq('id', id);
}

export async function cloudSaveBudgets() {
  await sb.from('budgets').upsert({ limits: state.BG }, { onConflict: 'user_id' });
}

export async function logout() {
  await sb.auth.signOut();
  window.location.reload();
}
