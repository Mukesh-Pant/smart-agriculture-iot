# =============================================================
# app/services/pdf_service.py
# Generates bilingual PDF farm report using xhtml2pdf.
# Pure Python — no GTK+ required (Windows compatible).
# =============================================================

import os
import logging
from datetime import datetime
from typing import Optional
from jinja2 import Environment, FileSystemLoader

logger = logging.getLogger(__name__)

_TEMPLATE_DIR = os.path.join(os.path.dirname(__file__), "..", "templates")


def _render_html(data: dict) -> str:
    """Render the Jinja2 HTML template with report data."""
    env = Environment(
        loader=FileSystemLoader(_TEMPLATE_DIR),
        autoescape=True,
    )
    template = env.get_template("report.html")
    return template.render(**data)


async def generate_pdf(data: dict) -> bytes:
    """
    Renders an HTML report template and converts to PDF bytes via xhtml2pdf.
    Falls back to a simple HTML-only bytes response if xhtml2pdf is unavailable.
    """
    if not data.get("report_id"):
        data["report_id"] = f"AGS-{datetime.utcnow().strftime('%Y%m%d')}-DEMO"
    if not data.get("generated_at"):
        data["generated_at"] = datetime.utcnow().strftime("%B %d, %Y at %H:%M UTC")

    html_content = _render_html(data)

    try:
        from xhtml2pdf import pisa
        import io

        pdf_buffer = io.BytesIO()
        pisa_status = pisa.CreatePDF(
            html_content.encode("utf-8"),
            dest=pdf_buffer,
            encoding="utf-8",
        )
        if pisa_status.err:
            logger.error(f"[PDF] xhtml2pdf error: {pisa_status.err}")
            raise RuntimeError("PDF generation failed")

        return pdf_buffer.getvalue()

    except ImportError:
        logger.warning("[PDF] xhtml2pdf not installed. Returning HTML as fallback.")
        return html_content.encode("utf-8")
    except Exception as e:
        logger.error(f"[PDF] generate_pdf failed: {e}")
        return html_content.encode("utf-8")
