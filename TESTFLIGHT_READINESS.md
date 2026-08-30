# FiveCrop TestFlight readiness

The repository includes an iPhone shell that opens the customer experience and treats real vision as a release requirement. A TestFlight build must not be distributed until the live preflight passes.

## Release gates

| Gate | Requirement |
| --- | --- |
| Customer service | Public HTTPS deployment of this repository root |
| Real plant recognition | `VISION_PROVIDER=qwen` plus `DASHSCOPE_API_KEY` (or another explicitly configured provider) |
| No silent fallback | Release URL keeps `realVision=required`; the UI stops instead of presenting local rules as recognition |
| Live provider proof | `npm run testflight:preflight -- --url "https://YOUR_HOST/?mode=customer&runtime=testflight&realVision=required"` passes |
| iPhone packaging | Xcode project generates and the unsigned device build passes |
| Apple distribution | Bundle ID, Apple Developer team, signing certificate, App Store Connect app, and TestFlight tester group are configured |

## Configure the backend

Deploy the repository root to an HTTPS Node.js host. Keep secrets on the server only:

```text
VISION_PROVIDER=qwen
DASHSCOPE_API_KEY=...
QWEN_VISION_MODEL=qwen-vl-plus
```

Verify the deployed app and one paid live model request:

```sh
npm run testflight:preflight -- --url "https://YOUR_HOST/?mode=customer&runtime=testflight&realVision=required"
```

This command fails if the page is unavailable, the integration status is not connected, the model request falls back to local rules, the image was not passed to the model, or the structured result is incomplete.

## Configure the iOS app

Copy `ios/Config/Local.xcconfig.example` to `ios/Config/Local.xcconfig` and set:

- the same HTTPS customer URL used by the passing preflight;
- an App Store Connect bundle identifier;
- the Apple Developer team ID.

Generate and open the project:

```sh
npm run ios:generate
open ios/FiveCrop.xcodeproj
```

The local config is ignored by Git so team identifiers and environment-specific URLs do not leak into source control.

## Real-device acceptance run

Use at least one clear whole-plant photo and one requested detail photo for each supported crop: tomato, basil, rosemary, strawberry, and pepper. For every run, record:

1. camera permission and capture success;
2. provider and model shown by the backend record (`qwen-dashscope` is expected for Qwen);
3. crop match or an explicit whole-plant retake request;
4. one clear action for today;
5. a specific follow-up time and same-angle photo instruction;
6. offline/provider failure stopping diagnosis and preserving the photo for retry.

Only upload an archive to TestFlight after the live preflight, unsigned build, and the five-crop device run all pass.
