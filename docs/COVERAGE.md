# Coverage philosophy — max coverage, min automation

Ported from observeops-qa. The rule: **one script × many data rows**, not one script per case.
A combinatorial suite (hundreds of TFS cases) collapses into a handful of data-driven
scenarios that iterate CSV rows, so coverage scales with data — not with code.

## How it works here

| Layer | File | Role |
|---|---|---|
| Reusable flow | [`framework/playwright/flow.js`](../framework/playwright/flow.js) | The common discover→credential→provision→verify path (no literal selectors — those live in `framework/playwright/selectors.js`) |
| Device matrix | [`tests/data/discovery-devices.csv`](../tests/data/discovery-devices.csv) | One row per device type (wireless / DB / virtualization / network) |
| Form matrix | [`tests/data/discovery-form-structure.csv`](../tests/data/discovery-form-structure.csv) | One row per form control — covers the TFS form-field cases |
| Data-driven spec | [`tests/scenarios/Discovery_DataDriven.spec.js`](../tests/scenarios/Discovery_DataDriven.spec.js) | Iterates both CSVs; missing env → **skip with reason**, never a false fail |

Add a device = **add a CSV row**, not a new spec.

## Traceability to TFS

The consolidated suite is designed to cover the same surface as the imported TFS plans:

| TFS source | Cases | Covered by |
|---|---|---|
| `TestPlan_Server_Linux_FULL_IMPORT` (Linux discovery form) | ~123 | `discovery-form-structure.csv` (control-presence) + `linux` device row |
| Kubernetes discovery (MOTADATA-6699) | ~75 | form-structure matrix + a `k8s` row when the tab is available |
| NetPath (MOTADATA-5429) | ~46 | future `netpath` matrix (same pattern) |
| Per-device discovery (Aruba, MongoDB, SQL Server, vCenter, …) | 30 specs | 16 device rows in `discovery-devices.csv` |

Run `/coverage-audit` (see `.claude/commands/coverage-audit.md`) to diff canonical TFS cases
(loaded via the test-case store) against the scenarios that cover them and flag gaps.

## The test-case store

TFS/Jira/Excel exports are normalized to 13 canonical fields via
[`framework/core/testcase-store/`](../framework/core/testcase-store/) (alias-mapped CSV). Suites live in
`tests/regression/` (source of truth) and `tests/generated/` (awaiting promotion).
The daily pipeline promotes a validated generated suite into regression as its final stage.

## Migration note

The 30 legacy per-device specs still run (nothing was deleted). As each device is confirmed
green through the data-driven path, its standalone spec can be retired — the CSV row replaces it.
