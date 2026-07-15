/**
 * Base URL for the AIOps instance, read from .env (Motadata_Aiops) — the same
 * variable the rest of the suite uses. Specs already start authenticated via
 * the `setup` project's storageState, so we only need the URL here.
 */
function baseUrl() {
  const v = process.env.Motadata_Aiops;
  if (!v) {
    throw new Error("Missing required env var 'Motadata_Aiops'. Copy .env.example to .env and fill it in.");
  }
  return v.replace(/\/+$/, '');
}

module.exports = { baseUrl };
