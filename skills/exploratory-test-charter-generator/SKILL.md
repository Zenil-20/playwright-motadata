---
name: exploratory-test-charter-generator
description: Generate time-boxed exploratory charters straight from our 176 knowledge/product/<Module>/<Screen>.md docs — mining their Edge Cases, Business Rules, Validations, and Known Bugs sections. Use to plan a session-based exploratory pass on an ObserveOps module.
---

# Exploratory Test Charter Generator (ObserveOps)

Generate structured, risk-based exploratory charters for ObserveOps — but instead of inventing missions from scratch, **mine them from the knowledge we already have**: the 176 screen docs under `knowledge/product/<Module>/<Screen>.md`. Each doc has 11 fixed sections; four of them are charter fuel:

- **§9 Business Rules** — invariants to try to violate.
- **§8 Validations** — inputs to push past the boundary.
- **§11 Edge Cases** — the exact corners the doc author already flagged.
- **§10 Known Bugs** — regressions to confirm-still-fixed (cross-ref `knowledge/known_issues/customer-issue-kb.md`).

A charter that reads generic ("explore the alerts page for bugs") is a failed adaptation. A good one cites the screen doc line it came from.

## When to use / When NOT
- **Use when:** planning a session-based exploratory pass on an ObserveOps module (Discovery, Alerts, Topology, Reports, NCCM, a Settings area…), especially one flagged as a KB hotspot.
- **Do NOT use for:** scripted regression (that is the data-driven CSV suite) or for automating a known flow (`mt-spec-writer`). Charters set direction for a human/agent tester; they are not test cases with fixed steps.

## Procedure
1. **Pick the screen(s).** Read `knowledge/product/<Module>/<Screen>.md` (index in `knowledge/product/index.md`). Prioritize screens that appear in `customer-issue-kb.md` hotspots (Discovery §1, HA/Upgrade §2, Platform §3, Alerts §5).
2. **Extract charter seeds** from §8/§9/§10/§11. Each bullet → one candidate mission.
3. **Score risk** = probability × impact × frequency, biased by KB frequency counts (a "13x credential problems" pattern is high-frequency, high-risk).
4. **Write charters** in the Explore / With / To Discover form, time-boxed 45–90 min, one persona each.
5. **Note the source line** so another tester can trace the mission back to the doc.

## Charter format (Explore / With / To Discover)
```markdown
### Charter: Discovery — interface speed edge
Explore:      Settings > Discovery provisioning for an SNMP device whose ifSpeed = 0
With:         a seeded device reporting speed 0 (mt-sandbox-state), boundary + error-guessing
To Discover:  whether utilization is pinned at 100%/∞ and whether a validation nudge appears
Source:       knowledge/product/.../Discovery.md §11 Edge Cases + KB §1 (PQD-31144)
Priority:     High   Persona: Power User   Time-box: 60 min
Heuristics:   SFDIPOT (Data), boundary analysis
```

## ObserveOps persona & heuristic lenses
- **Personas:** first-time NOC operator (novice), power SRE (shortcuts, bulk ops), RBAC-limited read-only user (permission edges — many KB report/download bugs are role-scoped), malicious/VAPT tester (§9 Security hotspots).
- **Heuristics per module:** *Data* (SFDIPOT) for Discovery/Reports raw-vs-aggregated divergence; *Consistency-with-History* (HICCUPPS) for upgrade regressions (topology 16-char parser 8.0.19→8.1.0→8.1.2); *Time* for poller-interval vs occurrence/flap-window math in Alerts.
- **State/theme lenses ObserveOps-specific:** the "No data found" empty states, Light/Dark/Auto theme (Settings → My Account → UI Preference), and cloned-object independence (edit a cloned dashboard/policy — does the original change? KB §10 MOTADATA-6574).

## Example charter batch from one screen doc (Alerts)
From `knowledge/product/Alerts/alerts.md`:
- §9 "every widget scoped to active domain tab" → *Explore Alerts domain tabs / With cross-tab metric vs availability data / To Discover leakage between tabs.*
- §9 severity taxonomy (Down/Unreachable vs Critical/Major/Warning) → *Explore severity bar+legend / With a device flapping between availability and threshold states / To Discover mislabeled severity.*
- §10 Known Bugs + KB §5 re-notification → *Explore multi-threshold policy re-notification / With severity cycling up/down / To Discover duplicate or content-mismatched mails (MOTADATA-8110 class).*

## Rules & anti-patterns
- **Every charter cites a screen-doc section** (or a KB pattern). No citation → it is guesswork, not adaptation.
- **Charter, not test case** — set direction; don't script exact steps/expected (that over-scripts and kills discovery).
- **Respect the time-box**; one persona per session; screenshot anomalies immediately.
- **Feed findings back:** a confirmed new edge case → `mt-knowledge-updater` appends it to §11 of the screen doc (verified, with provenance); a defect → the bug-report-writing skill. Never persist an unverified observation as knowledge.
- **Don't call async slow "a bug"** — Discovery jobs can take ~30s; that is documented behavior, not a defect.

Adapted from qaskills/seed-skills/exploratory-test-charter-generator
