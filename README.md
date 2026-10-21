# Qubit · Learner app

For your own computer, follow [Local setup](LOCAL_SETUP.md).

A separate responsive learner application and **Capacitor hybrid Android/iOS project**, connected to the shared API in `infinixsys/Qubit-lms-proto-cp`.

## Start

Requires Node 24.19.0 or compatible Node 24 and npm. First start the API in the control-panel checkout:

```bash
cd /workspace/Qubit-lms-proto-cp
npm ci
npm run start
```

Then start the separate learner app:

```bash
cd /workspace/Qubit-lms-proto-app
npm ci
npm run dev
```

The app uses port **5174**; the control panel uses **5173**; the API uses **4000**. Select **Explore the learner demo** or register a synthetic account. The development learner is `learner@qubit.demo` / `QubitDemo2026!`. The desktop app has sidebar navigation; mobile has bottom tabs and a menu for additional modules.

## Learning experience

Personalised home, course search and filters, saved courses, enrolment, Course Atlas/list, reading and device read-aloud, transcript, focus mode, bookmarks, personal notes, offline reading downloads, server-timed assessments, submissions, graded feedback, progress and Mastery Lens, reference-based companion, inbox, community, live-session calendar export, support, earned certificates, account sessions, appearance/accessibility preferences, goals and privacy requests.

The visual system uses bundled DM Sans/Manrope fonts, original SVG course illustrations, a calm sage palette, dark appearance, reduced-motion support and responsive navigation. No external image/font service is required.

## Hybrid Android and iOS

Both `android/` and `ios/` are generated native projects. They embed the **built** web application, not the Vite development server.

```bash
npm run native:sync  # typecheck, web build, offline-shell generation, Capacitor sync
npm run android      # open Android Studio on a suitable development machine
npm run ios          # open Xcode on macOS
```

For a real device, supply `VITE_API_URL` as an HTTPS backend origin at **build time**, configure that origin's CORS and session-cookie policy, then rebuild and sync. The default empty value is intentionally for the browser's same-origin development proxy; an unconfigured native build cannot reach the local API. Do not put API credentials in frontend variables.

Native prerequisites:

- Android Studio, appropriate Android SDK, Java 21, signing configuration, and an emulator or device.
- macOS, Xcode, CocoaPods, Apple signing/provisioning and an iOS simulator or device.
- A reachable HTTPS API with a tested native authentication strategy.

**Validated here:** web build, TypeScript, browser flows, Android/iOS project generation and asset/plugin sync. **Not validated:** native compilation, native cookie/session persistence, secure keychain/keystore storage, biometrics, device background behaviour, app-store signing, provisioning, and real-device accessibility. Linux cannot build a signed iOS application.

## Offline behaviour

Production web builds include a versioned service worker precaching the application shell. Reading lessons are downloaded explicitly and expire after **24 hours**. Online access is checked by the API. Supported progress and notes queue on this device and sync in order after reconnection; completion is monotonic and event keys prevent duplicates. Failed sync records remain visible for retry or explicit discard. Quizzes and final assignment submissions require a connection.

Local prototype downloads and personal caches are **not encrypted**. Signing out clears them (with a warning for unsynced work). Immediate remote revocation while disconnected, media DRM, resumable streaming downloads and high-stakes offline assessments are not implemented. Do not put sensitive content on shared devices.

## Checks

```bash
npm run typecheck
npm run build
npm run native:sync
npm run format:check
# Full cross-product browser suite lives in the control-panel repository:
npm run test:e2e --prefix ../Qubit-lms-proto-cp
```

Full requirements coverage, architecture, review instructions and production gaps are documented in the control-panel repository and summarised in [docs/FEATURE_MATRIX.md](docs/FEATURE_MATRIX.md).
