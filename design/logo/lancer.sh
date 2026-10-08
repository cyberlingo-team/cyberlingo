#!/usr/bin/env bash
# Lance un agent Claude Code headless sur PROMPT.md : effort max, 25 minutes, puis coupure nette.
# Le journal complet de la session est écrit dans journal.jsonl.
set -uo pipefail
cd "$(dirname "$0")"

mkdir -p livrables rendus
if [ -n "$(ls -A livrables)" ]; then
  echo "livrables/ n'est pas vide : déplace ou supprime les fichiers d'un essai précédent avant de relancer."
  exit 1
fi

date +%s > outils/.debut
echo "Lancement à $(date +%H:%M:%S), coupure à $(date -d '+25 min' +%H:%M:%S)."

timeout --kill-after=30s 25m \
  claude -p "Lis PROMPT.md et exécute-le entièrement." \
    --model opus --effort max --dangerously-skip-permissions \
    --output-format stream-json --verbose < /dev/null > journal.jsonl 2>&1
code=$?

[ $code -eq 124 ] && echo "Coupé au bout de 25 minutes." || echo "Terminé de lui-même (code $code)."
ls -la livrables
[ -f livrables/logo-mark.svg ] && outils/banc.sh
