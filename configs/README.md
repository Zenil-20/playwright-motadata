# configs/

Where configuration lives (mirrors observeops-qa's `configs/`, mapped to the Playwright stack):

| Concern | Source of truth |
|---|---|
| Test runner (projects, timeouts, reporters, trace) | `../playwright.config.js` |
| App URL, credentials, device IPs, integration creds | `.env` (copy from `../.env.example`) |
| Canonical CSV field ↔ vendor-header aliases | `../framework/core/testcase-store/mapping.js` |
| CI | `../.github/workflows/playwright.yml` |

There is intentionally no duplicate config file here — Playwright + `.env` are the config
mechanism. This folder documents the map so the layout matches observeops-qa.
