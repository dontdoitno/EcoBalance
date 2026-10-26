#!/usr/bin/env bash
# Fails if any pattern from .stopwords.local is found in the working tree.
# Skips node_modules, .git, lock files, and the stopwords files themselves.
set -euo pipefail

cd "$(git rev-parse --show-toplevel)"

STOPWORDS_FILE=".stopwords.local"

if [[ ! -f "$STOPWORDS_FILE" ]]; then
  echo "check-clean: $STOPWORDS_FILE not found — nothing to check (create it from .stopwords.local.example)."
  exit 0
fi

PATTERNS=$(grep -vE '^\s*#|^\s*$' "$STOPWORDS_FILE" || true)

if [[ -z "$PATTERNS" ]]; then
  echo "check-clean: $STOPWORDS_FILE has no active patterns — nothing to check."
  exit 0
fi

EXCLUDES=(
  --glob '!node_modules/**'
  --glob '!.git/**'
  --glob '!**/*.lock'
  --glob '!package-lock.json'
  --glob '!pnpm-lock.yaml'
  --glob '!.stopwords.local'
  --glob '!.stopwords.local.example'
)

FOUND=0
while IFS= read -r pattern; do
  [[ -z "$pattern" ]] && continue
  if command -v rg >/dev/null 2>&1; then
    if rg --no-heading --line-number -i "${EXCLUDES[@]}" -- "$pattern" .; then
      FOUND=1
    fi
  else
    if grep -r -I -n -i \
      --exclude-dir=node_modules --exclude-dir=.git \
      --exclude='*.lock' --exclude='package-lock.json' --exclude='pnpm-lock.yaml' \
      --exclude='.stopwords.local' --exclude='.stopwords.local.example' \
      -E -- "$pattern" .; then
      FOUND=1
    fi
  fi
done <<< "$PATTERNS"

if [[ "$FOUND" -eq 1 ]]; then
  echo "check-clean: FAILED — stopword matches found above."
  exit 1
fi

echo "check-clean: OK — no stopword matches."
