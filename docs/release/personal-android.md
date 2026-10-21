# Personal install on Android (T42)

Dishcart is installed straight onto the owner's Android phone as a release APK — no Play Store,
no account. Everything stays on the phone (no backend). This build is signed with the debug key,
which is fine for personal use but **not** for the Play Store (that needs the upload key; see T28).

## Build (on the Mac)

```bash
cd android && JAVA_HOME=/opt/homebrew/opt/openjdk@21 ANDROID_HOME=/opt/homebrew/share/android-commandlinetools ./gradlew assembleRelease
```

Output: `android/app/build/outputs/apk/release/app-release.apk` (~85 MB, all CPU types).
`android/` is generated (gitignored); if `app.json` or native dependencies change, run
`npx expo prebuild --platform android` first.

## Install

Either:

- **USB:** enable Developer options → USB debugging on the phone, plug it in, then
  `/opt/homebrew/share/android-commandlinetools/platform-tools/adb install -r android/app/build/outputs/apk/release/app-release.apk`
- **File:** copy the APK to the phone (Drive, USB file transfer), open it, and allow
  "Install unknown apps" for that app when Android asks.

Updating: build again and install over the top (`-r`); data is kept because the signing key and
package id (`com.bionicsun.dishcart`) stay the same. Settings → Backup now and then is still wise.

## Notes

- Recipe import from a website works on the phone (it fetches the page you paste); nothing else
  goes online. Ads: none are registered, so release builds show none. The ad-free subscription
  isn't set up (T26), so "Remove ads" won't complete a purchase.
