from __future__ import annotations

import re

import pandas as pd
import streamlit as st
import yfinance as yf

REQUIRED_COLUMNS = ["Open", "High", "Low", "Close"]
TICKER_PATTERN = re.compile(r"^[A-Z0-9.\-^=]{1,15}$")
PERIOD_FALLBACKS = ["1y", "6mo", "3mo", "1mo", "5d"]
SYMBOL_ALIASES: dict[str, list[str]] = {
    "DOL": ["USDBRL=X", "BRL=X", "DOL=F"],
    "EUR": ["EURBRL=X", "EURUSD=X", "EUR=X"],
}


def _normalize_dataframe_columns(dataframe: pd.DataFrame) -> pd.DataFrame:
    normalized = dataframe.copy()
    if isinstance(normalized.columns, pd.MultiIndex):
        normalized.columns = normalized.columns.get_level_values(0)
    return normalized


@st.cache_data(ttl=3600, show_spinner=False)
def _download_ohlc_data(ticker: str, period: str = "3mo", interval: str = "1d") -> pd.DataFrame:
    try:
        dataframe = yf.download(
            ticker,
            period=period,
            interval=interval,
            progress=False,
            auto_adjust=False,
            threads=False,
            group_by="column",
        )
    except Exception:
        return pd.DataFrame()

    if dataframe is None or dataframe.empty:
        return pd.DataFrame()

    dataframe = _normalize_dataframe_columns(dataframe)
    if any(col not in dataframe.columns for col in REQUIRED_COLUMNS):
        return pd.DataFrame()

    ohlc = dataframe[REQUIRED_COLUMNS].dropna().copy()
    ohlc.index = pd.to_datetime(ohlc.index)
    return ohlc


def normalize_ticker(ticker: str) -> str:
    return ticker.strip().upper().replace(" ", "")


def _ticker_candidates(ticker: str) -> list[str]:
    normalized = normalize_ticker(ticker)
    if not normalized:
        return []

    candidates = [normalized]
    candidates.extend(SYMBOL_ALIASES.get(normalized, []))
    if "." not in normalized:
        candidates.append(f"{normalized}.SA")
    elif normalized.endswith(".SA"):
        base = normalized[:-3]
        if base:
            candidates.append(base)

    deduplicated: list[str] = []
    seen: set[str] = set()
    for candidate in candidates:
        if candidate in seen:
            continue
        seen.add(candidate)
        deduplicated.append(candidate)
    return deduplicated


def _period_candidates(requested_period: str) -> list[str]:
    if requested_period in PERIOD_FALLBACKS:
        start_index = PERIOD_FALLBACKS.index(requested_period)
        return PERIOD_FALLBACKS[start_index:]
    return [requested_period, "6mo", "3mo", "1mo", "5d"]


def _download_with_fallback(
    ticker: str,
    period: str,
    interval: str,
) -> tuple[str, pd.DataFrame]:
    candidates = _ticker_candidates(ticker)
    for period_option in _period_candidates(period):
        for candidate in candidates:
            data = _download_ohlc_data(candidate, period=period_option, interval=interval)
            if not data.empty:
                return candidate, data
    return "", pd.DataFrame()


@st.cache_data(ttl=3600, show_spinner=False)
def validate_and_resolve_ticker(ticker: str) -> tuple[bool, str, str]:
    normalized = normalize_ticker(ticker)
    if not normalized:
        return False, "", "Informe um ticker válido."

    if not TICKER_PATTERN.match(normalized):
        return (
            False,
            "",
            "Ticker inválido. Use apenas letras, números e separadores como '.' ou '-'.",
        )

    resolved_ticker, snapshot = _download_with_fallback(normalized, period="3mo", interval="1d")
    if not snapshot.empty and len(snapshot) >= 1:
        return True, resolved_ticker, ""

    return False, "", "Ticker não encontrado no Yahoo Finance. Verifique o código informado."


@st.cache_data(ttl=3600, show_spinner=False)
def get_ohlc_data(ticker: str, period: str = "3mo", interval: str = "1d") -> pd.DataFrame:
    valid, resolved_ticker, _ = validate_and_resolve_ticker(ticker)
    if not valid:
        return pd.DataFrame()
    _, data = _download_with_fallback(resolved_ticker, period=period, interval=interval)
    return data


def get_recent_ohlc(ticker: str, days: int = 7) -> pd.DataFrame:
    history = get_ohlc_data(ticker=ticker, period="6mo", interval="1d")
    if history.empty:
        return history
    return history.tail(days)
