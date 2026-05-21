from __future__ import annotations

import json
import re
from typing import Any

import streamlit as st

try:
    from streamlit_js_eval import streamlit_js_eval
except Exception:  # pragma: no cover - optional runtime dependency
    streamlit_js_eval = None


def is_available() -> bool:
    return streamlit_js_eval is not None


def _safe_key(raw_key: str) -> str:
    return re.sub(r"[^a-zA-Z0-9_]+", "_", raw_key)


def _next_eval_key(prefix: str) -> str:
    return f"local_storage_{_safe_key(prefix)}"


def _evaluate(js_expression: str, key_prefix: str, want_output: bool = True) -> Any:
    if not is_available():
        return None
    key = _next_eval_key(key_prefix)
    try:
        return streamlit_js_eval(
            js_expressions=js_expression,
            key=key,
            want_output=want_output,
        )
    except TypeError:
        return streamlit_js_eval(
            js_expressions=js_expression,
            key=key,
        )


def get_local_json(storage_key: str) -> Any | None:
    expression = (
        "(function(){"
        f"try {{ const raw = window.localStorage.getItem({json.dumps(storage_key)});"
        " return raw ? raw : ''; }"
        "catch (e) { return ''; }"
        "})()"
    )
    raw_value = _evaluate(expression, key_prefix=f"local_get_{storage_key}", want_output=True)
    if not isinstance(raw_value, str) or not raw_value:
        return None
    try:
        return json.loads(raw_value)
    except json.JSONDecodeError:
        return None


def set_local_json(storage_key: str, value: Any) -> None:
    serialized_value = json.dumps(value, ensure_ascii=False)
    expression = (
        "(function(){"
        f"try {{ window.localStorage.setItem({json.dumps(storage_key)}, {json.dumps(serialized_value)});"
        " return true; }"
        "catch (e) { return false; }"
        "})()"
    )
    _evaluate(expression, key_prefix=f"local_set_{storage_key}", want_output=False)


def remove_local_key(storage_key: str) -> None:
    expression = (
        "(function(){"
        f"try {{ window.localStorage.removeItem({json.dumps(storage_key)}); return true; }}"
        "catch (e) { return false; }"
        "})()"
    )
    _evaluate(expression, key_prefix=f"local_remove_{storage_key}", want_output=False)
