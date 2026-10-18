# 🐤 Flappy Bird - Cross-Platform Edition (Android & Windows)

A modern, high-performance, and visually stunning remake of the classic Flappy Bird arcade game built for **both Windows and Android** using **Vite**, **HTML5 Canvas**, **Web Audio API**, **PWA**, and **Capacitor**.

🎮 **[Play Live Web Demo](https://farhan-debugs.github.io/Flappy-Game/)** &nbsp;&bull;&nbsp; 🤖 **[Direct Download Android APK](./public/flappy-bird.apk)**

> [!TIP]
> **Android Users**: You can directly download and install the ready-to-run APK: [**Download flappy-bird.apk**](./public/flappy-bird.apk). No compiling or Android Studio required!

---

## 🌟 Tech Stack Selection

To make this game fully accessible and native-feeling on **both Android and Windows** with a single unified codebase, we transitioned to a modern cross-platform stack:

| Component | Technology | Purpose |
| :--- | :--- | :--- |
| **Engine** | **HTML5 Canvas API + ES Modules** | 60+ FPS hardware-accelerated rendering, Retina/High-DPI scaling (`devicePixelRatio`). |
| **Bundler & Dev Server** | **Vite** | Lightning-fast HMR, instant startup, and optimized production bundle (`dist/`). |
| **Native Mobile Bridge** | **Capacitor 8 (`@capacitor/android`)** | Native Android project generation, Android Studio integration, and APK compilation. |
| **Haptics** | **`@capacitor/haptics` + Vibration API** | Physical feedback on flaps, milestones, and crashes across both Android devices and mobile browsers. |
| **Audio Engine** | **Web Audio API (Procedural Synthesizer)** | Zero-latency, zero-dependency audio with auto-unlock on touch/click gestures. |
| **Offline & PWA** | **Service Worker + Web App Manifest** | 100% offline playability and "Install App" support for Windows (Edge/Chrome) & Android. |

---

## ✨ Cross-Platform Features

- **📱 Android Support:**
  - **Native Android App (`android/`):** Complete Gradle & Android Studio project ready to compile into `.apk` / `.aab`.
  - **Safe Area Insets & Notch Handling:** Responsive dynamic scaling for 16:9, 18:9, 19.5:9, and 20:9 aspect ratios.
  - **Haptic Vibration:** Tactile vibration pulses on wing flaps, scoring chimes, and collisions.
  - **Touch & Gesture Optimized:** Zero-delay touch controls with pinch-zoom & scroll rubberbanding prevented (`touch-action: none`).
  - **PWA / Add to Home Screen:** Can also be installed directly from any mobile browser with custom app icon and splash screen.

- **💻 Windows Support:**
  - **Desktop Browser Play:** Run instantly in Chrome, Edge, Firefox, or Brave.
  - **Desktop PWA App Mode:** Install as a standalone Windows desktop app with its own taskbar icon and window frame via the "Install App" button.
  - **Desktop Controls:** Keyboard support (<kbd>Space</kbd>, <kbd>Arrow Up</kbd>, <kbd>W</kbd>, <kbd>Esc</kbd>, <kbd>M</kbd>, <kbd>R</kbd>) + Mouse click.
  - **Crisp High-DPI:** Sharp vector rendering across 1080p, 1440p, and 4K PC monitors.

- **🎮 Enhanced Gameplay:**
  - Procedural animated yellow bird with inertia banking, feather detail, and wing flap physics.
  - Dynamic particle systems: feather bursts on impact, wind trails, and floating `+1` score popups.
  - Parallax sky, stylized drifting clouds, and skyline scenery.
  - Persistent High Score system via `localStorage`.
  - Medal achievement system (🥉 Bronze, 🥈 Silver, 🥇 Gold, 💎 Platinum).
  - In-game controls: Mute audio toggle, Pause/Resume, Fullscreen toggle, and Play Again.

---

## 🕹️ Controls Guide

| Action | Windows (Keyboard) | Windows (Mouse) | Android (Touch) |
| :--- | :--- | :--- | :--- |
| **Flap / Jump** | <kbd>Space</kbd> / <kbd>W</kbd> / <kbd>▲</kbd> | Left Click | Tap Screen |
| **Start / Restart** | <kbd>Space</kbd> / <kbd>R</kbd> | Left Click | Tap Screen / "Play Again" |
| **Pause / Resume** | <kbd>Esc</kbd> / <kbd>P</kbd> | Click ⏸️ button | Tap ⏸️ button |
| **Toggle Mute** | <kbd>M</kbd> | Click 🔊 button | Tap 🔊 button |
| **Fullscreen** | <kbd>F11</kbd> | Click ⛶ button | Tap ⛶ button |

---

## 🚀 How to Run

### 1. On Windows (Instant Local Play / Dev Server)

```bash
# Install dependencies
npm install

# Start Vite live development server
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

To install as a native Windows desktop app:
- Click the **"📲 Install App"** button at the top right, or click the install icon in your browser's address bar (Edge or Chrome).

---

### 2. On Android

#### Option A: Run / Build Native Android APK
Prerequisites: Android Studio or Android SDK installed.

```bash
# 1. Build web bundle and sync to Android project
npm run build
npx cap sync android

# 2. Open project in Android Studio (optional)
npx cap open android

# 3. Or build the debug APK directly via command line:
cd android
.\gradlew.bat assembleDebug
```
The output APK is generated at:
`android/app/build/outputs/apk/debug/app-debug.apk`

#### Option B: Mobile Browser / PWA (Zero Install)
1. Open the dev server on your local Wi-Fi: `npm run dev -- --host`
2. Visit `http://<your-pc-ip>:3000` from your Android phone's browser.
3. Tap **"Install App"** or browser menu -> **"Add to Home screen"**.

---

## 📁 Project Architecture

```
flappy/
├── android/                   # Native Android Studio / Gradle project
│   ├── app/src/main/
│   │   ├── AndroidManifest.xml # Configured with portrait lock & vibration
│   │   └── assets/public/     # Bundled web assets for Android WebView
│   ├── build.gradle
│   └── gradlew.bat
├── public/                    # Static PWA assets
│   ├── favicon.svg            # Favicon
│   ├── icon.svg               # Scalable App Icon
│   ├── manifest.webmanifest   # PWA Manifest
│   └── sw.js                  # Offline Service Worker cache
├── src/                       # Modular source code
│   ├── audio.js               # Web Audio API sound synthesizer & mute controls
│   ├── haptics.js             # Capacitor Haptics + Navigator vibration bridge
│   ├── particles.js           # Feather bursts, puffs, and floating score text
│   ├── game.js                # Core engine, physics, pipes, medals & canvas loop
│   ├── styles.css             # Responsive styles, glassmorphism UI & notch insets
│   └── main.js                # Event listeners, PWA install prompt & app bootstrap
├── capacitor.config.json      # Capacitor project configuration
├── index.html                 # HTML5 entry point
├── package.json               # Node.js dependencies and scripts
└── vite.config.js             # Vite bundler configuration
```

---

## 📜 License

MIT License. Made with ❤️ by [farhan-debugs](https://github.com/farhan-debugs).
