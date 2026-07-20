---
screen: System Settings · Rebranding
module: Settings
category: system-settings
route: "/settings/system-settings/rebranding"
build: 8.2.6
status: draft
sources: [catalog, kb]        # locators/catalog/settings_system_settings_rebranding.json ; known_issues/customer-issue-kb.md
verified: 2026-07-09
---

# System Settings · Rebranding

## 1. Purpose
Lets an administrator **white-label** the product UI by replacing the default Motadata branding (at
minimum, the logo) with the customer's / partner's own. Useful for MSPs and enterprises that present the
tool under their own identity.

- **Business objective:** allow partners/enterprises to apply their own logo (and likely other branding
  elements) so the platform matches their corporate identity.
- **Screen description:** a form under `Settings → System Settings → Rebranding` whose only control the
  sweep captured is a **Browse Logo** upload trigger.
- **Primary use cases:** upload a custom logo. (Additional branding fields — product name, favicon,
  theme/colors, login-page assets — may exist but were not captured; TODO(source: KG/docs).)
- **Who uses it:** administrators.
- **Dependencies:** an image asset meeting the product's format/size constraints.

## 2. Navigation
```
Settings → System Settings → Rebranding
```
- **Breadcrumb:** Settings › System Settings › Rebranding
- **URL:** `/settings/system-settings/rebranding`

## 3. Actions
- **Browse Logo** — file picker to upload a logo image (button "Browse Logo")
- TODO(source: KG/docs) — Save/Apply and Reset controls (a Save was not captured; confirm how the upload
  is persisted/applied).

## 4. Components
| Component | Control (from catalog) |
|---|---|
| Search | `input[placeholder="Search"]` |
| Browse Logo | button "Browse Logo" (opens file upload) |

> Only **Browse Logo** and Search were captured. Any Save/Apply/Reset, preview, product-name/favicon/theme
> fields, and the accepted image format/size rules were **not captured** — confirm live or via the KG
> before writing a rebranding test.

_Locators: promote verified ones into `knowledge/locators/selector-cookbook.md` (Settings > Rebranding)._

## 5. Permissions
- **Administrators** apply rebranding (global, affects every user's UI).
- TODO(source: KG/docs) — non-admin visibility; whether rebranding is license/edition-gated (white-label
  is often a licensed capability).

## 6. Entry Conditions
- Logged in as an administrator.
- A logo image file is available meeting the (unconfirmed) format/size constraints.

## 7. Exit Conditions
- **On apply (success):** the uploaded logo replaces the default branding across the UI (likely after
  save/refresh). TODO(source: docs) — confirm success signal and whether a re-login/refresh is needed.

## 8. Validations
- **Logo image** — must be an accepted image format within a size limit. TODO(source: docs) — exact
  allowed formats (PNG/SVG/JPG?) and max dimensions/size.

## 9. Business Rules
- Rebranding is **global** — it changes the appearance for all users, not per-user.
- TODO(source: KG/docs) — whether rebranding persists across upgrades; whether it is license-gated;
  scope of what can be rebranded (logo only vs. name/colors/login page).

## 10. Known Bugs
None recorded for this screen in `knowledge/known_issues/customer-issue-kb.md`.

## 11. Edge Cases
- Unsupported image format (e.g. BMP/TIFF) or oversized file.
- Non-image file uploaded via the logo picker.
- Very large or very small logo dimensions (layout distortion).
- Transparent-background vs. dark/light theme rendering.
- Applying a logo then reverting to default (is there a reset?).
- Branding persistence after an upgrade.
