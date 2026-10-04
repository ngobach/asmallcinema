#!/bin/sh
set -e

# The Vihi source drives a headed Chromium, because Cloudflare Turnstile
# refuses to issue tokens to headless browsers. In containers there is no
# display, so run a virtual X server (Xvfb) and point Chrome at it.
export DISPLAY="${DISPLAY:-:99}"

Xvfb "$DISPLAY" -screen 0 1920x1080x24 -nolisten tcp &

# Wait for the X server socket to appear (up to ~5 seconds)
i=0
while [ ! -S "/tmp/.X11-unix/X${DISPLAY#:}" ] && [ "$i" -lt 50 ]; do
  sleep 0.1
  i=$((i + 1))
done

exec "$@"
