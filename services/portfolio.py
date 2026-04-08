from __future__ import annotations

import json
from pathlib import Path

import streamlit as st

from services.data_provider import normalize_ticker, validate_and_resolve_ticker
from services.local_storage import get_local_json, set_local_json

PORTFOLIO_FILE = Path("portfolio.json")
PORTFOLIO_STORAGE_KEY = "vallet_manager_portfolio"
_PORTFOLIO_KEY = "portfolio"
_INIT_FLAG = "_portfolio_initialized"


def _normalize_ticker(ticker: str) -> str:
    normalized = normalize_ticker(ticker)
    if normalized.endswith(".SA"):
        base = normalized[:-3]
        return base if base else normalized
    return normalized


def _load_file_portfolio() -> list[str]:
    if not PORTFOLIO_FILE.exists():
        return []
    try:
        raw = json.loads(PORTFOLIO_FILE.read_text(encoding="utf-8"))
    except (json.JSONDecodeError, OSError):
        return []
    if not isinstance(raw, list):
        return []
    return [_normalize_ticker(item) for item in raw if isinstance(item, str) and item.strip()]


def _save_file_portfolio(portfolio: list[str]) -> None:
    PORTFOLIO_FILE.write_text(
        json.dumps(portfolio, ensure_ascii=False, indent=2), encoding="utf-8"
    )


def _save_portfolio(portfolio: list[str]) -> None:
    _save_file_portfolio(portfolio)
    set_local_json(PORTFOLIO_STORAGE_KEY, portfolio)


def _deduplicate(items: list[str]) -> list[str]:
    deduped: list[str] = []
    seen: set[str] = set()
    for item in items:
        norm = _normalize_ticker(item)
        if not norm or norm in seen:
            continue
        seen.add(norm)
        deduped.append(norm)
    return deduped


def init_portfolio_state() -> None:
    if st.session_state.get(_INIT_FLAG):
        return

    current = st.session_state.get(_PORTFOLIO_KEY)
    if isinstance(current, list):
        st.session_state[_PORTFOLIO_KEY] = _deduplicate(current)
    else:
        file_portfolio = _deduplicate(_load_file_portfolio())
        local_portfolio = get_local_json(PORTFOLIO_STORAGE_KEY)
        local_normalized = _deduplicate(local_portfolio) if isinstance(local_portfolio, list) else []

        if file_portfolio:
            st.session_state[_PORTFOLIO_KEY] = file_portfolio
            set_local_json(PORTFOLIO_STORAGE_KEY, file_portfolio)
        elif local_normalized:
            st.session_state[_PORTFOLIO_KEY] = local_normalized
        else:
            st.session_state[_PORTFOLIO_KEY] = []

    st.session_state[_INIT_FLAG] = True


def get_portfolio() -> list[str]:
    init_portfolio_state()
    return _deduplicate(st.session_state.get(_PORTFOLIO_KEY, []))


def add_asset(ticker: str) -> tuple[bool, str]:
    normalized = _normalize_ticker(ticker)
    if not normalized:
        return False, "Informe um ticker válido."

    is_valid, resolved_ticker, error_message = validate_and_resolve_ticker(normalized)
    if not is_valid:
        return False, error_message

    portfolio = get_portfolio()
    if normalized in portfolio:
        return False, f"{normalized} já está na carteira."

    for existing in portfolio:
        valid_existing, resolved_existing, _ = validate_and_resolve_ticker(existing)
        if valid_existing and resolved_existing == resolved_ticker:
            return False, f"{normalized} já está na carteira."

    portfolio.append(normalized)
    st.session_state[_PORTFOLIO_KEY] = portfolio
    _save_portfolio(portfolio)

    return True, f"{normalized} adicionado com sucesso."


def remove_assets(tickers: list[str]) -> int:
    if not tickers:
        return 0

    portfolio = get_portfolio()
    to_remove = {_normalize_ticker(t) for t in tickers}
    updated = [ticker for ticker in portfolio if ticker not in to_remove]
    removed_count = len(portfolio) - len(updated)

    if removed_count > 0:
        st.session_state[_PORTFOLIO_KEY] = updated
        _save_portfolio(updated)

    return removed_count
