#!/bin/sh
set -eu

configuration=${CONFIGURATION:-Release}
action=${ACTION:-install}
signing_allowed=${CODE_SIGNING_ALLOWED:-YES}
app_url=${FIVECROP_APP_URL:-}

if [ "$configuration" != "Release" ]; then
  exit 0
fi

if [ "$action" != "install" ] && [ "$signing_allowed" = "NO" ]; then
  exit 0
fi

case "$app_url" in
  https://*) ;;
  *)
    echo "error: TestFlight archives require an HTTPS FIVECROP_APP_URL." >&2
    exit 1
    ;;
esac

case "$app_url" in
  *.invalid*|*.example/*|*replace-me*|*your-fivecrop-host*)
    echo "error: Replace the placeholder FIVECROP_APP_URL before archiving." >&2
    exit 1
    ;;
esac

case "$app_url" in
  *mode=customer*) ;;
  *)
    echo "error: FIVECROP_APP_URL must include mode=customer." >&2
    exit 1
    ;;
esac

case "$app_url" in
  *realVision=required*) ;;
  *)
    echo "error: FIVECROP_APP_URL must include realVision=required." >&2
    exit 1
    ;;
esac
