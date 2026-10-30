#!/usr/bin/env bash
# Run every check. Exit code 0 (and the last line ALL CHECKS PASSED) means safe to publish.
set -euo pipefail
cd "$(dirname "$0")/.."
python3 scripts/build.py > /dev/null
if ! git diff --quiet -- index.html dist/artifact.html 2>/dev/null; then
  echo "index.html or dist/artifact.html was out of date with src/app.html (rebuilt now; commit the rebuilt files)."
  [ -n "${CI:-}" ] && exit 1
fi
node tests/syntax.js index.html
# Use a local Playwright if installed, otherwise a global one.
if [ ! -d node_modules/playwright ]; then export NODE_PATH="${NODE_PATH:-$(npm root -g)}"; fi
node tests/browser.js
echo "ALL CHECKS PASSED"
