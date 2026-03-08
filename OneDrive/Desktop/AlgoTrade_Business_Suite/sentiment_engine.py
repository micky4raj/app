import torch
import torch.nn as nn
from nltk.sentiment.vader import SentimentIntensityAnalyzer
import nltk

# जरूरी NLTK डेटा डाउनलोड करना
try:
    nltk.data.find('vader_lexicon')
except LookupError:
    nltk.download('vader_lexicon')

class SentimentEngine:
    def __init__(self):
        self.vader = SentimentIntensityAnalyzer()
        self.device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        
    def get_vader_score(self, text):
        """
        VADER Score: -1 (Extremely Bearish) to +1 (Extremely Bullish)
        """
        score = self.vader.polarity_scores(text)
        return score['compound']

class LSTMSentimentModel(nn.Module):
    """
    Deep Learning Model for Financial Sentiment
    """
    def __init__(self, vocab_size, embed_dim, hidden_dim, output_dim=1):
        super(LSTMSentimentModel, self).__init__()
        self.embedding = nn.Embedding(vocab_size, embed_dim)
        self.lstm = nn.LSTM(embed_dim, hidden_dim, batch_first=True)
        self.fc = nn.Linear(hidden_dim, output_dim)
        self.sigmoid = nn.Sigmoid()

    def forward(self, x):
        # x shape: (batch_size, seq_len)
        embedded = self.embedding(x)
        lstm_out, (hidden, cell) = self.lstm(embedded)
        # आखिरी टाइमस्टेप का आउटपुट लेना
        out = self.fc(hidden[-1])
        return self.sigmoid(out)

class SentimentProcessor:
    def __init__(self, model_path=None):
        self.engine = SentimentEngine()
        # यहाँ आप अपना ट्रेंड LSTM मॉडल लोड कर सकते हैं
        self.model = None 
        if model_path:
            # self.model = torch.load(model_path)
            pass

    def analyze_market_mood(self, headlines_list):
        """
        खबरों की लिस्ट से एक औसत सेंटिमेंट स्कोर निकालना
        """
        if not headlines_list:
            return 0.0
            
        scores = [self.engine.get_vader_score(h) for h in headlines_list]
        avg_sentiment = sum(scores) / len(scores)
        
        return round(avg_sentiment, 4)

# --- उपयोग का उदाहरण ---
# news = ["RBI keeps interest rates unchanged, market stays bullish", "Global tech stocks face heavy sell-off"]
# processor = SentimentProcessor()
# mood = processor.analyze_market_mood(news)
# print(f"Market Sentiment Score: {mood}")