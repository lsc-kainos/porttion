from __future__ import annotations

import streamlit as st

from components.candlestick_chart import build_candlestick_chart
from services.ai_agent import analyze_asset
from services.config import get_config, init_config_state
from services.data_provider import get_ohlc_data
from services.portfolio import get_portfolio, init_portfolio_state

init_config_state()
init_portfolio_state()

st.title("Dashboard")
st.caption("Análise individual de ativos com gráfico e recomendação por IA.")

portfolio = get_portfolio()
config = get_config()
period_map = {"S": 7, "2S": 14, "M": 30, "6M": 182}

if not portfolio:
    st.info("Adicione ativos na página Carteira para iniciar a análise.")
    st.stop()

selected_ticker = st.selectbox("Selecione um ativo", portfolio)
selected_period = st.radio(
    "Período do gráfico",
    options=list(period_map.keys()),
    index=2,
    horizontal=True,
)

full_ohlc_data = get_ohlc_data(selected_ticker, period="1y", interval="1d")
if full_ohlc_data.empty:
    st.error(
        "Não foi possível obter dados do ativo selecionado no Yahoo Finance. "
        "Revise o ticker na página Carteira."
    )
    st.stop()

ohlc_data = full_ohlc_data.tail(period_map[selected_period])

st.plotly_chart(
    build_candlestick_chart(ohlc_data, f"{selected_ticker} - Candlestick ({selected_period})"),
    use_container_width=True,
)

if not config["api_key"]:
    st.warning("Configure sua API key na página Configurações para habilitar a análise por IA.")

if st.button(
    "Analisar ativo (D-7)",
    type="primary",
    disabled=not bool(config["api_key"]),
):
    with st.spinner("Executando análise com IA..."):
        result = analyze_asset(selected_ticker, full_ohlc_data.tail(7))
    st.session_state["dashboard_result"] = result
    st.session_state["dashboard_result_ticker"] = selected_ticker

result = st.session_state.get("dashboard_result")
result_ticker = st.session_state.get("dashboard_result_ticker")
if result and result_ticker == selected_ticker:
    st.markdown("### Resultado da análise")
    col1, col2 = st.columns(2)
    col1.metric("Tendência", result["tendencia"])
    col2.metric("Recomendação", result["recomendacao"])
    st.write(f"**Justificativa:** {result['justificativa']}")
