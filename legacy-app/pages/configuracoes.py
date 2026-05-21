from __future__ import annotations

import streamlit as st

from services.config import (
    DEFAULT_MODEL,
    apply_config,
    clear_local_config,
    get_model_options,
    init_config_state,
)
from services.local_storage import is_available as local_storage_available

init_config_state()

st.title("Configurações")
st.caption("Defina API key, modelo de IA e forma de persistência.")
if not local_storage_available():
    st.warning(
        "Componente de localStorage indisponível no ambiente atual. "
        "Use persistência em arquivo local para manter os dados entre sessões."
    )

model_options = get_model_options()
current_model = st.session_state.get("model", DEFAULT_MODEL)
current_api_key = st.session_state.get("api_key", "")
current_persistence = st.session_state.get("config_persistence", "session")

show_custom = current_model not in model_options
selector_options = model_options + ["custom"]
selected_model = st.selectbox(
    "Modelo",
    options=selector_options,
    index=selector_options.index("custom" if show_custom else current_model),
    format_func=lambda value: "Custom (manual)" if value == "custom" else value,
)

custom_model = st.text_input(
    "Modelo custom",
    value=current_model if show_custom else "",
    placeholder="Ex.: gpt-4.1-mini",
    disabled=selected_model != "custom",
)

api_key = st.text_input(
    "OpenAI API key",
    type="password",
    value=current_api_key,
    placeholder="sk-...",
)

persistence_label = st.radio(
    "Persistência",
    options=[
        "LocalStorage (navegador)",
        "Sessão",
        "Arquivo local (config.json)",
    ],
    index=(
        2
        if current_persistence == "local"
        else 1 if current_persistence == "session" else 0
    ),
)

if st.button("Salvar configurações", type="primary"):
    final_model = custom_model.strip() if selected_model == "custom" else selected_model
    if not final_model:
        st.error("Informe um modelo válido.")
    else:
        if persistence_label.startswith("Arquivo"):
            persistence = "local"
        elif persistence_label.startswith("Sessão"):
            persistence = "session"
        else:
            persistence = "localstorage"
        apply_config(api_key=api_key, model=final_model, persistence=persistence)
        st.success("Configurações salvas.")

if st.button("Limpar config persistida (localStorage + arquivo)", type="secondary"):
    clear_local_config()
    st.info("Persistência limpa.")

st.markdown("### Estado atual")
st.write(
    {
        "api_key_configurada": bool(st.session_state.get("api_key")),
        "modelo": st.session_state.get("model", DEFAULT_MODEL),
        "persistencia": st.session_state.get("config_persistence", "session"),
    }
)

st.warning("Evite versionar `config.json` com credenciais reais.")
