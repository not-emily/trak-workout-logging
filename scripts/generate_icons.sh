#!/usr/bin/env bash
# Generate the trak PWA icon set from a Twemoji codepoint.
#
# Master: 1024x1024 black background with the emoji rendered at 700px,
# centered. All other sizes are direct downscales.
#
# Outputs to frontend/public/. Idempotent — rerun any time.
#
# Tooling: rsvg-convert (SVG -> PNG) + ImageMagick (composite + resize).
#
# Pin a specific Twemoji tag so future emoji-art tweaks don't silently
# rewrite our icons. Bump TWEMOJI_VERSION when you want the latest art.

set -euo pipefail

CODEPOINT="${1:-1f4aa}"  # 1f4aa = 💪 (biceps)
TWEMOJI_VERSION="v14.0.2"
BG_COLOR="black"
EMOJI_PX=700
MASTER_PX=1024

REPO_ROOT="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
OUT_DIR="$REPO_ROOT/frontend/public"
TMP_DIR="$(mktemp -d)"
trap 'rm -rf "$TMP_DIR"' EXIT

SVG_URL="https://cdn.jsdelivr.net/gh/twitter/twemoji@${TWEMOJI_VERSION}/assets/svg/${CODEPOINT}.svg"
SVG_PATH="$TMP_DIR/emoji.svg"
EMOJI_PNG="$TMP_DIR/emoji.png"
MASTER_PNG="$TMP_DIR/master.png"

echo "→ downloading $SVG_URL"
curl --silent --show-error --fail -o "$SVG_PATH" "$SVG_URL"

# Use the bare emoji SVG as the browser-tab favicon — matches the
# rasterized PNG icons but stays vector-crisp in browser tabs.
cp "$SVG_PATH" "$OUT_DIR/favicon.svg"
echo "→ $OUT_DIR/favicon.svg"

echo "→ rasterizing emoji to ${EMOJI_PX}x${EMOJI_PX}"
rsvg-convert --width "$EMOJI_PX" --height "$EMOJI_PX" "$SVG_PATH" --output "$EMOJI_PNG"

echo "→ compositing onto ${MASTER_PX}x${MASTER_PX} ${BG_COLOR} background"
magick -size "${MASTER_PX}x${MASTER_PX}" "xc:${BG_COLOR}" \
  "$EMOJI_PNG" -gravity center -composite "$MASTER_PNG"

mkdir -p "$OUT_DIR"

# Standard PWA sizes + Android launcher sizes + Apple touch icon (180).
# 512 is also reused as the maskable icon — emoji is well within the
# inner 80% safe zone given our 700/1024 ratio.
for size in 72 96 144 180 192 256 512; do
  out="$OUT_DIR/icon-${size}.png"
  echo "→ ${out}"
  magick "$MASTER_PNG" -resize "${size}x${size}" "$out"
done

echo "✓ done. icons in $OUT_DIR"
