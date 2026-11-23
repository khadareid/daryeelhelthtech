# iOS internal distribution (same as Android preview)

Follows: https://docs.expo.dev/tutorial/eas/internal-distribution-builds/

## You need first

1. **Apple Developer Program** ($99/year) — https://developer.apple.com/programs/
2. Account Holder / Admin access (create certificates & profiles)
3. Physical iPhone/iPad UDID registered (ad hoc)

## One-time: register your iPhone

```bash
cd App
npx eas device:create
```

- Opens a URL / QR code — open it **on the iPhone**
- After registration, new builds include that device
- New Apple memberships: Apple may take **24–72 hours** to activate a new device

## Create iOS preview (install link like Android)

Run in an **interactive** terminal (not CI) — Apple login is required:

```bash
cd App
npx eas build -p ios --profile preview
```

When prompted:

1. **Log in to Apple account?** → **Y**
2. Let EAS **generate** Distribution Certificate + Ad Hoc Provisioning Profile
3. Select the registered device(s)

When the build finishes, open the build page on Expo → **Install** → share the **link / QR** by email (same as Android “Open on …”).

Project builds: https://expo.dev/accounts/engkhadareid/projects/daryeel-health/builds

## Optional: re-sign later for a new phone

```bash
npx eas build:resign -p ios
```

(No full rebuild — updates the IPA provisioning profile.)
