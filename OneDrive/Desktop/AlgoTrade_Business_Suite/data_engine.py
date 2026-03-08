import pandas as pd
import pandas_ta as ta
import numpy as np
from scipy.stats import norm

class AdvancedDataEngine:
    def __init__(self, df):
        self.df = df
    def apply_features(self):
        self.df['SMA_20'] = ta.sma(self.df['Close'], length=20)
        self.df['SMA_50'] = ta.sma(self.df['Close'], length=50)
        self.df['RSI'] = ta.rsi(self.df['Close'], length=14)
        self.df['Vol_Spike'] = (self.df['Volume'] > self.df['Volume'].rolling(20).mean() * 2).astype(int)
        return self.df.dropna()