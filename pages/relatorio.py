from __future__ import annotations

import time
from datetime import datetime

import pandas as pd
import streamlit as st

from services.ai_agent import analyze_asset, generate_portfolio_report_markdown
from services.config import get_config, init_config_state
from services.data_provider import get_recent_ohlc
from services.local_storage import get_local_json, set_local_json
from services.portfolio import get_portfolio, init_portfolio_state
from services.report_export import markdown_to_pdf_bytes

REPORT_STORAGE_KEY = "vallet_manager_report"
_REPORT_HYDRATED_FLAG = "_report_local_storage_hydrated"


def _format_optional(value: float | None) -> str:
    if value is None:
        return "-"
    return f"{value:.2f}"


def _build_price_metrics(ohlc_data: pd.DataFrame) -> dict[str, str]:
    if ohlc_data.empty:
        return {
            "fechamento_atual": "-",
            "variacao_7d_pct": "-",
            "maxima_7d": "-",
            "minima_7d": "-",
            "amplitude_7d_pct": "-",
        }

    close_series = ohlc_data["Close"].dropna()
    high_series = ohlc_data["High"].dropna()
    low_series = ohlc_data["Low"].dropna()

    if close_series.empty or high_series.empty or low_series.empty:
        return {
            "fechamento_atual": "-",
            "variacao_7d_pct": "-",
            "maxima_7d": "-",
            "minima_7d": "-",
            "amplitude_7d_pct": "-",
        }

    close_first = float(close_series.iloc[0])
    close_last = float(close_series.iloc[-1])
    max_high = float(high_series.max())
    min_low = float(low_series.min())

    variation_pct = ((close_last - close_first) / close_first * 100) if close_first else None
    amplitude_pct = ((max_high - min_low) / min_low * 100) if min_low else None

    return {
        "fechamento_atual": _format_optional(close_last),
        "variacao_7d_pct": _format_optional(variation_pct),
        "maxima_7d": _format_optional(max_high),
        "minima_7d": _format_optional(min_low),
        "amplitude_7d_pct": _format_optional(amplitude_pct),
    }

init_config_state()
init_portfolio_state()

if not st.session_state.get(_REPORT_HYDRATED_FLAG):
    persisted_report = get_local_json(REPORT_STORAGE_KEY)
    if isinstance(persisted_report, dict):
        persisted_results = persisted_report.get("results")
        persisted_markdown = persisted_report.get("markdown")
        if isinstance(persisted_results, list):
            st.session_state["report_results"] = persisted_results
        if isinstance(persisted_markdown, str):
            st.session_state["report_markdown"] = persisted_markdown
        if persisted_report.get("generated_at"):
            st.session_state["report_generated_at"] = str(persisted_report["generated_at"])
    st.session_state[_REPORT_HYDRATED_FLAG] = True

st.title("Relatório")
st.caption("Análise consolidada de todos os ativos da carteira.")

portfolio = get_portfolio()
config = get_config()

if not portfolio:
    st.info("A carteira está vazia. Adicione ativos antes de gerar o relatório.")
    st.stop()

st.write(f"Ativos na carteira: **{len(portfolio)}**")
if not config["api_key"]:
    st.warning("Configure sua API key na página Configurações para gerar o relatório.")

if st.button("Gerar relatório em Markdown", type="primary", disabled=not bool(config["api_key"])):
    results: list[dict[str, str]] = []
    with st.spinner("Gerando análises dos ativos..."):
        for ticker in portfolio:
            ohlc_data = get_recent_ohlc(ticker, days=7)
            result = analyze_asset(ticker, ohlc_data)
            enriched_result = {
                **result,
                **_build_price_metrics(ohlc_data),
            }
            results.append(enriched_result)
            time.sleep(0.35)

    total_assets = len(results)
    buy_count = sum(
        1
        for row in results
        if str(row.get("recomendacao", "")).strip().lower() == "comprar"
    )
    no_buy_count = total_assets - buy_count
    buy_percentage = (buy_count / total_assets * 100) if total_assets else 0.0
    meta = {
        "generated_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "total_assets": total_assets,
        "buy_count": buy_count,
        "no_buy_count": no_buy_count,
        "buy_percentage": round(buy_percentage, 2),
    }

    with st.spinner("Consolidando texto do relatório com IA..."):
        markdown_report = generate_portfolio_report_markdown(results, meta=meta)

    generated_at = meta["generated_at"]
    st.session_state["report_results"] = results
    st.session_state["report_markdown"] = markdown_report
    st.session_state["report_generated_at"] = generated_at

    set_local_json(
        REPORT_STORAGE_KEY,
        {"results": results, "markdown": markdown_report, "generated_at": generated_at},
    )

report_results = st.session_state.get("report_results")
report_markdown = st.session_state.get("report_markdown")
report_generated_at = st.session_state.get("report_generated_at")

if report_results and report_markdown:
    dataframe = pd.DataFrame(report_results)
    total_assets = len(dataframe)
    buy_count = int(
        dataframe["recomendacao"].astype(str).str.strip().str.lower().eq("comprar").sum()
    )
    no_buy_count = total_assets - buy_count
    buy_percentage = (buy_count / total_assets * 100) if total_assets else 0.0

    st.markdown("### Resumo agregado")
    col1, col2, col3 = st.columns(3)
    col1.metric("% Compra", f"{buy_percentage:.1f}%")
    col2.metric("Compra", buy_count)
    col3.metric("Não compra", no_buy_count)

    if report_generated_at:
        st.caption(f"Última geração: {report_generated_at}")

    st.markdown("### Relatório da IA (Markdown)")
    st.markdown(report_markdown)

    markdown_bytes = report_markdown.encode("utf-8")
    pdf_bytes: bytes | None = None
    pdf_error_message = ""
    try:
        pdf_bytes = markdown_to_pdf_bytes(
            report_markdown, title="Relatório Consolidado da Carteira (IA)"
        )
    except Exception as exc:
        pdf_error_message = str(exc)

    st.markdown("### Exportação")
    col_md, col_pdf = st.columns(2)
    col_md.download_button(
        "Download Markdown (.md)",
        data=markdown_bytes,
        file_name="relatorio_carteira.md",
        mime="text/markdown",
    )
    if pdf_bytes is not None:
        col_pdf.download_button(
            "Download PDF (.pdf)",
            data=pdf_bytes,
            file_name="relatorio_carteira.pdf",
            mime="application/pdf",
        )
    else:
        col_pdf.warning(f"Não foi possível gerar PDF: {pdf_error_message}")
