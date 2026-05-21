from __future__ import annotations

import pandas as pd
import streamlit as st

from services.portfolio import add_asset, get_portfolio, init_portfolio_state, remove_assets

init_portfolio_state()

st.title("Carteira")
st.caption("Gerencie os ativos que serão usados no Dashboard e no Relatório.")
st.info("Cada ticker é validado no Yahoo Finance antes de ser salvo.")

with st.form("add-asset-form", clear_on_submit=True):
    new_ticker = st.text_input(
        "Novo ativo",
        placeholder="Ex.: BOVA11, DOL, EUR, PETR4, TS2031",
    )
    add_submitted = st.form_submit_button("Validar e adicionar")

if add_submitted:
    success, message = add_asset(new_ticker)
    if success:
        st.success(message)
        st.rerun()
    else:
        st.warning(message)

portfolio = get_portfolio()

if not portfolio:
    st.info("Sua carteira está vazia.")
else:
    st.markdown("### Ativos cadastrados")
    st.dataframe(
        pd.DataFrame({"ativo": portfolio}),
        use_container_width=True,
        hide_index=True,
    )

    selected_assets = st.multiselect(
        "Selecione ativos para remover",
        options=portfolio,
    )

    if st.button(
        "Remover selecionados",
        type="secondary",
        disabled=not selected_assets,
    ):
        removed = remove_assets(selected_assets)
        if removed:
            st.success(f"{removed} ativo(s) removido(s).")
            st.rerun()
