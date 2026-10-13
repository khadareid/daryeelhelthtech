console.log(`
iOS on this PC (Windows)
========================
Xcode / iOS Simulator ONLY work on macOS.
Pressing "i" in Expo on Windows will always fail.

Use a real iPhone instead:
  1. Install Expo Go from the App Store
  2. Connect iPhone to the SAME WiFi as this PC
     (or run: npm run start:tunnel)
  3. Open Expo Go and scan the QR code from the terminal

Commands:
  npm run start:web      -> browser
  npm run start:android  -> Android emulator (needs Android Studio)
  npm run start:tunnel   -> best for physical Android/iPhone
`);
