# Qubit Coaching · Android learner app

[Download the Android test APK](https://github.com/infinixsys/Qubit-lms-proto-app/releases/download/android-prototype-2026-10-22-r2/Qubit-Coaching-debug.apk) · [Release notes and checksum](https://github.com/infinixsys/Qubit-lms-proto-app/releases/tag/android-prototype-2026-10-22-r2)

A separate React/TypeScript + Capacitor Android learner app connected to the coaching-owner API in [Qubit-lms-proto-cp](https://github.com/infinixsys/Qubit-lms-proto-cp). [LOCAL_SETUP.md](LOCAL_SETUP.md) includes Windows setup, APK installation, Wi-Fi connection and build instructions.

```sh
npm ci
npm run dev          # browser preview on 7312; start the CP API first
npm run android:apk  # local Android APK; requires JDK 21 and Android SDK
```

APK output: `android/app/build/outputs/apk/debug/app-debug.apk`. The APK embeds the built app and lets learners configure their coaching server address at sign-in. Native sessions use Android Keystore-protected encrypted storage.

Home, Courses, Practice, Updates and You form the main navigation. Learners can register, request INR packages, submit payment references/receipts, see approval and activation separately, learn through private videos/images/PDFs/Word readings, save notes, complete lessons and take course-specific practice tests. Downloads, assignments, live classes, discussions, certificates, support and a reference-only study companion are available through focused secondary screens.

Learning requires an active account and an approved subscription within its access dates. Owner blocking, cancellations and expiry are enforced by the shared API. Eligible reading text can be downloaded for at most 24 hours and no later than package expiry; offline media playback is not implemented.

The visual system uses bundled free Inter, Plus Jakarta Sans and Devanagari fonts, navy/teal surfaces and realistic generated Indian course imagery. No external font/image service is needed.

`npm run build` validates types and produces the offline browser shell. `npm run format:check` checks style. Cross-product browser and backend tests live in the CP repository. Android debug APK compilation is configured in CI.

The local APK permits HTTP development servers. Use HTTPS and private release signing for deployment. iOS project scaffolding remains, but signed iOS builds and native-session integration require additional work on macOS. Manual payment review is implemented; automated payment processing, email/SMS/push delivery and production AI are not connected.
