import numpy as np
import logging

class RiskManager:
    def __init__(self, initial_capital=100000, max_risk_per_trade=0.02):
        """
        initial_capital: कुल निवेश राशि
        max_risk_per_trade: प्रति ट्रेड अधिकतम जोखिम (जैसे 2%)
        """
        self.capital = initial_capital
        self.max_risk = max_risk_per_trade
        self.active_trades = {}

    def get_kelly_size(self, win_rate, win_loss_ratio):
        """
        Kelly Criterion: f* = (bp - q) / b
        p: Win Rate (0 to 1)
        b: Win/Loss Ratio (Profit per trade / Loss per trade)
        """
        p = win_rate
        q = 1 - p
        b = win_loss_ratio
        
        if b == 0: return 0
        
        kelly_f = (b * p - q) / b
        
        # 'Fractional Kelly' का उपयोग करना सुरक्षित है (जैसे Kelly का 50%)
        safe_kelly = kelly_f * 0.5 
        
        # सुनिश्चित करें कि रिस्क 0 से कम न हो और 20% से ज्यादा न हो (Capital Protection)
        return max(0, min(safe_kelly, 0.20))

    def calculate_sl_tp(self, entry_price, volatility, side='BUY'):
        """
        ATR या Volatility आधारित Stop Loss और Take Profit
        """
        sl_buffer = volatility * 1.5  # Volatility का 1.5 गुना
        tp_buffer = volatility * 3.0  # 1:2 Risk-Reward Ratio
        
        if side == 'BUY':
            sl = entry_price - sl_buffer
            tp = entry_price + tp_buffer
        else:
            sl = entry_price + sl_buffer
            tp = entry_price - tp_buffer
            
        return round(sl, 2), round(tp, 2)

    def update_trailing_sl(self, trade_id, current_price, tsl_pct=0.005):
        """
        Trailing Stop Loss: अगर कीमत बढ़ती है, तो SL को भी ऊपर ले जाएं
        tsl_pct: 0.5% ट्रेलिंग जंप
        """
        if trade_id in self.active_trades:
            trade = self.active_trades[trade_id]
            
            if current_price > trade['highest_price']:
                trade['highest_price'] = current_price
                new_sl = current_price * (1 - tsl_pct)
                
                # SL केवल ऊपर की ओर बढ़ना चाहिए
                if new_sl > trade['current_sl']:
                    trade['current_sl'] = round(new_sl, 2)
                    logging.info(f"TSL Updated for {trade_id}: {trade['current_sl']}")
            
            return trade['current_sl']
        return None

    def check_auto_square_off(self, current_time):
        """
        इंट्राडे के लिए ऑटो स्क्वायर-ऑफ़ चेक (जैसे 3:15 PM)
        """
        square_off_time = "15:15"
        now = current_time.strftime("%H:%M")
        return now >= square_off_time

# --- प्रयोग का उदाहरण ---
# rm = RiskManager(initial_capital=500000)
# position_percent = rm.get_kelly_size(win_rate=0.6, win_loss_ratio=1.5)
# print(f"Suggested Capital Allocation: {position_percent * 100}%")