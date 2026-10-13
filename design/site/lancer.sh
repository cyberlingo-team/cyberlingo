#!/usr/bin/env bash
# Lance un agent Claude Code headless sur design/site/PROMPT.md, sans limite de temps.
# Usage : design/site/lancer.sh [effort], effort = max par défaut (low|medium|high|xhigh|max).
# L'agent travaille depuis la racine du dépôt (il y lit CLAUDE.md et AGENTS.md), sur la branche
# version-tux. Le journal complet va dans design/site/journal.jsonl.
set -uo pipefail
EFFORT="${1:-max}"
BRANCHE=version-tux
RACINE="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$RACINE"

branche=$(git branch --show-current)
if [ "$branche" != "$BRANCHE" ]; then
  echo "Il faut être sur la branche $BRANCHE (actuellement : $branche)."
  exit 1
fi
if [ -n "$(git status --porcelain)" ]; then
  echo "Le dépôt a des modifications non commitées : commit-les ou range-les avant de lancer."
  git status --short
  exit 1
fi
[ -d frontend/node_modules ] || (cd frontend && npm install)
[ -d design/site/outils/node_modules ] || (cd design/site/outils && npm install)

rm -f design/site/outils/.images
debut=$(date +%s)
echo "Lancement à $(date +%H:%M:%S) en effort $EFFORT, sans limite de temps."

claude -p "Lis design/site/PROMPT.md et exécute-le entièrement." \
  --model claude-opus-5-5 --effort "$EFFORT" --dangerously-skip-permissions \
  --output-format stream-json --verbose < /dev/null > design/site/journal.jsonl 2>&1
code=$?

# Arrête les serveurs Vite lancés par l'agent depuis frontend/, et eux seuls.
for pid in $(pgrep -f 'node_modules/.bin/vite'); do
  [ "$(readlink "/proc/$pid/cwd")" = "$RACINE/frontend" ] && kill "$pid"
done

echo "Terminé (code $code) au bout de $(( ($(date +%s) - debut) / 60 )) minutes."
echo "Images générées : $(cat design/site/outils/.images 2>/dev/null || echo 0)."
echo "Commits de l'agent :"
git log --oneline "main..$BRANCHE"
git status --short
