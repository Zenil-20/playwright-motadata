# Emit downloadable manual-test deliverables (Excel + PDF) + a coverage summary
# for MOTADATA-8898 from manual-cases.json. Jira links + known impact included.
import json, os
from openpyxl import Workbook
from openpyxl.styles import Font, Alignment, PatternFill, Border, Side
from openpyxl.utils import get_column_letter
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle

D = os.path.dirname(__file__)
JIRA = "http://172.16.10.6:8080/browse/MOTADATA-8898"
cases = json.load(open(os.path.join(D, "manual-cases.json"), encoding="utf-8"))

# Impact strictly traceable to the ticket (no speculation):
IMPACT = {
  "A1": "Descriptions newly extended to APM/RUM/Log/NetRoute/Flow — previously Metric-only; risk if any category renders blank.",
  "A2": "Description must convey what the metric measures / how to read values / root-cause hint.",
  "A5": "Description text is mapped from each category's data source — wrong/empty mapping is a data defect.",
  "A6": "Format/structure must stay consistent across categories.",
  "A7": "Missing description data must show an 'unavailable' message, never a silent blank.",
}
def impact_for(tr):
    return [v for k, v in IMPACT.items() if k in (tr or [])]

def steps_text(c):
    return [f"{i+1}. {s['action']}  ->  {s.get('expected','')}" for i, s in enumerate(c.get("steps", []))]

# ---------------- EXCEL ----------------
wb = Workbook(); ws = wb.active; ws.title = "MOTADATA-8898 Manual Tests"
hdr = ["Test ID","Title","Jira","Category","Risk","Priority","Traces To (AC)","Preconditions",
       "Steps -> Expected","Final Expected","Edge Cases","Automation","Impact / Affected (known)"]
head_fill = PatternFill("solid", fgColor="2B394F"); head_font = Font(color="FFFFFF", bold=True)
thin = Side(style="thin", color="CCCCCC"); border = Border(thin,thin,thin,thin)
ws.append(hdr)
for i,_ in enumerate(hdr,1):
    cell = ws.cell(1,i); cell.fill=head_fill; cell.font=head_font
    cell.alignment=Alignment(vertical="top", wrap_text=True); cell.border=border
for c in cases:
    row = [c["id"], c["title"], JIRA, c.get("category",""), c.get("risk",""), c.get("priority",""),
           ", ".join(c.get("traces_to",[])), "\n".join(c.get("preconditions",[])),
           "\n".join(steps_text(c)), "\n".join(c.get("expected",[])),
           "\n".join(c.get("edge_cases",[])), c.get("automation",""),
           "\n".join(impact_for(c.get("traces_to",[]))) or "—"]
    ws.append(row)
    r = ws.max_row
    for ci in range(1,len(hdr)+1):
        cell = ws.cell(r,ci); cell.alignment=Alignment(vertical="top", wrap_text=True); cell.border=border
    ws.cell(r,3).hyperlink = JIRA; ws.cell(r,3).font = Font(color="0563C1", underline="single")
widths = [16,40,34,14,12,9,16,30,60,28,28,16,40]
for i,w in enumerate(widths,1):
    ws.column_dimensions[get_column_letter(i)].width = w
ws.freeze_panes = "A2"
xlsx = os.path.join(D, "MOTADATA-8898_ManualTests.xlsx"); wb.save(xlsx)

# ---------------- PDF ----------------
pdf = os.path.join(D, "MOTADATA-8898_ManualTests.pdf")
doc = SimpleDocTemplate(pdf, pagesize=A4, topMargin=15*mm, bottomMargin=15*mm, leftMargin=14*mm, rightMargin=14*mm)
ss = getSampleStyleSheet()
h1 = ParagraphStyle("h1", parent=ss["Title"], fontSize=16, spaceAfter=4)
meta = ParagraphStyle("meta", parent=ss["Normal"], fontSize=8, textColor=colors.grey, spaceAfter=10)
h2 = ParagraphStyle("h2", parent=ss["Heading2"], fontSize=11, spaceBefore=10, spaceAfter=3, textColor=colors.HexColor("#2B394F"))
body = ParagraphStyle("body", parent=ss["Normal"], fontSize=8.5, leading=12)
small = ParagraphStyle("small", parent=ss["Normal"], fontSize=8, leading=11, textColor=colors.HexColor("#333333"))
story = [Paragraph("MOTADATA-8898 — Metric Description in Widget Creation (APM/RUM/Log/NetRoute/Flow)", h1),
         Paragraph(f'Manual Test Suite &nbsp;|&nbsp; <a href="{JIRA}">{JIRA}</a> &nbsp;|&nbsp; {len(cases)} cases', meta)]
for c in cases:
    story.append(Paragraph(f'{c["id"]} — {c["title"]}', h2))
    story.append(Paragraph(f'<b>Category:</b> {c.get("category","")} &nbsp; <b>Risk:</b> {c.get("risk","")} '
                           f'&nbsp; <b>Priority:</b> {c.get("priority","")} &nbsp; <b>Traces to:</b> {", ".join(c.get("traces_to",[]))} '
                           f'&nbsp; <b>Automation:</b> {c.get("automation","")}', small))
    story.append(Paragraph("<b>Preconditions:</b> " + "; ".join(c.get("preconditions",[])), small))
    rows = [["#", "Step", "Expected"]]
    for i, s in enumerate(c.get("steps", []), 1):
        rows.append([str(i), Paragraph(s["action"], body), Paragraph(s.get("expected",""), body)])
    t = Table(rows, colWidths=[8*mm, 88*mm, 86*mm])
    t.setStyle(TableStyle([
        ("BACKGROUND",(0,0),(-1,0),colors.HexColor("#2B394F")), ("TEXTCOLOR",(0,0),(-1,0),colors.white),
        ("FONTSIZE",(0,0),(-1,-1),8), ("VALIGN",(0,0),(-1,-1),"TOP"),
        ("GRID",(0,0),(-1,-1),0.4,colors.HexColor("#CCCCCC")), ("ROWBACKGROUNDS",(0,1),(-1,-1),[colors.white,colors.HexColor("#F4F6F9")])]))
    story.append(t)
    story.append(Paragraph("<b>Final expected:</b> " + "; ".join(c.get("expected",[])), small))
    imp = impact_for(c.get("traces_to",[]))
    if imp: story.append(Paragraph("<b>Impact / Affected:</b> " + " ".join(imp), small))
    story.append(Spacer(1, 4))
doc.build(story)
print("WROTE:", os.path.basename(xlsx), "+", os.path.basename(pdf), "| cases:", len(cases))
