import os

# प्रोजेक्ट का नाम
project_name = "AlgoTrade_Business_Suite"

# फाइलों का कंटेंट
files = {
    "requirements.txt": """pandas\npandas_ta\nyfinance\nrequests\nscipy\nstreamlit\nplotly\ntorch\nnltk\napscheduler""",
    
    "data_engine.py": """import pandas as pd\nimport pandas_ta as ta\nimport numpy as np\nfrom scipy.stats import norm\n\nclass AdvancedDataEngine:\n    def __init__(self, df):\n        self.df = df\n    def apply_features(self):\n        self.df['SMA_20'] = ta.sma(self.df['Close'], length=20)\n        self.df['SMA_50'] = ta.sma(self.df['Close'], length=50)\n        self.df['RSI'] = ta.rsi(self.df['Close'], length=14)\n        self.df['Vol_Spike'] = (self.df['Volume'] > self.df['Volume'].rolling(20).mean() * 2).astype(int)\n        return self.df.dropna()""",
    
    "risk_manager.py": """class RiskManager:\n    @staticmethod\n    def get_kelly_size(win_rate, wl_ratio):\n        f = (wl_ratio * win_rate - (1 - win_rate)) / wl_ratio\n        return max(0, min(f, 0.2))\n    @staticmethod\n    def trailing_sl(price, high, pct=0.01):\n        return high * (1 - pct)""",
    
    "main_bot.py": """import time\nfrom data_engine import AdvancedDataEngine\nimport logging\n\nlogging.basicConfig(filename='trade.log', level=logging.INFO)\ndef run():\n    print('🚀 Algo Bot is running...')\n    while True:\n        try:\n            # Integration logic here\n            time.sleep(900)\n        except Exception as e:\n            logging.error(e)\n            time.sleep(30)\nif __name__ == '__main__':\n    run()""",

    "Dockerfile": """FROM python:3.9-slim\nWORKDIR /app\nCOPY requirements.txt .\nRUN pip install -r requirements.txt\nCOPY . .\nCMD ["python", "main_bot.py"]"""
}

# फोल्डर और फाइलें बनाना
if not os.path.exists(project_name):
    os.makedirs(project_name)

for filename, content in files.items():
    with open("filename.txt", "w", encoding="utf-8") as f:
    	f.write(content)

print(f"✅ प्रोजेक्ट '{project_name}' सफलतापूर्वक तैयार हो गया है!")