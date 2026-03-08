@echo off
TITLE OmniAlgo Business Suite - Docker Controller
echo ==========================================================
echo    🚀 OMNIALGO: STARTING TRADING BUSINESS SUITE
echo ==========================================================

:: 1. चेक करें कि डॉकर चल रहा है या नहीं
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Error: Docker is not installed or not running.
    echo Please start Docker Desktop and try again.
    pause
    exit /b
)

:: 2. डॉकर इमेज बनाना (Build)
echo 🛠️ Step 1: Building Docker Image [OmniAlgo_App]...
docker build -t omnialgo-app .

:: 3. पुराने कंटेनर को हटाना (यदि कोई हो)
echo 🧹 Step 2: Cleaning up old containers...
docker stop omnialgo-instance >nul 2>&1
cd onedrive/desktop/algotrade_business_suite
docker rm omnialgo-instance >nul 2>&1

:: 4. नया कंटेनर रन करना
echo 🚢 Step 3: Launching Container...
echo ----------------------------------------------------------
echo 📊 Dashboard will be available at: http://localhost:8501
echo 🤖 Bot is running in the background...
echo ----------------------------------------------------------

:: -p 8501:8501 स्ट्रीमलिट डैशबोर्ड के लिए पोर्ट मैप करता है
:: --env-file .env आपकी सीक्रेट कीज़ को लोड करता है
docker run -d ^
  --name omnialgo-instance ^
  -p 8501:8501 ^
  --env-file .env ^
  omnialgo-app

echo ✅ SUCCESS: System is live!
echo To see logs, type: docker logs -f omnialgo-instance
echo ----------------------------------------------------------
pause