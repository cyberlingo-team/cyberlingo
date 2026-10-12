#!/usr/bin/env bash
# Lance un agent Claude Code headless sur design/site/PROMPT.md : Opus, effort max, 60 minutes,
# puis coupure nette. L'agent travaille depuis la racine du dépôt (il y lit CLAUDE.md et
# AGENTS.md), sur la branche premiere-version. Le journal complet va dans design/site/journal.jsonl.
set -uo pipefail
RACINE="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$RACINE"

branche=$(git branch --show-current)
if [ "$branche" != "premiere-version" ]; then
  echo "Il faut être sur la branche premiere-version (actuellement : $branche)."
  exit 1
fi
if [ -n "$(git status --porcelain)" ]; then
  echo "Le dépôt a des modifications non commitées : commit-les ou range-les avant de lancer."
  git status --short
  exit 1
fi
[ -d frontend/node_modules ] || (cd frontend && npm install)
[ -d design/site/outils/node_modules ] || (cd design/site/outils && npm install)

date +%s > design/site/outils/.debut
echo "Lancement à $(date +%H:%M:%S), coupure à $(date -d '+60 min' +%H:%M:%S)."

timeout --kill-after=30s 60m \
  claude -p "Lis design/site/PROMPT.md et exécute-le entièrement." \
    --model claude-opus-5-5 --effort max --dangerously-skip-permissions \
    --output-format stream-json --verbose < /dev/null > design/site/journal.jsonl 2>&1
code=$?

# Arrête les serveurs Vite lancés par l'agent depuis frontend/, et eux seuls.
for pid in $(pgrep -f 'node_modules/.bin/vite'); do
  [ "$(readlink "/proc/$pid/cwd")" = "$RACINE/frontend" ] && kill "$pid"
done

[ $code -eq 124 ] && echo "Coupé au bout de 60 minutes." || echo "Terminé de lui-même (code $code)."
echo "Commits de l'agent :"
git log --oneline main..premiere-version
git status --short
