/*
 * Self-healing locator resolver — the MECHANISM (the selector data lives in
 * selectors.js; the cookbook is the catalog). Implements the failure-triager's
 * "try primary, then fallback" contract + the cookbook's mandatory count()===1 check.
 */

/**
 * Resolve a control to a Locator, preferring `primary`, healing to `fallback`.
 * @param {import('@playwright/test').Page|import('@playwright/test').Locator} scope
 * @param {{primary: string|((s:any)=>any), fallback?: string|((s:any)=>any), name?: string}} spec
 */
export async function resolve(scope, spec) {
  const primary = build(scope, spec.primary);
  if ((await countSafe(primary)) === 1) return primary;
  if (spec.fallback != null) {
    const fb = build(scope, spec.fallback);
    if ((await countSafe(fb)) === 1) return fb;
  }
  // Neither is uniquely present — return primary so the action throws a clear
  // strict-mode / not-found error the failure-triager can classify.
  return primary;
}

/** Assert a control matches exactly one element in the current state, then return it. */
export async function unique(scope, spec, expect) {
  const loc = await resolve(scope, spec);
  const n = await loc.count();
  const label = spec.name || String(spec.primary);
  if (expect) expect(n, `'${label}' should match exactly 1 element`).toBe(1);
  else if (n !== 1) throw new Error(`'${label}' matched ${n} elements (expected 1)`);
  return loc;
}

function build(scope, sel) {
  return typeof sel === 'function' ? sel(scope) : scope.locator(sel);
}

async function countSafe(loc) {
  try { return await loc.count(); } catch { return -1; }
}
