"""
Sprint 3: Progress visualization dashboard + phoneme-level heatmap.

Run with: streamlit run dashboard.py
"""
import pandas as pd
import plotly.graph_objects as go
import plotly.express as px
import streamlit as st

from knowledge_graph import (
    driver,
    list_users_with_sessions,
    get_all_sessions,
    get_phoneme_scores_by_session,
)

# --- Palette (validated light-mode set; see dataviz skill palette.md) -------
SURFACE = "#fcfcfb"
GRID = "#e1e0d9"
AXIS = "#c3c2b7"
TEXT_PRIMARY = "#0b0b0b"
TEXT_MUTED = "#898781"
BLUE = "#2a78d6"     # slot 1 - accuracy
ORANGE = "#eb6834"   # slot 2 - speech rate
AQUA = "#1baf7a"     # slot 3 - filler words (below 3:1 contrast -> always paired with a direct label)
SEQUENTIAL_BLUE = [[0, "#cde2fb"], [0.5, "#3987e5"], [1, "#0d366b"]]

FONT_FAMILY = "system-ui, -apple-system, 'Segoe UI', sans-serif"

st.set_page_config(page_title="SpeakEasy Progress Dashboard", layout="wide")


def clean_layout(fig, y_title, y_range=None):
    """Shared chrome: light surface, hairline recessive grid, no legend clutter."""
    fig.update_layout(
        plot_bgcolor=SURFACE,
        paper_bgcolor=SURFACE,
        font=dict(family=FONT_FAMILY, color=TEXT_PRIMARY, size=13),
        margin=dict(l=10, r=10, t=10, b=10),
        showlegend=False,
        hoverlabel=dict(bgcolor=SURFACE, font=dict(family=FONT_FAMILY, color=TEXT_PRIMARY)),
    )
    fig.update_xaxes(
        title="Session #", showgrid=False, showline=True, linecolor=AXIS,
        tickfont=dict(color=TEXT_MUTED),
    )
    fig.update_yaxes(
        title=y_title, gridcolor=GRID, griddash="solid", zeroline=False,
        showline=False, tickfont=dict(color=TEXT_MUTED), range=y_range,
    )
    return fig


def line_chart(df, y_col, color, y_title, decimals, y_range=None):
    """decimals: 2 for a 0-1 score, 0 for a whole-number count/rate."""
    fig = go.Figure()
    fig.add_trace(go.Scatter(
        x=df["session_number"], y=df[y_col],
        mode="lines+markers",
        line=dict(width=2, color=color),
        marker=dict(size=9, color=color, line=dict(width=2, color=SURFACE)),
        hovertemplate=f"<b>%{{y:.{decimals}f}}</b><extra></extra>",
    ))
    # Direct end-label - required "relief" for aqua's sub-3:1 contrast, and
    # good practice generally (label the endpoint, not every point).
    last_x, last_y = df["session_number"].iloc[-1], df[y_col].iloc[-1]
    fig.add_annotation(
        x=last_x, y=last_y, text=f"<b>{last_y:.{decimals}f}</b>",
        showarrow=False, xanchor="left", xshift=10, font=dict(color=color, size=13),
    )
    return clean_layout(fig, y_title, y_range)


st.title("SpeakEasy Progress Dashboard")

users = list_users_with_sessions(driver)
if not users:
    st.info("No users with session data yet. Log a session first (see session_recorder.py).")
    st.stop()

user_id = st.selectbox("User", users)

sessions = get_all_sessions(driver, user_id)
phoneme_rows = get_phoneme_scores_by_session(driver, user_id)

if not sessions:
    st.info(f"No sessions found for {user_id}.")
    st.stop()

df = pd.DataFrame(sessions)
df["date"] = pd.to_datetime(df["timestamp"], unit="ms")
df["session_number"] = range(1, len(df) + 1)

col1, col2, col3 = st.columns(3)
col1.metric("Total sessions", len(df))
col2.metric("Latest accuracy", f"{df['overall_score'].iloc[-1]:.2f}")
if df["speech_rate_wpm"].notna().any():
    col3.metric("Latest speech rate", f"{df['speech_rate_wpm'].iloc[-1]:.0f} wpm")

st.subheader("Pronunciation accuracy")
fig_accuracy = line_chart(df, "overall_score", BLUE, "Overall score (0-1)", decimals=2, y_range=[0, 1])
st.plotly_chart(fig_accuracy, use_container_width=True, config={"displayModeBar": False})

st.subheader("Fluency")
fluency_col1, fluency_col2 = st.columns(2)
if df["speech_rate_wpm"].notna().any():
    with fluency_col1:
        st.caption("Speech rate (wpm)")
        fig_rate = line_chart(df, "speech_rate_wpm", ORANGE, "Words per minute", decimals=0)
        st.plotly_chart(fig_rate, use_container_width=True, config={"displayModeBar": False})
if df["filler_total"].notna().any():
    with fluency_col2:
        st.caption("Filler words per session")
        fig_filler = line_chart(df, "filler_total", AQUA, "Filler word count", decimals=0)
        st.plotly_chart(fig_filler, use_container_width=True, config={"displayModeBar": False})
if df["speech_rate_wpm"].isna().all() and df["filler_total"].isna().all():
    st.caption("No speech-rate/filler data logged for these sessions yet.")

st.subheader("Session consistency")
df["gap_days"] = df["date"].diff().dt.total_seconds() / 86400
if len(df) > 1:
    fig_consistency = go.Figure()
    fig_consistency.add_trace(go.Bar(
        x=df["session_number"].iloc[1:], y=df["gap_days"].iloc[1:],
        marker=dict(color=BLUE),
        width=0.5,
        hovertemplate="<b>%{y:.1f} days</b><extra></extra>",
    ))
    st.plotly_chart(
        clean_layout(fig_consistency, "Days since previous session"),
        use_container_width=True, config={"displayModeBar": False},
    )
    st.caption(
        f"First session: {df['date'].iloc[0].strftime('%Y-%m-%d')}  ·  "
        f"Latest session: {df['date'].iloc[-1].strftime('%Y-%m-%d')}  ·  "
        f"Average gap: {df['gap_days'].mean():.1f} days"
    )
else:
    st.caption("Only one session logged so far - consistency needs at least two.")

st.subheader("Phoneme-level heatmap")
if phoneme_rows:
    pdf = pd.DataFrame(phoneme_rows)
    session_order = {sid: i + 1 for i, sid in enumerate(df["session_id"])}
    pdf["session_number"] = pdf["session_id"].map(session_order)
    pivot = pdf.pivot_table(
        index="phoneme_symbol", columns="session_number", values="score_value", aggfunc="mean"
    ).sort_index()

    fig_heatmap = px.imshow(
        pivot,
        labels=dict(x="Session #", y="Phoneme", color="Score"),
        color_continuous_scale=SEQUENTIAL_BLUE,
        zmin=0, zmax=1,
        aspect="auto",
    )
    fig_heatmap.update_traces(hovertemplate="<b>%{z:.2f}</b><extra>%{y}, session %{x}</extra>")
    fig_heatmap.update_layout(
        plot_bgcolor=SURFACE, paper_bgcolor=SURFACE,
        font=dict(family=FONT_FAMILY, color=TEXT_PRIMARY, size=13),
        margin=dict(l=10, r=10, t=10, b=10),
        coloraxis_colorbar=dict(title="Score", tickfont=dict(color=TEXT_MUTED)),
    )
    fig_heatmap.update_xaxes(showline=True, linecolor=AXIS, tickfont=dict(color=TEXT_MUTED))
    fig_heatmap.update_yaxes(showline=True, linecolor=AXIS, tickfont=dict(color=TEXT_MUTED))

    # Cell text color follows the fill's luminance (white on dark cells, ink
    # on light ones) rather than one flat color across the whole ramp.
    for row_i, phoneme in enumerate(pivot.index):
        for col_i, session_num in enumerate(pivot.columns):
            value = pivot.iloc[row_i, col_i]
            if pd.isna(value):
                continue
            fig_heatmap.add_annotation(
                x=session_num, y=phoneme, text=f"{value:.2f}",
                showarrow=False,
                font=dict(color="#ffffff" if value >= 0.55 else TEXT_PRIMARY, family=FONT_FAMILY, size=13),
            )

    st.plotly_chart(fig_heatmap, use_container_width=True, config={"displayModeBar": False})
    st.caption("Darker = stronger. Blank cells mean that phoneme wasn't scored in that session.")
else:
    st.caption("No phoneme-level scores logged for these sessions yet.")

with st.expander("View raw session data"):
    st.dataframe(df[["session_id", "date", "overall_score", "speech_rate_wpm", "filler_total"]], hide_index=True)
    if phoneme_rows:
        st.dataframe(pd.DataFrame(phoneme_rows)[["session_id", "phoneme_symbol", "score_value"]], hide_index=True)
