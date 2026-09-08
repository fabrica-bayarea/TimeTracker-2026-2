import csv
import io
from datetime import date
from typing import Optional

from fastapi import APIRouter, Depends, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from fpdf import FPDF

from .. import schemas, crud
from ..database import get_db

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get(
    "/summary",
    response_model=schemas.DailySummaryResponse,
    summary="Sumário diário de produtividade",
    description=(
        "Retorna o total de horas trabalhadas e a distribuição por categoria "
        "para uma data informada, filtrado opcionalmente por colaborador."
    ),
)
def daily_summary(
    target_date: date = Query(..., alias="date",
                              description="Data no formato AAAA-MM-DD"),
    username: Optional[str] = Query(None,
                                    description="Filtrar por colaborador"),
    db: Session = Depends(get_db),
):
    return crud.get_daily_summary(db, target_date, username)


@router.get(
    "/export/csv",
    summary="Exporta o sumário diário em CSV",
    description="RF11 - Exportação de dados em formato CSV.",
)
def export_csv(
    target_date: date = Query(..., alias="date"),
    username: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    summary = crud.get_daily_summary(db, target_date, username)

    buffer = io.StringIO()
    writer = csv.writer(buffer)

    writer.writerow(["username", "category", "total_seconds"])

    for user in summary.users:
        for cat in user.by_category:
            writer.writerow([user.username, cat.category, cat.total_seconds])
    buffer.seek(0)

    filename = f"relatorio_{target_date.isoformat()}.csv"

    return StreamingResponse(
        iter([buffer.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )


@router.get(
    "/export/pdf",
    summary="Exporta o sumário diário em PDF",
    description="RF11 - Exportação de dados em formato PDF.",
)
def export_pdf(
    target_date: date = Query(..., alias="date"),
    username: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    summary = crud.get_daily_summary(db, target_date, username)

    pdf = FPDF()

    pdf.add_page()
    pdf.set_font("Helvetica", "B", 14)
    pdf.cell(0, 10, f"Relatorio de Produtividade - {summary.date}", ln=True)
    pdf.set_font("Helvetica", "", 11)

    for user in summary.users:
        pdf.ln(4)
        total_h = user.total_seconds / 3600

        pdf.set_font("Helvetica", "B", 12)
        pdf.cell(0, 8, f"{user.username} - {total_h:.2f}h", ln=True)
        pdf.set_font("Helvetica", "", 11)

        for cat in user.by_category:
            cat_h = cat.total_seconds / 3600
            pdf.cell(0, 7, f"   {cat.category}: {cat_h:.2f}h", ln=True)

    pdf_bytes = bytes(pdf.output(dest="S"))
    filename = f"relatorio_{target_date.isoformat()}.pdf"

    return StreamingResponse(
        iter([pdf_bytes]),
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )
