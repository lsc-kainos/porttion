from __future__ import annotations

import pandas as pd
import plotly.graph_objects as go


def build_candlestick_chart(dataframe: pd.DataFrame, title: str) -> go.Figure:
    figure = go.Figure(
        data=[
            go.Candlestick(
                x=dataframe.index,
                open=dataframe["Open"],
                high=dataframe["High"],
                low=dataframe["Low"],
                close=dataframe["Close"],
                increasing_line_color="#16a34a",
                decreasing_line_color="#dc2626",
            )
        ]
    )

    figure.update_layout(
        title=title,
        xaxis_title="Data",
        yaxis_title="Preço",
        template="plotly_white",
        margin=dict(l=20, r=20, t=60, b=20),
        xaxis_rangeslider_visible=False,
    )
    return figure

