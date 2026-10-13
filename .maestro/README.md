# Device E2E tests (Maestro)

Six flows covering the core loop on real iOS/Android builds: onboarding (diet, allergy,
dislike), add from Browse + undo + mark cooked, grocery list, recipe nutrition tab + source
credit, cooking mode, and settings.

Run them against a **release** build so the JS bundle is embedded and no dev menu appears:

```bash
npx expo run:ios --configuration Release          # installs on the booted simulator
npx expo run:android --variant release            # installs on the running emulator
npm run e2e                                       # all flows, first connected device
maestro --device <udid|emulator-5554> test .maestro
```

Maestro needs Java 17+ (`JAVA_HOME=/opt/homebrew/opt/openjdk@21`).

Selector notes (both platforms):
- Tabs: `"Browse(, tab.*)?"` — iOS exposes "Browse, tab, 2 of 5", Android "Browse".
- Section headers are uppercased by style only; match `(?i)ingredients`.
- Text inside a pressable card merges into one label on iOS; use `'.*Milk.*'`, but use exact
  text when a button label also contains it (`"Chicken Adobo"`, not `.*Chicken Adobo.*`).
- Never `hideKeyboard` on Android (it presses Back); submit with `pressKey: Enter`.
- `launch.yaml` declines any system "Not Now" alert. Flows never enter credentials.
