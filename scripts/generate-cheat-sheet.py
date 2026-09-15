#!/usr/bin/env python3
"""Generate the one-page Shopify command cheat sheet PDF."""

from html import escape
from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "output" / "pdf" / "shopify-command-cheat-sheet.pdf"

INTRO = [
    "Run commands from your theme folder. Select a store with <font face='Courier'>si &lt;store_abr&gt;</font>; then omit it. "
    "Replace <font face='Courier'>&lt;store_abr&gt;</font> with your alias. Quote theme names with spaces. Check the store with <font face='Courier'>si</font>.",
    "A configured <font face='Courier'>defaultStore</font> overrides the remembered store. Personal config is created on first use at <font face='Courier'>~/.sshop.json</font>.",
]

COMMANDS = [
    ("si <store_abr>", "Select a store"),
    ("si", "Show current store and theme"),
    ("sl", "List themes"),
    ("sd", "Start a development theme"),
    ('sd "My Theme"', "Develop a named theme with editor sync"),
    ("sp", "Pull the live theme"),
    ('sp "My Theme"', "Pull a named theme"),
    ("sp -p", "Pull only live template/config JSON"),
    ('spl "My Theme"', "Pull named theme template/config JSON"),
    ("sp -d", "Pull the development theme"),
    ("spa", "Pull live; may delete unmatched local files"),
    ("sc", "Check theme code"),
    ("sf", "Fix supported code issues"),
    ("lo", "Log out of Shopify"),
    ("shelp", "Show help"),
]

OPTIONS = [
    ("-g / --global", "sinit -g", "Personal config (sinit, simport; sstores defaults to global)"),
    ("-d / --development", "sp -d", "Development theme (sp, spl, spa, si)"),
    ("-p PORT / --port PORT", "sd -p 9293", "Change the development port"),
    ("-p / --json-only", "sp -p", "Pull only template/config JSON"),
    ("-j / --json", "sl -j", "JSON output (sl, si)"),
    ("--dry-run", 'sd "My Theme" --dry-run', "Preview without running"),
    ("-s and -t", 'sd -s demo -t "My Theme"', "Choose store and theme"),
]

STORES = [
    ("sstores", "List store aliases"),
    ("sstores add <alias> <store>", "Add or update an alias"),
    ("sstores remove <alias>", "Remove an alias"),
    ("sstores .", "Edit stores in your config file"),
    ("sconfig", "Show settings and config locations"),
    ("sinit", "Create a project config"),
    ("sinit -g", "Create personal config (never overwrites)"),
    ("simport ./base_custom_cli.sh -g", "Import legacy store aliases"),
]

FOOTER = (
    "Important: sp overwrites matching files; spa may also delete unmatched files. sd syncs to the remote theme. "
    "sf changes local code. Use --dry-run to preview. PowerShell: append .cmd (for example, sp.cmd)."
)


def command_cell(text: str, size: int = 7) -> Paragraph:
    return Paragraph(f"<font face='Courier' size='{size}'>{escape(text)}</font>", ParagraphStyle("cmd"))


def body_cell(text: str, styles, size: int = 7) -> Paragraph:
    return Paragraph(text, ParagraphStyle("body", parent=styles["BodySmall"], fontSize=size, leading=size + 2))


def make_table(headers, rows, col_widths, styles, body_size=7):
    header_style = ParagraphStyle("hdr", parent=styles["Heading3"], fontSize=7, leading=8)
    data = [[Paragraph(f"<b>{headers[0]}</b>", header_style), Paragraph(f"<b>{headers[1]}</b>", header_style)]]
    if len(headers) == 3:
        data[0].append(Paragraph(f"<b>{headers[2]}</b>", header_style))
    for row in rows:
        if len(row) == 2:
            data.append([command_cell(row[0], body_size), body_cell(row[1], styles, body_size)])
        else:
            data.append([command_cell(row[0], body_size), command_cell(row[1], body_size), body_cell(row[2], styles, body_size)])
    table = Table(data, colWidths=col_widths, hAlign="LEFT")
    table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#f3f3f3")),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("BOTTOMPADDING", (0, 0), (-1, 0), 2),
                ("TOPPADDING", (0, 0), (-1, 0), 2),
                ("FONTNAME", (0, 1), (-1, -1), "Helvetica"),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 3),
                ("RIGHTPADDING", (0, 0), (-1, -1), 3),
                ("TOPPADDING", (0, 1), (-1, -1), 1),
                ("BOTTOMPADDING", (0, 1), (-1, -1), 1),
                ("GRID", (0, 0), (-1, -1), 0.25, colors.HexColor("#cccccc")),
            ]
        )
    )
    return table


def build_pdf():
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    styles = getSampleStyleSheet()
    styles.add(ParagraphStyle(name="TitleCustom", parent=styles["Title"], fontSize=14, spaceAfter=4, leading=16))
    styles.add(ParagraphStyle(name="BodySmall", parent=styles["BodyText"], fontSize=7, leading=9, spaceAfter=2))
    styles.add(ParagraphStyle(name="Section", parent=styles["Heading2"], fontSize=9, spaceBefore=3, spaceAfter=2, leading=10))
    styles.add(ParagraphStyle(name="Footer", parent=styles["BodyText"], fontSize=6.5, leading=8, textColor=colors.HexColor("#444444")))
    styles.add(ParagraphStyle(name="Link", parent=styles["BodyText"], fontSize=6.5, leading=8, textColor=colors.HexColor("#444444")))

    doc = SimpleDocTemplate(
        str(OUTPUT),
        pagesize=letter,
        leftMargin=0.5 * inch,
        rightMargin=0.5 * inch,
        topMargin=0.4 * inch,
        bottomMargin=0.35 * inch,
        title="Shopify command cheat sheet",
        author="Simplified Shopify CLI",
    )

    story = [Paragraph("Shopify command cheat sheet", styles["TitleCustom"])]
    for line in INTRO:
        story.append(Paragraph(line, styles["BodySmall"]))
    story.append(Spacer(1, 2))
    story.append(Paragraph("Commands", styles["Section"]))
    story.append(make_table(("Command", "What it does"), COMMANDS, [1.85 * inch, 5.0 * inch], styles))
    story.append(Paragraph("Options", styles["Section"]))
    story.append(make_table(("Option", "Example", "Meaning"), OPTIONS, [1.25 * inch, 1.45 * inch, 4.15 * inch], styles))
    story.append(Paragraph("Store aliases and setup", styles["Section"]))
    story.append(make_table(("Command", "What it does"), STORES, [2.35 * inch, 4.5 * inch], styles))
    story.append(Spacer(1, 3))
    story.append(Paragraph(FOOTER, styles["Footer"]))
    story.append(Paragraph("github.com/deanschulz4/Shopify-CLI-Simplified", styles["Link"]))

    doc.build(story, onFirstPage=lambda canvas, doc: canvas.setFont("Helvetica", 6.5) or canvas.drawRightString(
        doc.pagesize[0] - doc.rightMargin, 0.28 * inch, "1 / 1"
    ))
    print(f"Wrote {OUTPUT}")


if __name__ == "__main__":
    build_pdf()
