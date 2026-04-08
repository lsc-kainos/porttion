from __future__ import annotations

import streamlit as st

from services.config import init_config_state
from services.portfolio import init_portfolio_state

st.set_page_config(page_title="Plataforma de Candlesticks com IA", layout="wide")

init_config_state()
init_portfolio_state()

navigation = st.navigation(
    {
        "Análise": [
            st.Page("pages/home.py", title="Home", icon=":material/home:"),
            st.Page("pages/carteira.py", title="Carteira", icon=":material/account_balance_wallet:"),
            st.Page("pages/dashboard.py", title="Dashboard", icon=":material/candlestick_chart:"),
            st.Page("pages/relatorio.py", title="Relatório", icon=":material/description:"),
        ],
        "Sistema": [
            st.Page("pages/configuracoes.py", title="Configurações", icon=":material/settings:"),
        ],
    },
    position="sidebar",
)

navigation.run()
