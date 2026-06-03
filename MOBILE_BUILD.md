# Mobile builds (Android & iOS)

This project uses [Capacitor](https://capacitorjs.com/) to wrap the Vite/React web app in native Android and iOS shells.

| Item | Value |
|------|--------|
| App ID | `com.lafriends.homecare` |
| Display name | LaFriend's |
| Web bundle | `dist/` (from `npm run build`) |

## Prerequisites

### All platforms

- Node.js 18+ and npm
- `.env` with `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` (same as web)

### Android

- [Android Studio](https://developer.android.com/studio) (latest stable)
- Android SDK Platform 34+ and build-tools
- JDK 17 (bundled with Android Studio)

### iOS (macOS only)

- macOS with [Xcode](https://developer.apple.com/xcode/) 15+
- CocoaPods: `sudo gem install cocoapods`
- Apple Developer account (for device testing and App Store)

> **Windows:** You can add the iOS project and sync assets here, but building and submitting to the App Store requires a Mac.

## First-time setup

```bash
npm install
npm run build
npx cap add android
npx cap add ios
npm run mobile:assets
npm run mobile:sync
```

## Day-to-day commands

| Command | Description |
|---------|-------------|
| `npm run mobile:sync` | Build web app and copy into native projects |
| `npm run mobile:android` | Sync, then open Android Studio |
| `npm run mobile:ios` | Sync, then open Xcode |
| `npm run mobile:run:android` | Sync and run on connected device/emulator |
| `npm run mobile:run:ios` | Sync and run on simulator/device (macOS) |
| `npm run mobile:assets` | Regenerate launcher icons & splash from `public/pwa-icon.svg` |

## Android release build

1. `npm run mobile:sync`
2. Open Android Studio: `npm run mobile:android`
3. **Build → Generate Signed Bundle / APK**
4. Create or select a keystore, choose **Android App Bundle (AAB)** for Play Store
5. Upload the `.aab` to [Google Play Console](https://play.google.com/console)

### Play Store checklist

- [ ] Privacy policy URL (required)
- [ ] App icon 512×512 PNG (use output from `mobile:assets` or Play Console)
- [ ] Screenshots (phone + optional tablet)
- [ ] Content rating questionnaire
- [ ] Target API level meets Play policy

## iOS release build

1. On a Mac: `npm run mobile:sync`
2. Open Xcode: `npm run mobile:ios`
3. Select your Team under **Signing & Capabilities**
4. Set bundle identifier: `com.lafriends.homecare`
5. **Product → Archive** → **Distribute App** → App Store Connect

### App Store checklist

- [ ] Apple Developer Program membership
- [ ] Privacy policy URL
- [ ] App Store screenshots per device size
- [ ] App Privacy details in App Store Connect

## Live reload during development

With the dev server running (`npm run dev` on port 8080), point the native app at your machine:

1. Edit `capacitor.config.ts` and uncomment/add:

```ts
server: {
  url: "http://YOUR_LAN_IP:8080",
  cleartext: true,
},
```

2. `npx cap sync`
3. Run from Android Studio or Xcode

Remove `server.url` before store releases.

## Web vs native behavior

- **Service worker** is disabled in the native shell (Capacitor WebView). PWA caching still applies in the browser.
- **Push notifications** in the app today use the web Push API; for reliable native push, add `@capacitor/push-notifications` and FCM/APNs configuration in a follow-up.
- **reCAPTCHA** and external scripts require network access; ensure cleartext/ATS rules if testing against non-HTTPS dev URLs.

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Blank white screen | Run `npm run mobile:sync` after every web change; confirm `dist/index.html` exists |
| Assets 404 | `base: "./"` is set in `vite.config.ts` for Capacitor |
| Android Gradle sync fails | Open SDK Manager; install latest Platform + Build-Tools |
| iOS pod install fails | `cd ios/App && pod install` |
| Supabase auth redirect | Add custom URL scheme / universal links for `com.lafriends.homecare` in Supabase dashboard |

## Project layout

```
capacitor.config.ts   # App ID, plugins, optional dev server URL
android/              # Android Studio project (after cap add android)
ios/                  # Xcode project (after cap add ios)
resources/            # Source icon/splash for @capacitor/assets
src/native/           # Status bar, splash, Android back button
```
