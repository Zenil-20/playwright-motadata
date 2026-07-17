# Sample reporting scripts for the `custom.script` category

The Custom Script report type needs a **real Motadata reporting script** (a
Motadata-SDK program that prints the grid payload) — there is no generic
snippet that works on every instance, so none is shipped here.

To enable the `custom.script` scenarios in the creation matrix, drop working
script **sources** in this folder:

| File        | Language | Scenario(s)                      |
|-------------|----------|----------------------------------|
| `sample.go` | GO       | `go_c0`, `go_c1`, `go_all`       |
| `sample.py` | Python   | `python_c0`                      |
| `sample.js` | Node.js  | `node_c0`                        |

A known-good source is any script that already runs on your instance —
e.g. one exported from an existing Custom Script report. (The compiled
binaries under the server's `customscripts/` folder are NOT usable — the
wizard's CodeMirror editor needs the source.)

Scenarios whose sample file is missing are **skipped** (not failed), with the
reason in the test annotations.

This folder is read by `_core/creation/categories.js` (`customScriptHandler`).
