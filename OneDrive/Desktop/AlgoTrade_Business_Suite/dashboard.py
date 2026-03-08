import streamlit as st
import pandas as pd
import plotly.graph_objects as go
import plotly.express as px
from datetime import datetime
import os

# 1. पेज कॉन्फ़िगरेशन
st.set_page_config(
    page_title="OmniAlgo Pro | Control Room",
    page_icon="📈",
    layout="wide"
)

# कस्टम CSS (डार्क थीम और कार्ड स्टाइल के लिए)
st.markdown("""
    <style>
    .main { background-color: #0e1117; }
    .stMetric { background-color: #161b22; padding: 15px; border-radius: 10px; border: 1px solid #30363d; }
    </style>
    """, unsafe_allow_html=True)

# 2. डेटा लोडिंग (Mock/Log Data)
def load_trade_data():
    # असल में यहाँ आप अपनी ट्रेड डेटाबेस या CSV से डेटा पढ़ेंगे
    # अभी के लिए हम एक डेमो डेटाफ्रेम बना रहे हैं
    data = {
        'Date': pd.date_range(start='2026-03-01', periods=10, freq='D'),
        'Portfolio_Value': [100000, 102000, 101500, 104000, 103800, 106000, 108500, 107000, 110000, 112400],
        'Trade_Type': ['BUY', 'SELL', 'BUY', 'SELL', 'BUY', 'SELL', 'BUY', 'SELL', 'BUY', 'SELL'],
        'Profit_Loss': [0, 2000, -500, 2500, -200, 2200, 2500, -1500, 3000, 2400]
    }
    return pd.DataFrame(data)

def get_live_logs():
    if os.path.exists('trading_system.log'):
        with open('trading_system.log', 'r') as f:
            lines = f.readlines()
            return lines[-10:] # आखिरी 10 लॉग्स
    return ["No logs found. System offline?"]

# 3. साइडबार (Sidebar Filters)
st.sidebar.title("🛠️ Bot Settings")
st.sidebar.info("Status: 🟢 Live & Monitoring")
selected_symbol = st.sidebar.selectbox("Select Symbol", ["HDFCBANK", "RELIANCE", "NIFTY50"])
risk_appetite = st.sidebar.slider("Risk per Trade (%)", 0.5, 5.0, 2.0)

# 4. मुख्य डैशबोर्ड लेआउट
st.title("🛡️ OmniAlgo Business Dashboard")
st.markdown("---")

# Row 1: Key Metrics
df = load_trade_data()
current_val = df['Portfolio_Value'].iloc[-1]
total_pnl = df['Profit_Loss'].sum()
win_rate = (df['Profit_Loss'] > 0).sum() / len(df) * 100

col1, col2, col3, col4 = st.columns(4)
col1.metric("Equity Capital", f"₹{current_val:,}", f"{((current_val/100000)-1)*100:.1f}%")
col2.metric("Total P&L", f"₹{total_pnl:,}", "Current Month")
col3.metric("Win Rate", f"{win_rate:.0f}%", "Strategy Accuracy")
col4.metric("Active Signal", "BULLISH", "Sentiment: 0.68")

st.markdown("---")

# Row 2: Charts (Equity Curve & P&L Distribution)


col_left, col_right = st.columns([2, 1])

with col_left:
    st.subheader("📈 Cumulative Growth (Equity Curve)")
    fig_equity = px.area(df, x='Date', y='Portfolio_Value', 
                         line_shape='spline', color_discrete_sequence=['#00d4ff'])
    fig_equity.update_layout(template='plotly_dark', margin=dict(l=20, r=20, t=20, b=20))
    st.plotly_chart(fig_equity, use_container_width=True)

with col_right:
    st.subheader("🎯 Trade Analytics")
    fig_pie = px.pie(df, names='Trade_Type', values='Portfolio_Value', hole=0.4,
                     color_discrete_sequence=['#2ecc71', '#e74c3c'])
    fig_pie.update_layout(template='plotly_dark', showlegend=False)
    st.plotly_chart(fig_pie, use_container_width=True)

st.markdown("---")

# Row 3: Live Logs & Risk Table
col_logs, col_table = st.columns([1, 1])

with col_logs:
    st.subheader("📜 Live Execution Logs")
    logs = get_live_logs()
    st.code("".join(logs), language='bash')

with col_table:
    st.subheader("⚖️ Risk Metrics (Greeks & Kelly)")
    risk_data = {
        "Metric": ["Kelly Fraction", "Current Delta", "Theta Decay", "Portfolio Gamma"],
        "Value": ["0.12", "0.55", "-0.02", "0.004"],
        "Status": ["Safe", "Bullish", "Low", "Neutral"]
    }
    st.table(pd.DataFrame(risk_data))

# ऑटो-रिफ्रेश बटन
if st.button('🔄 Manual Refresh Data'):
    st.rerun()