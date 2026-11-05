#!/bin/bash
# Before publishing: no .env, keys, data dumps, home-network names or real coordinates — in the whole history.
# `--self-test` builds a throwaway repo, injects a .env and a .lan host and expects both to be refused:
# a check that never fails proves nothing.
set -euo pipefail
ROOT=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)

FORBIDDEN_PATHS='(^|/)\.env$|(^|/)\.env\.local$|(^|/)id_(rsa|ed25519|ecdsa)(\.pub)?$|\.(pem|key|p12|pfx)$'
FORBIDDEN_PATHS+='|(^|/)postgres_data/|\.(xlsx|dump)$|(^|/)backup/'
FORBIDDEN_TEXT='[a-z0-9-]+\.lan([^a-z0-9.-]|$)|192\.168\.[0-9]+\.[0-9]+|BEGIN (RSA|OPENSSH|EC|DSA) PRIVATE KEY'
FORBIDDEN_TEXT+='|WEATHER_L(AT|ON)=-?[0-9]'

scan_repo() {
    local repo=$1 rc=0 hits
    hits=$(git -C "$repo" rev-list --all --objects | awk 'NF>1{print $2}' | sort -u | grep -E "$FORBIDDEN_PATHS" || true)
    if [[ -n $hits ]]; then
        echo "FAIL: forbidden paths in history (rewrite it, deleting is not enough):"
        echo "$hits" | head -40 | sed 's/^/  /'
        rc=1
    fi
    hits=$(git -C "$repo" grep -nIE "$FORBIDDEN_TEXT" HEAD -- . ':!scripts/check-public.sh' 2>/dev/null | sed 's/^HEAD://' || true)
    if [[ -n $hits ]]; then
        echo "FAIL: forbidden text in HEAD:"
        echo "$hits" | head -20 | sed 's/^/  /'
        rc=1
    fi
    [[ $rc -eq 0 ]] && echo "PASS: no .env, keys, dumps, private hosts or coordinates in $repo (all refs)"
    return $rc
}

self_test() {
    local tmp
    tmp=$(mktemp -d /tmp/check-public.XXXXXX)
    trap 'rm -rf -- "$tmp"' RETURN
    local -a g=(git -C "$tmp" -c user.name=check -c user.email=check@example.invalid -c commit.gpgsign=false)
    git init -q "$tmp"
    printf '# clean\nWEATHER_LAT=\n' > "$tmp/README.md"
    "${g[@]}" add README.md && "${g[@]}" commit -qm clean
    scan_repo "$tmp" >/dev/null || { echo 'self-test FAIL: a clean repo must pass'; return 1; }
    printf 'SECRET_KEY=x\n' > "$tmp/.env"
    "${g[@]}" add -f .env && "${g[@]}" commit -qm 'env injected'
    "${g[@]}" rm -q .env && "${g[@]}" commit -qm 'deleted (still in history)'
    if scan_repo "$tmp" >/dev/null 2>&1; then echo 'self-test FAIL: a .env in history must be refused'; return 1; fi
    rm -rf "$tmp/.git" && git init -q "$tmp" && printf 'see http://energy-consumption.lan\n' > "$tmp/README.md"
    "${g[@]}" add README.md && "${g[@]}" commit -qm 'private host'
    if scan_repo "$tmp" >/dev/null 2>&1; then echo 'self-test FAIL: a .lan host must be refused'; return 1; fi
    rm -rf "$tmp/.git" && git init -q "$tmp" && printf 'WEATHER_LAT=43.99\n' > "$tmp/README.md"
    "${g[@]}" add README.md && "${g[@]}" commit -qm 'coordinates'
    if scan_repo "$tmp" >/dev/null 2>&1; then echo 'self-test FAIL: real coordinates must be refused'; return 1; fi
    echo 'self-test PASS: clean repo accepted; .env in history, .lan host and coordinates refused'
}

[[ ${1:-} == --self-test ]] && { self_test; exit; }
scan_repo "$ROOT"
