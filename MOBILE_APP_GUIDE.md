# Label Jigyasa — Mobile App Publishing Guide

Your Next.js e-commerce site is now a **fully installable Progressive Web App (PWA)** — customers on Android & iOS can install it directly from the browser with "Add to Home Screen" and it feels native (fullscreen, own icon, offline support).

To go beyond that and publish on **Google Play Store** and **Apple App Store**, wrap the web app with **Capacitor** (by the Ionic team). This is the fastest, cheapest way to ship the same codebase as a real store-listed app.

---

## Prerequisites

| For | You Need |
|---|---|
| Play Store | 1) A **Windows / Mac / Linux** computer with Android Studio installed. 2) A **Google Play Developer** account ($25 one-time fee). |
| App Store | 1) A **Mac** computer (required) with Xcode installed. 2) An **Apple Developer** account ($99/year). |
| Both | Node.js 18+ and Git. |

---

## Step 1 — Add Capacitor to the Next.js project

```bash
# In your local clone of the repo:
cd label-jigyasa

# Install Capacitor
yarn add @capacitor/core @capacitor/cli
yarn add @capacitor/android @capacitor/ios

# Initialize Capacitor (answer prompts)
npx cap init "Label Jigyasa" "com.labeljigyasa.app" --web-dir=out

# Configure Next.js for static export (needed for Capacitor)
# Add to next.config.js:
#   output: 'export'
#   images: { unoptimized: true }

# Build the static site
yarn build

# Add native platforms
npx cap add android
npx cap add ios     # Mac only

# Copy web assets into native projects
npx cap sync
```

> **Note:** Because Capacitor needs a static export (`out/` folder), API routes (`/api/*`) must live on a separate server. Deploy your Next.js API to Vercel/Railway/etc., then set `NEXT_PUBLIC_API_URL` in the app to point there — all `fetch('/api/...')` calls will hit the deployed backend.

---

## Step 2 — Configure `capacitor.config.ts`

```typescript
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.labeljigyasa.app',
  appName: 'Label Jigyasa',
  webDir: 'out',
  server: {
    // OPTION A: Load from your live website (simplest)
    url: 'https://www.labeljigyasa.com',
    cleartext: false,
    // OPTION B: Bundle static files (remove url line above)
  },
  ios: {
    contentInset: 'always',
  },
  android: {
    allowMixedContent: false,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#4a0c1c',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
    },
  },
};

export default config;
```

---

## Step 3 — Publish to Google Play Store 🤖

### 3.1 Open in Android Studio
```bash
npx cap open android
```

### 3.2 Update `android/app/build.gradle`
```gradle
android {
  defaultConfig {
    applicationId "com.labeljigyasa.app"
    versionCode 1
    versionName "1.0.0"
    minSdkVersion 22
    targetSdkVersion 34
  }
}
```

### 3.3 Add app icons
Replace icons in `android/app/src/main/res/mipmap-*/` with your `logo-icon.png` at each density (mdpi, hdpi, xhdpi, xxhdpi, xxxhdpi). Or use **Android Studio → Image Asset Studio** and import `public/icon-512.png`.

### 3.4 Generate a signed release AAB
In Android Studio: **Build → Generate Signed Bundle / APK → Android App Bundle**.
- Create a new keystore (SAVE THE FILE + PASSWORD in a safe place — you need it for every future update)
- Choose "release" build variant
- Output: `app-release.aab`

### 3.5 Upload to Play Console
1. Go to https://play.google.com/console → **Create app**
2. Fill in Store Listing (name, short/long description, screenshots — 2-8 phone screenshots minimum)
3. Upload feature graphic (1024×500 px), app icon (512×512 px)
4. Go to **Release → Production → Create new release**
5. Upload the `app-release.aab`
6. Fill Content Rating questionnaire
7. Fill Data Safety section
8. Submit for review (usually approved in 1-7 days)

---

## Step 4 — Publish to Apple App Store 🍎 (Mac required)

### 4.1 Open in Xcode
```bash
npx cap open ios
```

### 4.2 Configure in Xcode
1. Select the **App** target → **Signing & Capabilities**
2. Set Team to your Apple Developer team
3. Set Bundle Identifier to `com.labeljigyasa.app`
4. Version: `1.0.0`, Build: `1`

### 4.3 Add app icons
1. In Xcode, open `App/App/Assets.xcassets/AppIcon.appiconset`
2. Drag your `public/icon-512.png` — Xcode will auto-generate all sizes, OR
3. Use https://appicon.co to generate all iOS icon sizes and drag them in.

### 4.4 Archive and upload
1. In Xcode: **Product → Destination → Any iOS Device**
2. **Product → Archive**
3. When done: **Distribute App → App Store Connect → Upload**
4. Sign with your Apple Developer certificate

### 4.5 Submit in App Store Connect
1. Go to https://appstoreconnect.apple.com → **My Apps → +**
2. Fill in metadata (name, subtitle, description, keywords, category = "Shopping")
3. Upload screenshots (6.5" iPhone + 5.5" iPhone required minimum)
4. Upload the build you archived
5. Fill privacy policy URL + data collection questionnaire
6. Submit for App Review (usually 1-3 days)

---

## Step 5 — Push updates later

Whenever you update the website:
```bash
yarn build            # rebuild static assets
npx cap sync          # copy to native projects
npx cap open android  # or ios
# Bump versionCode + versionName in build.gradle (Android)
# Bump Version + Build in Xcode (iOS)
# Re-archive/upload
```

If you use `server.url` (Option A above), most updates go live **without** an app-store update — only native code changes need re-submission.

---

## Alternative: TWA (Trusted Web Activity) for Play Store only

If you only care about Play Store and want the absolute fastest path:

```bash
npx @bubblewrap/cli init --manifest=https://www.labeljigyasa.com/manifest.json
npx @bubblewrap/cli build
```

This produces a Play-Store-ready AAB in <5 minutes. It runs your live PWA inside Chrome — perfect for e-commerce.

---

## Checklist before submitting

- [ ] Deploy the Next.js site to a public HTTPS URL (Vercel recommended)
- [ ] Custom domain configured with valid SSL (already have www.labeljigyasa.com?)
- [ ] Privacy Policy page live (required by both stores)
- [ ] Terms & Conditions page live
- [ ] App icons at all required sizes
- [ ] 6+ screenshots per platform
- [ ] Feature graphic (Play) / App Preview video (App Store — optional)
- [ ] Test the built app on a real device before submitting
- [ ] Razorpay: ensure Live Mode keys are configured on the deployed backend (not test keys)

---

**Questions?** Just ask — I can generate any of the config files, help debug a native build, or automate the Bubblewrap TWA path when you're ready to submit.
