import os
import time
import logging
from datetime import datetime
from dotenv import load_dotenv

# कस्टम मॉड्यूल्स का इम्पोर्ट
from dhanhq import dhanhq
from data_engine import AdvancedDataEngine, OptionsGreeks
from sentiment_engine import SentimentProcessor
from risk_manager import RiskManager
from telegram_notifier import TelegramNotifier

# 1. पर्यावरण वेरिएबल्स लोड करें (.env)
load_dotenv()

class Config:
    CLIENT_ID = os.getenv("DHAN_CLIENT_ID")
    ACCESS_TOKEN = os.getenv("DHAN_ACCESS_TOKEN")
    TG_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN")
    TG_CHAT_ID = os.getenv("TELEGRAM_CHAT_ID")
    SYMBOL_ID = "1333"  # उदाहरण: HDFCBANK (Dhan Security ID)
    POLLING_SEC = 900   # 15 मिनट अंतराल
    RISK_CAPITAL = float(os.getenv("RISK_CAPITAL", 100000))

# 2. लॉगिंग और सिस्टम इनिशियलाइजेशन
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    filename='trading_system.log'
)

# क्लास ऑब्जेक्ट्स बनाना
try:
    dhan = dhanhq(Config.CLIENT_ID, Config.ACCESS_TOKEN)
    notifier = TelegramNotifier(Config.TG_TOKEN, Config.TG_CHAT_ID)
    risk_mgmt = RiskManager(initial_capital=Config.RISK_CAPITAL)
    sentiment_proc = SentimentProcessor()
    logging.info("All systems initialized and connected to DhanHQ.")
except Exception as e:
    logging.error(f"Initialization Failed: {e}")
    exit()

def fetch_market_data(security_id):
    """Dhan से लाइव डेटा प्राप्त करना"""
    # नोट: धन की historical_daily_data API का उपयोग
    data = dhan.historical_daily_data(
        symbol=security_id,
        exchange_segment='NSE_EQ',
        instrument_type='EQUITY',
        expiry_code=0,
        from_date='2026-03-01', 
        to_date='2026-03-08'
    )
    import pandas as pd
    df = pd.DataFrame(data['data'])
    df.columns = ['Timestamp', 'Open', 'High', 'Low', 'Close', 'Volume']
    return df

def trading_job():
    """मुख्य ट्रेडिंग लूप"""
    try:
        logging.info("Scanning Market for Opportunities...")
        
        # A. डेटा और फीचर्स
        raw_df = fetch_market_data(Config.SYMBOL_ID)
        engine = AdvancedDataEngine(raw_df)
        df = engine.apply_features()
        last_tick = df.iloc[-1]

        # B. AI सेंटिमेंट एनालिसिस
        # (लाइव न्यूज़ फीड API यहाँ जोड़ी जा सकती है)
        news_headlines = ["RBI policy supports bank growth", "Nifty hits new high"]
        mood_score = sentiment_proc.analyze_market_mood(news_headlines)

        # C. ऑप्शंस ग्रीक्स (Delta Check)
        delta = OptionsGreeks.calculate_delta(
            S=last_tick['Close'], K=last_tick['Close'], T=0.08, r=0.07, sigma=0.2
        )

        # D. स्ट्रैटेजी लॉजिक (Threshold Tuning)
        buy_signal = (
            last_tick['SMA_20'] > last_tick['SMA_50'] and 
            last_tick['RSI'] > 55 and 
            last_tick['Vol_Spike'] == 1 and
            mood_score > 0.3
        )

        # E. रिस्क मैनेजमेंट और एग्जीक्यूशन
        if buy_signal:
            # Kelly Criterion आधारित क्वांटिटी
            k_fraction = risk_mgmt.get_kelly_size(win_rate=0.6, wl_ratio=1.5)
            qty = int((Config.RISK_CAPITAL * k_fraction) / last_tick['Close'])

            if qty > 0:
                # लाइव ऑर्डर प्लेसमेंट
                order = dhan.place_order(
                    security_id=Config.SYMBOL_ID,
                    exchange_segment='NSE_EQ',
                    transaction_type='BUY',
                    quantity=qty,
                    order_type='MARKET',
                    product_type='INTRA'
                )
                
                alert_msg = (f"🚀 *Trade Executed!*\nSymbol ID: {Config.SYMBOL_ID}\n"
                             f"Qty: {qty} | Price: {last_tick['Close']}\n"
                             f"Sentiment: {mood_score} | Delta: {delta:.2f}")
                notifier.send_alert(alert_msg)
                logging.info(f"Order Placed: {order}")

    except Exception as e:
        err_msg = f"⚠️ *System Alert:* {str(e)}"
        logging.error(err_msg)
        notifier.send_alert(err_msg)

if __name__ == "__main__":
    notifier.send_alert("🤖 *OmniAlgo Business Suite is Live!*")
    while True:
        # मार्केट आवर्स चेक (सिंपल वर्जन)
        now = datetime.now().time()
        if datetime.strptime("09:15", "%H:%M").time() <= now <= datetime.strptime("15:30", "%H:%M").time():
            trading_job()
        else:
            logging.info("Market is Closed. Sleeping...")
        
        time.sleep(Config.POLLING_SEC)