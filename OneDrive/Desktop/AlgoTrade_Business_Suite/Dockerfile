# Python का हल्का वर्ज़न उपयोग करें
FROM python:3.9-slim

# वर्किंग डायरेक्टरी सेट करें
WORKDIR /app

# लाइब्रेरी फाइलों को कॉपी और इंस्टॉल करें
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# बाकी सारा कोड कॉपी करें
COPY . .

# डैशबोर्ड के लिए पोर्ट खोलें
EXPOSE 8501

# बॉट और डैशबोर्ड को एक साथ चलाने के लिए कमांड
CMD ["sh", "-c", "python main_bot.py & streamlit run dashboard.py"]