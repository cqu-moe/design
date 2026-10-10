#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

# Workers Builds uses Ubuntu 24.04 x86_64 without sudo. Extract Chromium's
# Ubuntu packages locally; do not install packages or change the system image.
# Keep this list aligned with the locked Playwright release's nativeDeps.
source /etc/os-release
if [[ "$ID" != ubuntu || "$VERSION_ID" != 24.04 || "$(uname -m)" != x86_64 ]]; then
  echo 'Cloudflare browser gate requires Ubuntu 24.04 x86_64.' >&2
  exit 1
fi
pnpm check
mkdir -p .verification
libs="$(mktemp -d "$PWD/.verification/chromium-libs.XXXXXX")"
mkdir -p "$libs/lists/partial" "$libs/cache/archives/partial"
# Cloudflare strips global APT indexes. Keep all package state in this build
# workspace and resolve transitive dependencies against a copy of host state.
cp /var/lib/dpkg/status "$libs/status"
cat > "$libs/apt.conf" <<'APT'
#clear APT::Update::Post-Invoke;
#clear APT::Update::Post-Invoke-Success;
#clear DPkg::Post-Invoke;
APT
apt_options=(-c "$libs/apt.conf" -o "Dir::State::lists=$libs/lists"
  -o "Dir::State::status=$libs/status"
  -o "Dir::State::extended_states=$libs/extended_states"
  -o "Dir::Cache=$libs/cache" -o Debug::NoLocking=true)
apt-get "${apt_options[@]}" update
apt-get "${apt_options[@]}" --download-only --no-install-recommends -y install \
  libasound2t64 libatk-bridge2.0-0t64 libatk1.0-0t64 libatspi2.0-0t64 \
  libcairo2 libcups2t64 libdbus-1-3 libdrm2 libgbm1 libglib2.0-0t64 \
  libnspr4 libnss3 libpango-1.0-0 libx11-6 libxcb1 libxcomposite1 \
  libxdamage1 libxext6 libxfixes3 libxkbcommon0 libxrandr2
shopt -s nullglob
for package in "$libs"/cache/archives/*.deb; do
  dpkg-deb -x "$package" "$libs/root"
done
export LD_LIBRARY_PATH="$libs/root/usr/lib/x86_64-linux-gnu${LD_LIBRARY_PATH:+:$LD_LIBRARY_PATH}"
pnpm exec playwright install chromium
pnpm test:e2e
pnpm verify:consumer
