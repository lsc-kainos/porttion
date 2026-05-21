from __future__ import annotations

import json
from typing import Any

import pandas as pd
from openai import OpenAI

from services.config import get_config

ASSET_ANALYSIS_PROMPT = """
Você é um analista técnico experiente.

Analise os últimos 7 dias de preços OHLC.
Identifique:
- Tendência (alta, baixa ou lateral)
- Possíveis padrões simples de candlestick

Responda em JSON no formato:
{
  "tendencia": "...",
  "recomendacao": "Comprar" ou "Não comprar",
  "justificativa": "..."
}
""".strip()

PORTFOLIO_REPORT_PROMPT = """
Você é um analista de mercado focado em clareza, rigor e rastreabilidade.

Receberá um JSON com:
- `meta`: contexto da geração e estatísticas agregadas
- `ativos`: lista com análise por ativo, incluindo tendência, recomendação, justificativa e métricas de preço

Gere um relatório em Markdown, em português, com as seções abaixo:
1) Título e carimbo de data/hora da geração.
2) Resumo executivo (4-6 bullets, objetivo e acionável).
3) Visão consolidada da carteira:
   - distribuição de tendências
   - taxa de compra vs não compra
   - leitura geral de risco
4) Tabela markdown completa por ativo:
   Colunas: Ativo, Tendência, Recomendação, Variação 7d (%), Fechamento atual, Justificativa.
5) Diagnóstico detalhado por ativo:
   - mini subseção `### <ATIVO>`
   - tendência observada
   - principais sinais identificados
   - risco de curto prazo (baixo/médio/alto) com justificativa
   - ação sugerida para horizonte de 1-2 semanas
6) Plano de acompanhamento:
   - 3 a 5 gatilhos objetivos que mudariam a decisão (ex.: perda de suporte, reversão de candle, etc.)
7) Conclusão final com priorização dos ativos mais promissores e dos mais arriscados.

Regras:
- Seja específico; evite frases genéricas.
- Não invente dados fora do JSON recebido.
- Responda apenas com Markdown.
""".strip()


def _format_ohlc_for_prompt(ohlc_data: pd.DataFrame) -> str:
    rows: list[str] = []
    for date, row in ohlc_data.tail(7).iterrows():
        rows.append(
            f"{date.date().isoformat()} | "
            f"Open={float(row['Open']):.2f}, "
            f"High={float(row['High']):.2f}, "
            f"Low={float(row['Low']):.2f}, "
            f"Close={float(row['Close']):.2f}"
        )
    return "\n".join(rows)


def _extract_json(content: str) -> dict[str, Any]:
    try:
        parsed = json.loads(content)
        return parsed if isinstance(parsed, dict) else {}
    except json.JSONDecodeError:
        start = content.find("{")
        end = content.rfind("}")
        if start == -1 or end == -1 or end <= start:
            return {}
        try:
            parsed = json.loads(content[start : end + 1])
            return parsed if isinstance(parsed, dict) else {}
        except json.JSONDecodeError:
            return {}


def _normalize_response(ticker: str, payload: dict[str, Any], error: str = "") -> dict[str, str]:
    trend = str(payload.get("tendencia", "indefinida")).strip() or "indefinida"
    recommendation_raw = str(payload.get("recomendacao", "Não comprar")).strip().lower()
    justification = str(payload.get("justificativa", "")).strip() or error or "Sem justificativa."

    recommendation = "Comprar" if recommendation_raw.startswith("compr") else "Não comprar"

    return {
        "ativo": ticker,
        "tendencia": trend,
        "recomendacao": recommendation,
        "justificativa": justification,
    }


def analyze_asset(ticker: str, ohlc_data: pd.DataFrame) -> dict[str, str]:
    if ohlc_data.empty or len(ohlc_data) < 7:
        return _normalize_response(
            ticker=ticker,
            payload={},
            error="Dados insuficientes para análise (mínimo: 7 candles diários).",
        )

    config = get_config()
    api_key = config.get("api_key", "")
    model = config.get("model", "gpt-4o-mini")

    if not api_key:
        return _normalize_response(
            ticker=ticker,
            payload={},
            error="API key não configurada. Acesse a página Configurações.",
        )

    prompt = (
        f"Ativo: {ticker}\n"
        f"Dados OHLC (7 dias):\n{_format_ohlc_for_prompt(ohlc_data)}\n\n"
        "Responda apenas com um JSON válido."
    )

    try:
        client = OpenAI(api_key=api_key)
        response = client.chat.completions.create(
            model=model,
            temperature=0.1,
            response_format={"type": "json_object"},
            messages=[
                {"role": "system", "content": ASSET_ANALYSIS_PROMPT},
                {"role": "user", "content": prompt},
            ],
        )
        content = response.choices[0].message.content or "{}"
        parsed = _extract_json(content)
        return _normalize_response(ticker=ticker, payload=parsed)
    except Exception as exc:
        return _normalize_response(
            ticker=ticker,
            payload={},
            error=f"Falha na chamada da IA: {exc}",
        )


def _fallback_markdown_report(results: list[dict[str, str]]) -> str:
    total = len(results)
    buy_count = sum(
        1
        for row in results
        if str(row.get("recomendacao", "")).strip().lower().startswith("compr")
    )
    no_buy_count = total - buy_count
    buy_percentage = (buy_count / total * 100) if total else 0.0
    no_buy_percentage = (no_buy_count / total * 100) if total else 0.0

    lines = [
        "# Relatório Consolidado da Carteira",
        "",
        "## Resumo executivo",
        f"- Total de ativos avaliados: **{total}**",
        f"- Sinal de compra: **{buy_count}** ativo(s) (**{buy_percentage:.1f}%**)",
        f"- Sinal de não compra: **{no_buy_count}** ativo(s) (**{no_buy_percentage:.1f}%**)",
        "- Leitura geral: relatório de contingência gerado sem detalhamento expandido por IA.",
        "",
        "## Visão consolidada",
        "- Priorize os ativos com recomendação de compra e tendência de alta.",
        "- Reavalie os ativos com tendência lateral/baixa antes de novas entradas.",
        "",
        "## Tabela por ativo",
        "| Ativo | Tendência | Recomendação | Variação 7d (%) | Fechamento atual | Justificativa |",
        "|---|---|---|---:|---:|---|",
    ]

    for row in results:
        lines.append(
            "| {ativo} | {tendencia} | {recomendacao} | {variacao_7d_pct} | {fechamento_atual} | {justificativa} |".format(
                ativo=str(row.get("ativo", "-")).replace("|", "/"),
                tendencia=str(row.get("tendencia", "-")).replace("|", "/"),
                recomendacao=str(row.get("recomendacao", "-")).replace("|", "/"),
                variacao_7d_pct=str(row.get("variacao_7d_pct", "-")).replace("|", "/"),
                fechamento_atual=str(row.get("fechamento_atual", "-")).replace("|", "/"),
                justificativa=str(row.get("justificativa", "-")).replace("|", "/"),
            )
        )

    lines.extend(
        [
            "",
            "## Diagnóstico por ativo",
        ]
    )
    for row in results:
        lines.extend(
            [
                f"### {str(row.get('ativo', '-'))}",
                f"- Tendência: {str(row.get('tendencia', '-'))}",
                f"- Recomendação: {str(row.get('recomendacao', '-'))}",
                f"- Justificativa: {str(row.get('justificativa', '-'))}",
                "- Risco de curto prazo: não classificado no modo de contingência.",
                "",
            ]
        )

    lines.extend(
        [
            "## Plano de acompanhamento",
            "- Revisar novos candles diariamente.",
            "- Reavaliar ativos com mudança de direção no fechamento.",
            "- Atualizar relatório após eventos relevantes de mercado.",
            "",
            "## Conclusão",
            "Relatório gerado em modo de contingência local por falha na geração textual da IA.",
        ]
    )
    return "\n".join(lines)


def generate_portfolio_report_markdown(
    results: list[dict[str, str]],
    meta: dict[str, Any] | None = None,
) -> str:
    if not results:
        return "# Relatório Consolidado da Carteira\n\nNenhum ativo analisado."

    config = get_config()
    api_key = config.get("api_key", "")
    model = config.get("model", "gpt-4o-mini")

    if not api_key:
        return _fallback_markdown_report(results)

    try:
        payload = json.dumps(
            {"meta": meta or {}, "ativos": results},
            ensure_ascii=False,
            indent=2,
        )
        client = OpenAI(api_key=api_key)
        response = client.chat.completions.create(
            model=model,
            temperature=0.2,
            messages=[
                {"role": "system", "content": PORTFOLIO_REPORT_PROMPT},
                {
                    "role": "user",
                    "content": (
                        "Crie o relatório consolidado detalhado a partir do JSON abaixo.\n\n"
                        f"{payload}"
                    ),
                },
            ],
        )
        content = (response.choices[0].message.content or "").strip()
        return content or _fallback_markdown_report(results)
    except Exception:
        return _fallback_markdown_report(results)
