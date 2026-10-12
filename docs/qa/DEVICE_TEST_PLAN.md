# Device QA — Dishcart (#32)

Everything the web build can't prove: purchases, codes, notifications, keep-awake,
share sheet, file import/export, and screen readers. Record results on issue #32
(copy the checklist into a comment and tick it). File each failure as a new issue.

## 0. One-time setup (owner)

1. `npx eas-cli login` (Expo account), then `npx eas-cli init` to link the project
   (writes `extra.eas.projectId` into `app.json`; commit that).
2. **iOS:** Apple Developer account for Bionic Sun LLC. Register test iPhones:
   `npx eas-cli device:create`. Create a Sandbox tester in App Store Connect
   (Users and Access → Sandbox) and sign into it on the device under
   Settings → App Store → Sandbox Account.
3. **Android:** add tester Gmail accounts as License testers in Play Console
   (Settings → License testing).
4. RevenueCat public keys in EAS: `npx eas-cli env:create --name EXPO_PUBLIC_RC_IOS_KEY ...`
   and `EXPO_PUBLIC_RC_ANDROID_KEY` (environment: development + preview). Until #26
   is done, purchases show "Ad-free isn't available"; everything else is testable.

## 1. Build and install

```bash
npm run doctor        # must report 0 issues
npm run build:dev     # development client, iOS + Android (internal distribution)
```

Install from the EAS build page / QR code. Then on the computer:
`npx expo start --dev-client` and open the project from the dev client.
For a release-like check (no dev menu, no ad placeholders) use `npm run build:preview`.

## 2. Test script (run on one iPhone and one Android phone)

### Onboarding & preferences
- [ ] Fresh install shows onboarding; pick Vegetarian + Peanut allergy + avoid Portobello
- [ ] Browse shows only vegetarian recipes, none with peanut or portobello; "Show all diets" works, allergens still hidden
- [ ] Settings changes save; a conflicting planned meal is flagged after saving

### Plan → shop → cook
- [ ] Add 4 meals from Browse; ✓ removes one; Undo restores it
- [ ] Swap a plan meal; servings carry over; Undo works after landing on the Plan
- [ ] Change servings on a plan entry; grocery amounts update
- [ ] Grocery: check items, "Uncheck all", add "milk" (lands in Dairy), edit its aisle, delete it
- [ ] Mark a staple "need it" and an item "I have this"; pantry section updates
- [ ] **Share list** opens the OS share sheet with aisle-grouped text
- [ ] Cooking mode: steps advance, per-step ingredients show, **screen does not sleep** for 2+ minutes untouched
- [ ] Start a step timer, **background the app**, notification fires at zero (permission prompt appears on first timer only)
- [ ] "Cooked it" returns to the Plan; meal appears in Recently cooked; Undo works
- [ ] Recipe notes and 👍 persist after force-quitting the app

### Nutrition
- [ ] Recipe → Nutrition tab shows per-serving facts, per-ingredient table, data sources
- [ ] Browse "< 400 kcal" filter narrows the list

### Backup
- [ ] Settings → Export backup → save to Files/Drive (consent prompt mentions allergies)
- [ ] Delete and reinstall the app → Import backup → **Replace** restores everything
- [ ] Import the same file again with **Merge** → nothing duplicated
- [ ] Importing a random non-backup file shows a clear error and changes nothing

### Ads & ad-free subscription (needs #26–#28)
- [ ] Dev build: dashed ad placeholders in Browse (every 8th), recipe detail, plan footer — none in onboarding, cooking mode, settings
- [ ] Remove ads → sandbox/test purchase $0.99/month → ads disappear immediately; Remove Ads screen closes itself
- [ ] Restore purchases on a second device (same store account) removes ads there
- [ ] Settings → Ads shows "Ad-free — renews …"; Manage subscription opens the store page
- [ ] Redeem a code (#29) — iOS shows Apple's sheet; Android opens Play redeem; ads disappear after returning to the app
- [ ] Airplane mode after subscribing: still ad-free (offline grace); after sandbox expiry + 3 days offline, ads return
- [ ] Cancel in sandbox → after expiry, ads return

### Accessibility (closes #23)
- [ ] VoiceOver (iOS) and TalkBack (Android): complete onboarding → add a meal → check a grocery item using only the screen reader; every button announces a name
- [ ] Largest system text size: no clipped or overlapping text on Plan, Browse, Recipe, Grocery, Cooking mode

### Resilience
- [ ] Force-quit mid-shopping: check-offs, plan, and timers' absence don't crash on relaunch
- [ ] Rotate / split-screen (iPad if supported): layouts hold

## 3. Sign-off

- [ ] All items pass on iOS (device + OS version: ____)
- [ ] All items pass on Android (device + OS version: ____)
