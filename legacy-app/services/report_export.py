from __future__ import annotations

from fpdf import FPDF


def _latin1_safe(text: str) -> str:
    return text.encode("latin-1", errors="replace").decode("latin-1")


def _effective_width(pdf: FPDF) -> float:
    width = pdf.w - pdf.l_margin - pdf.r_margin
    return width if width > 10 else 10


def _write_line(pdf: FPDF, text: str, line_height: float) -> None:
    pdf.set_x(pdf.l_margin)
    pdf.multi_cell(_effective_width(pdf), line_height, _latin1_safe(text))
    pdf.set_x(pdf.l_margin)


def markdown_to_pdf_bytes(markdown_content: str, title: str = "Relatório") -> bytes:
    pdf = FPDF()
    pdf.set_auto_page_break(auto=True, margin=12)
    pdf.add_page()

    pdf.set_font("Helvetica", "B", 16)
    _write_line(pdf, title, 10)
    pdf.ln(2)

    default_font_size = 11
    pdf.set_font("Helvetica", size=default_font_size)

    for raw_line in markdown_content.splitlines():
        line = raw_line.rstrip()
        stripped = line.strip()

        if not stripped:
            pdf.ln(3)
            continue

        if stripped.startswith("#"):
            level = len(stripped) - len(stripped.lstrip("#"))
            heading = stripped[level:].strip()
            font_size = {1: 15, 2: 13, 3: 12}.get(level, 11)
            pdf.set_font("Helvetica", "B", font_size)
            _write_line(pdf, heading, 8)
            pdf.set_font("Helvetica", size=default_font_size)
            continue

        if stripped.startswith(("- ", "* ")):
            _write_line(pdf, f"- {stripped[2:].strip()}", 6)
            continue

        _write_line(pdf, stripped, 6)

    content = pdf.output(dest="S")
    if isinstance(content, (bytes, bytearray)):
        return bytes(content)
    return str(content).encode("latin-1", errors="replace")
