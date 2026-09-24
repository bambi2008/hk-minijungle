# TestFlight setup

The repository now contains a macOS 26 / Xcode 26 GitHub Actions workflow that first compiles the app without signing, then archives and uploads it to App Store Connect when manually requested.

## Apple prerequisites

1. An active Apple Developer Program membership.
2. An explicit App ID for `com.hkminijungle.plantmonster` in Certificates, Identifiers & Profiles.
3. An App Store Connect app record named `Plant Monster` using that bundle ID.
4. A **team** App Store Connect API key with a role that can upload builds and access signing resources. Do not use an individual key because it cannot use provisioning endpoints.
5. Access to cloud-managed distribution certificates enabled for the key/user if Apple presents that option.

Before creating the app record, make sure the Account Holder has accepted Apple’s latest agreements.

## GitHub secrets

Open the GitHub repository, then go to **Settings → Secrets and variables → Actions** and add these repository secrets:

| Secret | Value |
|---|---|
| `APPLE_TEAM_ID` | The 10-character Apple Developer Team ID |
| `ASC_KEY_ID` | App Store Connect API key ID |
| `ASC_ISSUER_ID` | App Store Connect API issuer ID |
| `ASC_API_KEY_P8_BASE64` | Base64 encoding of the downloaded `.p8` private key |

Never commit or paste the `.p8` private key into an issue, chat, source file, or workflow.

On Windows PowerShell, copy the Base64 value to the clipboard with:

```powershell
[Convert]::ToBase64String([IO.File]::ReadAllBytes('C:\path\to\AuthKey_ABC123XYZ.p8')) | Set-Clipboard
```

## Upload a build

1. Open the repository’s **Actions** tab.
2. Select **Plant Monster iOS**.
3. Choose **Run workflow** on the `codex/plant-monster-ios` branch.
4. Enable **Archive and upload this build to TestFlight**.
5. Run the workflow.

The workflow uses its GitHub run number as the App Store build number, so every upload is unique. Apple processes the build after upload; it can take several minutes before it appears in TestFlight.

## Add the iPhone as an internal tester

In App Store Connect, open **Plant Monster → TestFlight → Internal Testing**, create a group if needed, and add the Apple Account used by the TestFlight app on the phone. Internal testing does not require Beta App Review.
