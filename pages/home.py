from __future__ import annotations

import streamlit as st

st.title("Home")
st.caption("Porttion — Portfolio Evaluation")
st.markdown(
    """
Esta plataforma permite:

- Visualizar candles OHLC por ativo
- Gerenciar uma carteira simples de tickers
- Executar análise automática via LLM
- Gerar relatório consolidado em Markdown
- Exportar relatório em PDF
"""
)

st.markdown("### Fluxo recomendado")
st.markdown(
    """
1. Acesse **Configurações** e informe API key + modelo.
2. Cadastre ativos em **Carteira** (ticker é validado no Yahoo Finance).
3. Veja análise individual em **Dashboard**.
4. Gere análise em massa em **Relatório** e exporte para PDF.
"""
)

st.warning(
    "A recomendação é educacional e não substitui avaliação profissional de investimento."
)
