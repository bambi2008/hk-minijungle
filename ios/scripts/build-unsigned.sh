#!/bin/sh
set -eu

script_dir=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
repo_root=$(CDPATH= cd -- "$script_dir/../.." && pwd)
derived_data="$repo_root/ios/build/DerivedData"

command -v xcodegen >/dev/null 2>&1 || {
  echo "xcodegen is required. Install it with: brew install xcodegen" >&2
  exit 1
}

xcodegen generate --spec "$repo_root/ios/project.yml" --project "$repo_root/ios"
xcodebuild \
  -project "$repo_root/ios/FiveCrop.xcodeproj" \
  -scheme FiveCrop \
  -configuration Release \
  -destination "generic/platform=iOS" \
  -derivedDataPath "$derived_data" \
  CODE_SIGNING_ALLOWED=NO \
  build
