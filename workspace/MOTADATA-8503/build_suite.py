# Generic, matrix-driven manual-suite builder for policy-type Jira features.
# Swap CONFIG to retarget any Jira. Expands module x condition x scenario into
# QA-grade, executable-blind cases, then emits JSON + Excel + PDF + coverage summary.
import json, os
from openpyxl import Workbook
from openpyxl.styles import Font, Alignment, PatternFill, Border, Side
from openpyxl.utils import get_column_letter
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle

D = os.path.dirname(__file__)

# ============================ CONFIG (retarget here) ============================
CONFIG = {
  "jira_key": "MOTADATA-8503",
  "jira_base": "http://172.16.10.6:8080/browse/",
  "feature": "Unified Create Policy UI (Set Conditions)",
  "conditions": ["Threshold Alert", "Baseline Alert", "Anomaly", "Forecast"],
  "modules": {
    "Metric":               {"counter": "CPU Utilization (system.cpu.percent)", "filter": "Monitor",     "source": "Linux Servers", "policy_type": None},
    "APM":                  {"counter": "Avg Response Time",                     "filter": "Service",     "source": "Checkout Service", "policy_type": ["Trace Metrics", "Trace Analytics"]},
    "Real User Monitoring": {"counter": "Page Load Time",                        "filter": "Application", "source": "Customer Portal",  "policy_type": None},
    "NetRoute":             {"counter": "Link Utilization",                      "filter": "Interface",   "source": "WAN Interface",    "policy_type": None},
  },
  # condition-specific parameter step (grounded in live form)
  "cond_params": {
    "Threshold Alert": "set severity: Critical Equals 85, Major Equals 75, Warning Equals 60; Notify-if-breach=5 min; Auto Clear=Never",
    "Baseline Alert":  "set baseline deviation params; Abnormality Occurrence=1; Auto Clear",
    "Anomaly":         "set Abnormality Occurrence threshold",
    "Forecast":        "set forecast horizon / breach threshold",
  },
  "smoke_combos": [("Metric", "Threshold Alert"), ("APM", "Baseline Alert"),
                   ("Real User Monitoring", "Anomaly"), ("NetRoute", "Forecast")],
}
JIRA = CONFIG["jira_base"] + CONFIG["jira_key"]
cases = []
def add(**k): k.setdefault("jira", JIRA); cases.append(k)

def step(action, expected): return {"action": action, "expected": expected}

# ---- Family 1: CREATE matrix (module x condition) = 16 ----
for mod, m in CONFIG["modules"].items():
    for cond in CONFIG["conditions"]:
        smoke = (mod, cond) in CONFIG["smoke_combos"]
        steps = [
            step("Navigate: Settings > Policy Settings", "Policy list opens"),
            step("Click 'Create Policy'", "Unified Create Policy screen opens with module left-nav"),
            step(f"Select module '{mod}' in the in-panel left nav", f"{mod} Policy form loads (stays in Create Policy, not the global {mod} module)"),
        ]
        if m["policy_type"]:
            steps.append(step(f"Set '{mod} Policy Type' = {m['policy_type'][0]}", "Counter list filters to that policy type"))
        steps += [
            step(f"Fill Policy Name = '{CONFIG['jira_key']}-{mod[:4]}-{cond.split()[0]}'", "Name accepted"),
            step("Add tags (optional)", "Tag chips render"),
            step(f"Select Set Conditions card '{cond}'", f"'{cond}' card highlighted; its parameters shown"),
            step(f"Select Counter = '{m['counter']}'", "Counter set; only module-eligible counters listed"),
            step(f"Set Source Filter = '{m['filter']}', Source = '{m['source']}'", "Source list driven by filter; source selected"),
            step(CONFIG["cond_params"][cond], "Parameters accepted/persist"),
            step("Click 'Create Policy'", "Success toast appears; redirect to policy list"),
            step("Search the new policy in the list", f"Policy visible, type='{cond}'"),
        ]
        add(id=f"TC-CREATE-{mod[:3].upper()}-{cond.split()[0][:3].upper()}",
            title=f"Create {mod} {cond} policy via unified Set Conditions",
            family="Create", module=mod, condition=cond,
            priority="P1" if smoke else "P2", severity="Critical" if smoke else "Major",
            ac=["A1", "A2", "B2", "B3"] + (["D1"] if m["policy_type"] else []),
            precond=["logged in", f"{mod} source '{m['source']}' exists"],
            data={"counter": m["counter"], "filter": m["filter"], "source": m["source"]},
            steps=steps, postcondition=f"Policy created under {mod}/{cond}",
            automation="Yes" if cond == "Threshold Alert" else "Yes (after source harvest)",
            impact="")

# ---- Family 2: VALIDATION matrix ----
add(id="TC-VAL-NAME", title="Policy Name required (validate-on-submit)", family="Validation",
    module="Metric", condition="Threshold Alert", priority="P1", severity="Critical", ac=["B1"],
    precond=["logged in"], data={},
    steps=[step("Open Create Policy (Metric)", "Form loads"),
           step("Leave Policy Name empty; click 'Create Policy'", "Button stays ENABLED but submit is blocked; required field highlighted; no policy created; stays on create screen"),
           step("Fill Policy Name; click 'Create Policy' with valid form", "Submit proceeds")],
    postcondition="No invalid policy created", automation="Yes",
    impact="B1 ships as validate-on-submit, NOT button-disable (confirmed live) — flag mechanism vs AC wording")
for cond in CONFIG["conditions"]:
    add(id=f"TC-VAL-COUNTER-{cond.split()[0][:3].upper()}", title=f"Counter mandatory on '{cond}' card", family="Validation",
        module="Metric", condition=cond, priority="P2", severity="Major", ac=["B2"],
        precond=["logged in"], data={},
        steps=[step(f"Open Create Policy; select '{cond}' card", "Card selected"),
               step("Leave Counter empty; click 'Create Policy'", "Counter field highlighted; save blocked")],
        postcondition="Save blocked without counter", automation="Yes", impact="")
add(id="TC-VAL-SOURCE-REQ", title="Source required when Source Filter != Everywhere/All", family="Validation",
    module="Metric", condition="Threshold Alert", priority="P2", severity="Major", ac=["B3"],
    precond=["logged in"], data={},
    steps=[step("Set Source Filter = Monitor (not Everywhere)", "Source field becomes required"),
           step("Leave Source empty; click Create Policy", "Source required; save blocked"),
           step("Set Source Filter = Everywhere", "Source not required")],
    postcondition="Source gating enforced", automation="Yes", impact="")
add(id="TC-VAL-OPERATOR", title="Severity operator dropdown works & persists", family="Validation",
    module="Metric", condition="Threshold Alert", priority="P2", severity="Major", ac=["B4"],
    precond=["logged in"], data={},
    steps=[step("On Threshold card, set Critical operator = Greater than, value 90", "Operator selectable"),
           step("Save, reopen the policy", "Operator + value persisted as Greater than / 90")],
    postcondition="Operator persists", automation="Yes (after source harvest)", impact="")

# ---- Family 3: STRUCTURE / LAYOUT ----
add(id="TC-STRUCT-CARDS", title="Set Conditions exposes four cards in correct order", family="Structure",
    module="(all)", condition="-", priority="P1", severity="Critical", ac=["A2"],
    precond=["logged in"], data={},
    steps=[step("Open Create Policy (any module)", "Form loads"),
           step("Inspect Set Conditions section", "Exactly 4 cards: Threshold Alert | Baseline Alert | Anomaly | Forecast, in order")],
    postcondition="-", automation="Yes", impact="")
add(id="TC-STRUCT-LAYOUT", title="Same layout structure across Metric/APM/RUM/NetRoute", family="Structure",
    module="(all)", condition="-", priority="P1", severity="Major", ac=["A1"],
    precond=["logged in"], data={},
    steps=[step("Open Create Policy for each of the 4 modules", "Each shows header + basic fields + Set Conditions + downstream accordions"),
           step("Compare layouts", "Consistent structure; only module-specific fields differ")],
    postcondition="-", automation="Yes", impact="")
add(id="TC-STRUCT-ACCORDION-LABELS", title="Downstream accordion labels per module (shipped wording)", family="Structure",
    module="(all)", condition="-", priority="P3", severity="Minor", ac=["A1"],
    precond=["logged in"], data={},
    steps=[step("Open Metric create", "Shows 'Set Alert Message' accordion"),
           step("Open APM create", "Shows 'Modify Default Alert' + Notification/Take Action/Declare Incident")],
    postcondition="-", automation="No (visual/manual)",
    impact="Label inconsistency Metric vs APM — flag to team; ticket wording matches neither")

# ---- Family 4: MODULE-SPECIFIC ----
add(id="TC-MOD-APM-POLICYTYPE", title="APM Policy Type switch filters counters", family="Module-specific",
    module="APM", condition="-", priority="P1", severity="Critical", ac=["D1"],
    precond=["logged in"], data={},
    steps=[step("APM create; set Policy Type = Trace Metrics", "Counter list = Trace Metrics counters"),
           step("Switch Policy Type = Trace Analytics", "Counter list changes to Trace Analytics counters")],
    postcondition="-", automation="Yes (after source harvest)", impact="")
add(id="TC-MOD-RUM-COUNTERS", title="RUM shows only RUM-eligible counters/filters", family="Module-specific",
    module="Real User Monitoring", condition="-", priority="P2", severity="Major", ac=["D2"],
    precond=["logged in"], data={},
    steps=[step("RUM create; open Counter dropdown", "Only RUM counters listed (no Metric/NetRoute counters)")],
    postcondition="-", automation="Yes (after source harvest)", impact="")
add(id="TC-MOD-NETROUTE-COUNTERS", title="NetRoute shows only NetRoute-eligible counters/filters", family="Module-specific",
    module="NetRoute", condition="-", priority="P2", severity="Major", ac=["D3"],
    precond=["logged in"], data={},
    steps=[step("NetRoute create; open Counter dropdown", "Only NetRoute counters listed")],
    postcondition="-", automation="Yes (after source harvest)", impact="")
add(id="TC-MOD-METRIC-REGRESSION", title="Metric retains existing counters/sources (no regression)", family="Module-specific",
    module="Metric", condition="-", priority="P1", severity="Critical", ac=["D4"],
    precond=["logged in"], data={},
    steps=[step("Metric create; verify counters & source filters", "All previously-available Metric counters/sources present")],
    postcondition="-", automation="Partial", impact="Regression guard for existing Metric policy capability")

# ---- Family 5: PERSISTENCE / EDIT ----
for mod in ["APM", "Real User Monitoring", "NetRoute"]:
    add(id=f"TC-EDIT-{mod[:3].upper()}", title=f"Edit existing {mod} Threshold policy in unified screen persists", family="Persistence",
        module=mod, condition="Threshold Alert", priority="P1", severity="Critical", ac=["A1", "F1", "B4"],
        precond=["logged in", f"an existing {mod} Threshold policy exists"], data={},
        steps=[step(f"Open an existing {mod} Threshold policy (edit)", "Renders in unified layout, Threshold card selected, values prefilled"),
               step("Change a severity value; Save", "Save succeeds"),
               step("Reopen the policy", "Updated value persisted")],
        postcondition="Policy updated", automation="Yes (after source harvest)", impact="F1 backward-compat")

# ---- Family 6: BACKWARD COMPAT ----
add(id="TC-BC-THRESHOLD", title="Existing Threshold policies still function (no behavior change)", family="Backward-compat",
    module="(all)", condition="Threshold Alert", priority="P1", severity="Critical", ac=["F1"],
    precond=["pre-existing Threshold policies exist"], data={},
    steps=[step("Open existing Threshold policies across modules", "Open without error in unified screen"),
           step("Trigger a known breach condition (manual/backend)", "Alert still generated as before")],
    postcondition="-", automation="No (backend-dependent)", impact="F1")
add(id="TC-BC-ANOMALY-FORECAST", title="Existing Anomaly/Forecast policies continue to function", family="Backward-compat",
    module="(all)", condition="Anomaly/Forecast", priority="P1", severity="Critical", ac=["F2", "A3"],
    precond=["pre-existing Anomaly/Forecast policy exists"], data={},
    steps=[step("Locate an existing Anomaly/Forecast policy", "Listed"),
           step("Open it", "Opens on matching card in unified screen; values intact; no error")],
    postcondition="-", automation="Manual first", impact="F2")
add(id="TC-BC-OLD-ENTRYPOINTS", title="Old standalone Anomaly/Forecast entry points removed/redirect", family="Backward-compat",
    module="(all)", condition="-", priority="P2", severity="Major", ac=["A3"],
    precond=["logged in"], data={},
    steps=[step("Navigate to any old standalone Anomaly/Forecast create URL/bookmark", "Redirects to unified flow or is gone; no broken page")],
    postcondition="-", automation="Yes", impact="A3 — saved links/docs to old flows affected")

# ---- Family 7: NEGATIVE / BOUNDARY ----
add(id="TC-NEG-DUP-NAME", title="Duplicate policy name rejected", family="Negative",
    module="Metric", condition="Threshold Alert", priority="P2", severity="Major", ac=["B1"],
    precond=["a policy with name X exists"], data={},
    steps=[step("Create a new policy with the same name X", "Validation/error: name not unique; not created")],
    postcondition="No duplicate", automation="Yes", impact="")
add(id="TC-NEG-SEVERITY-ORDER", title="Invalid severity ordering handled", family="Negative",
    module="Metric", condition="Threshold Alert", priority="P3", severity="Minor", ac=["B4"],
    precond=["logged in"], data={},
    steps=[step("Set Warning > Critical (illogical ordering)", "App validates/warns or accepts per spec — record actual behavior")],
    postcondition="-", automation="Manual first", impact="behavior unspecified in ticket — confirm with team/KG")
add(id="TC-NEG-RESET", title="Reset/Cancel discards unsaved changes", family="Negative",
    module="Metric", condition="Threshold Alert", priority="P3", severity="Minor", ac=[],
    precond=["logged in"], data={},
    steps=[step("Fill form partially; click Reset", "Form cleared; no policy created")],
    postcondition="-", automation="Yes", impact="")

# ============================ EMIT ============================
def steps_lines(c): return [f"{i}. {s['action']}  =>  EXPECTED: {s['expected']}" for i, s in enumerate(c["steps"], 1)]
json.dump(cases, open(os.path.join(D, "manual-cases-full.json"), "w", encoding="utf-8"), indent=2)

# Excel
wb = Workbook(); ws = wb.active; ws.title = "Manual Tests"
hdr = ["Test ID", "Family", "Title", "Priority", "Severity", "Module", "Condition", "Jira",
       "AC", "Preconditions", "Test Data", "Steps (with expected)", "Postcondition", "Automation?", "Impact (known)"]
ws.append(hdr)
hf = PatternFill("solid", fgColor="2B394F"); b = Side(style="thin", color="DDDDDD"); bd = Border(b, b, b, b)
for i in range(1, len(hdr) + 1):
    cc = ws.cell(1, i); cc.fill = hf; cc.font = Font(color="FFFFFF", bold=True)
    cc.alignment = Alignment(vertical="top", wrap_text=True); cc.border = bd
for c in cases:
    ws.append([c["id"], c["family"], c["title"], c["priority"], c["severity"], c["module"], c.get("condition", "-"),
               c["jira"], ", ".join(c.get("ac", [])), "\n".join(c.get("precond", [])),
               "; ".join(f"{k}={v}" for k, v in c.get("data", {}).items()), "\n".join(steps_lines(c)),
               c.get("postcondition", "-"), c.get("automation", ""), c.get("impact", "") or "—"])
    r = ws.max_row; ws.cell(r, 8).hyperlink = c["jira"]; ws.cell(r, 8).font = Font(color="0563C1", underline="single")
    for ci in range(1, len(hdr) + 1):
        ws.cell(r, ci).alignment = Alignment(vertical="top", wrap_text=True); ws.cell(r, ci).border = bd
for i, w in enumerate([14, 14, 34, 8, 9, 18, 14, 16, 12, 26, 26, 70, 24, 16, 34], 1):
    ws.column_dimensions[get_column_letter(i)].width = w
ws.freeze_panes = "A2"
wb.save(os.path.join(D, "MOTADATA-8503_ManualTests.xlsx"))

# PDF
styles = getSampleStyleSheet()
h1 = ParagraphStyle("h1", parent=styles["Heading1"], fontSize=15, textColor=colors.HexColor("#2B394F"))
h2 = ParagraphStyle("h2", parent=styles["Heading2"], fontSize=10.5, textColor=colors.HexColor("#2B394F"), spaceBefore=8)
body = ParagraphStyle("body", parent=styles["BodyText"], fontSize=8.4, leading=11.5)
small = ParagraphStyle("small", parent=styles["BodyText"], fontSize=8, textColor=colors.grey)
doc = SimpleDocTemplate(os.path.join(D, "MOTADATA-8503_ManualTests.pdf"), pagesize=A4,
                        topMargin=13 * mm, bottomMargin=12 * mm, leftMargin=13 * mm, rightMargin=13 * mm)
el = [Paragraph(f"{CONFIG['jira_key']} — Manual Test Suite", h1),
      Paragraph(f"{CONFIG['feature']} · {len(cases)} cases · Jira: <a href='{JIRA}'>{CONFIG['jira_key']}</a>", small), Spacer(1, 6)]
fam_order = ["Create", "Validation", "Structure", "Module-specific", "Persistence", "Backward-compat", "Negative"]
for fam in fam_order:
    fcases = [c for c in cases if c["family"] == fam]
    if not fcases: continue
    el.append(Paragraph(f"{fam} ({len(fcases)})", h2))
    for c in fcases:
        el.append(Paragraph(f"<b>{c['id']}</b> — {c['title']} "
                            f"<font color='grey'>[{c['priority']}/{c['severity']} · {c['module']} · AC {', '.join(c.get('ac', [])) or '-'} · Auto: {c.get('automation','')}]</font>", body))
        if c.get("precond"): el.append(Paragraph("<b>Pre:</b> " + "; ".join(c["precond"]), body))
        for ln in steps_lines(c): el.append(Paragraph(ln, body))
        if c.get("impact"): el.append(Paragraph(f"<b>Impact:</b> {c['impact']}", body))
        el.append(Spacer(1, 5))
doc.build(el)

# Coverage summary
from collections import Counter
fam_counts = Counter(c["family"] for c in cases)
acs = sorted({a for c in cases for a in c.get("ac", [])})
auto = Counter(c["automation"] for c in cases)
with open(os.path.join(D, "coverage-summary.md"), "w", encoding="utf-8") as f:
    f.write(f"# {CONFIG['jira_key']} — Manual Suite Coverage\n\n")
    f.write(f"Total cases: **{len(cases)}**\n\n## By family\n")
    for k in fam_order: f.write(f"- {k}: {fam_counts.get(k,0)}\n")
    f.write("\n## AC coverage\n" + ", ".join(acs) + "\n")
    f.write("\n## Automation triage\n")
    for k, v in auto.items(): f.write(f"- {k}: {v}\n")
print(f"CASES={len(cases)}  families={dict(fam_counts)}")
print("WROTE manual-cases-full.json, .xlsx, .pdf, coverage-summary.md")
