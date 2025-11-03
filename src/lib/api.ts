/* eslint-disable @typescript-eslint/no-explicit-any */
/* Lightweight frontend API shim.
   This replaces the previous `integrations/supabase/client` shim and provides
   an `api` object that frontend code can call. It proxies requests to the
   backend REST endpoints (e.g. /api/auth, /api/db, /api/functions).

   Purpose: centralize the shim under `src/lib/api.ts` so we can remove any
   remaining `supabase`-named artifacts and fully detach from the Supabase
   client in the browser.
*/

type AnyObj = Record<string, any>;

async function requestApi(path: string, method = 'GET', body?: any) {
  const opts: RequestInit = { method, headers: { 'Content-Type': 'application/json' }, credentials: 'include' };
  if (body !== undefined) opts.body = JSON.stringify(body);
  const res = await fetch(path, opts);
  const text = await res.text();
  try {
    const json = text ? JSON.parse(text) : null;
    return { ok: res.ok, status: res.status, data: json };
  } catch (err) {
    return { ok: res.ok, status: res.status, data: text };
  }
}

function makeFromBuilder(table: string) {
  const state: any = { table, filters: [], order: null, op: null, payload: null, columns: null };

  function execute() {
    return requestApi('/api/db', 'POST', state).then(({ ok, data }) => {
      if (!ok) return { data: null, error: { message: 'Request failed', status: data?.status || 500 } };
      return { data, error: null };
    }).catch((err) => ({ data: null, error: { message: err.message || String(err) } }));
  }

  return {
    select(cols: string | string[] = '*') { state.op = 'select'; state.columns = cols; return this; },
    insert(payload: any) { state.op = 'insert'; state.payload = payload; return execute(); },
    upsert(payload: any) { state.op = 'upsert'; state.payload = payload; return execute(); },
    update(payload: any) { state.op = 'update'; state.payload = payload; return execute(); },
    delete() { state.op = 'delete'; return execute(); },
    eq(k: string, v: any) { state.filters.push({ k, op: 'eq', v }); return this; },
    order(column: string, opts?: any) { state.order = { column, opts }; return this; },
    single() { state.single = true; return execute(); },
    then(resolve: any, reject: any) { execute().then(resolve, reject); }
  };
}

export const api = {
  auth: {
    async signInWithPassword(payload: { email: string; password: string }) {
      const r = await requestApi('/api/auth/signin', 'POST', payload);
      if (!r.ok) return { data: null, error: { message: r.data?.message || 'Sign-in failed' } };
      return { data: r.data, error: null };
    },
    async signUp(payload: { email: string; password: string }) {
      const r = await requestApi('/api/auth/signup', 'POST', payload);
      if (!r.ok) return { data: null, error: { message: r.data?.message || 'Sign-up failed' } };
      return { data: r.data, error: null };
    },
    async getUser() {
      const r = await requestApi('/api/auth/user', 'GET');
      if (!r.ok) return { data: { user: null }, error: { message: r.data?.message || 'Failed to get user' } };
      return { data: { user: r.data || null }, error: null };
    },
    async getSession() {
      const r = await requestApi('/api/auth/user', 'GET');
      if (!r.ok) return { data: { session: null }, error: { message: r.data?.message || 'Failed to get session' } };
      const user = r.data || null;
      const session = user ? { user } : null;
      return { data: { session }, error: null };
    },
    async signOut() {
      const r = await requestApi('/api/auth/signout', 'POST');
      if (!r.ok) return { error: { message: r.data?.message || 'Signout failed' } };
      return { error: null };
    },
    onAuthStateChange(cb: (event: string, session: any) => void) {
      (async () => {
        try {
          const r = await requestApi('/api/auth/user', 'GET');
          const user = r.ok ? r.data : null;
          const session = user ? { user } : null;
          cb(user ? 'SIGNED_IN' : 'SIGNED_OUT', session);
        } catch (e) {
          cb('SIGNED_OUT', null);
        }
      })();
      return { data: { subscription: { unsubscribe: () => {} } } };
    }
  },
  from(table: string) {
    return makeFromBuilder(table);
  },
  functions: {
    async invoke(name: string, opts?: { body?: any }) {
      const r = await requestApi(`/api/functions/${encodeURIComponent(name)}`, 'POST', opts?.body);
      if (!r.ok) return { data: null, error: { message: r.data?.message || 'Function invoke failed' } };
      return { data: r.data, error: null };
    }
  }
};

export default api;
