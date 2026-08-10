"""
Sprint 3: Progress visualization dashboard + phoneme-level heatmap.

Charts now plot per-ATTEMPT (one question response), not per-session -
score, speech rate, filler count, and embeddings all moved down to that
granularity. "Session consistency" is the one exception: practice cadence
over calendar time is still meaningfully a session-level concept, so that
chart still reads from get_all_sessions()/session timestamps.

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
    get_attempts_for_user,
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

FONT_FAMILY = "system-ui, -apple-system, 'Segoe UI', sans-serif"

st.set_page_config(page_title="SpeakEasy Progress Dashboard", layout="wide")


def clean_layout(fig, x_title, y_title, y_range=None):
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
        title=x_title, showgrid=False, showline=True, linecolor=AXIS,
        tickfont=dict(color=TEXT_MUTED),
    )
    fig.update_yaxes(
        title=y_title, gridcolor=GRID, griddash="solid", zeroline=False,
        showline=False, tickfont=dict(color=TEXT_MUTED), range=y_range,
    )
    return fig


def line_chart(df, x_col, x_title, y_col, color, y_title, decimals, y_range=None):
    """decimals: 2 for a 0-1 score, 0 for a whole-number count/rate."""
    fig = go.Figure()
    fig.add_trace(go.Scatter(
        x=df[x_col], y=df[y_col],
        mode="lines+markers",
        line=dict(width=2, color=color),
        marker=dict(size=9, color=color, line=dict(width=2, color=SURFACE)),
        hovertemplate=f"<b>%{{y:.{decimals}f}}</b><extra></extra>",
    ))
    # Direct end-label - required "relief" for aqua's sub-3:1 contrast, and
    # good practice generally (label the endpoint, not every point).
    last_x, last_y = df[x_col].iloc[-1], df[y_col].iloc[-1]
    fig.add_annotation(
        x=last_x, y=last_y, text=f"<b>{last_y:.{decimals}f}</b>",
        showarrow=False, xanchor="left", xshift=10, font=dict(color=color, size=13),
    )
    return clean_layout(fig, x_title, y_title, y_range)


st.title("SpeakEasy Progress Dashboard")

users = list_users_with_sessions(driver)
if not users:
    st.info("No users with session data yet. Log a session first (see session_recorder.py).")
    st.stop()

user_id = st.selectbox("User", users)

sessions = get_all_sessions(driver, user_id)
attempts = get_attempts_for_user(driver, user_id)

if not sessions:
    st.info(f"No sessions found for {user_id}.")
    st.stop()

sdf = pd.DataFrame(sessions)
sdf["date"] = pd.to_datetime(sdf["timestamp"], unit="ms")
sdf["session_number"] = range(1, len(sdf) + 1)

if not attempts:
    st.info(f"{user_id} has {len(sdf)} session(s) logged but no individual question attempts yet.")
    st.stop()

df = pd.DataFrame(attempts)
df["date"] = pd.to_datetime(df["timestamp"], unit="ms")
df["attempt_number"] = range(1, len(df) + 1)

col1, col2, col3, col4 = st.columns(4)
col1.metric("Total sessions", len(sdf))
col2.metric("Total questions answered", len(df))
col3.metric("Latest score", f"{df['score'].iloc[-1]:.2f}")
if df["speech_rate_wpm"].notna().any():
    col4.metric("Latest speech rate", f"{df['speech_rate_wpm'].iloc[-1]:.0f} wpm")

st.subheader("Pronunciation accuracy")
st.caption("One point per question answered, across all sessions.")
fig_accuracy = line_chart(df, "attempt_number", "Question #", "score", BLUE, "Score (0-1)", decimals=2, y_range=[0, 1])
st.plotly_chart(fig_accuracy, use_container_width=True, config={"displayModeBar": False})

st.subheader("Fluency")
fluency_col1, fluency_col2 = st.columns(2)
if df["speech_rate_wpm"].notna().any():
    with fluency_col1:
        st.caption("Speech rate (wpm) per question")
        fig_rate = line_chart(df, "attempt_number", "Question #", "speech_rate_wpm", ORANGE, "Words per minute", decimals=0)
        st.plotly_chart(fig_rate, use_container_width=True, config={"displayModeBar": False})
if df["filler_total"].notna().any():
    with fluency_col2:
        st.caption("Filler words per question")
        fig_filler = line_chart(df, "attempt_number", "Question #", "filler_total", AQUA, "Filler word count", decimals=0)
        st.plotly_chart(fig_filler, use_container_width=True, config={"displayModeBar": False})
if df["speech_rate_wpm"].isna().all() and df["filler_total"].isna().all():
    st.caption("No speech-rate/filler data logged for these questions yet.")

st.subheader("Session consistency")
st.caption("Practice cadence over calendar time - this one stays session-level, not per-question.")
sdf["gap_days"] = sdf["date"].diff().dt.total_seconds() / 86400
if len(sdf) > 1:
    fig_consistency = go.Figure()
    fig_consistency.add_trace(go.Bar(
        x=sdf["session_number"].iloc[1:], y=sdf["gap_days"].iloc[1:],
        marker=dict(color=BLUE),
        width=0.5,
        hovertemplate="<b>%{y:.1f} days</b><extra></extra>",
    ))
    st.plotly_chart(
        clean_layout(fig_consistency, "Session #", "Days since previous session"),
        use_container_width=True, config={"displayModeBar": False},
    )
    st.caption(
        f"First session: {sdf['date'].iloc[0].strftime('%Y-%m-%d')}  ·  "
        f"Latest session: {sdf['date'].iloc[-1].strftime('%Y-%m-%d')}  ·  "
        f"Average gap: {sdf['gap_days'].mean():.1f} days"
    )
else:
    st.caption("Only one session logged so far - consistency needs at least two.")

st.subheader("Phoneme-level heatmap")
st.caption(
    "Each cell marks whether that phoneme was flagged weak in that question's response. "
    "This is a presence/absence flag now, not a continuous score - phoneme-level scoring "
    "moved to per-attempt weak/not-weak flags instead of an averaged float per session."
)
phoneme_rows = [
    {"attempt_number": row.attempt_number, "phoneme_symbol": symbol}
    for row in df.itertuples()
    for symbol in (row.weak_phonemes or [])
]
if phoneme_rows:
    pdf = pd.DataFrame(phoneme_rows)
    pdf["flagged"] = 1
    pivot = pdf.pivot_table(
        index="phoneme_symbol", columns="attempt_number", values="flagged", aggfunc="max"
    ).sort_index()

    fig_heatmap = px.imshow(
        pivot,
        labels=dict(x="Question #", y="Phoneme", color="Flagged weak"),
        color_continuous_scale=[[0, SURFACE], [1, BLUE]],
        zmin=0, zmax=1,
        aspect="auto",
    )
    fig_heatmap.update_traces(hovertemplate="<b>Flagged weak</b><extra>%{y}, question %{x}</extra>")
    fig_heatmap.update_layout(
        plot_bgcolor=SURFACE, paper_bgcolor=SURFACE,
        font=dict(family=FONT_FAMILY, color=TEXT_PRIMARY, size=13),
        margin=dict(l=10, r=10, t=10, b=10),
        coloraxis_showscale=False,
    )
    fig_heatmap.update_xaxes(showline=True, linecolor=AXIS, tickfont=dict(color=TEXT_MUTED))
    fig_heatmap.update_yaxes(showline=True, linecolor=AXIS, tickfont=dict(color=TEXT_MUTED))
    st.plotly_chart(fig_heatmap, use_container_width=True, config={"displayModeBar": False})
    st.caption("Blue = flagged weak in that question. Blank = not flagged (not necessarily strong - it may not have targeted that phoneme at all).")
else:
    st.caption("No phonemes flagged weak in any question yet.")

with st.expander("View raw attempt data"):
    st.dataframe(
        df[["attempt_id", "session_id", "exercise_id", "subcategory", "date", "score", "speech_rate_wpm", "filler_total", "weak_phonemes"]],
        hide_index=True,
    )
