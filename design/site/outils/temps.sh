#!/usr/bin/env bash
# Temps écoulé et temps restant sur les 60 minutes de la session.
DUREE=$((60 * 60))
debut=$(cat "$(dirname "$0")/.debut" 2>/dev/null) || { echo "Pas d'heure de départ (outils/.debut absent)."; exit 1; }
ecoule=$(( $(date +%s) - debut ))
reste=$(( DUREE - ecoule ))
printf 'Écoulé : %d min %02d s — Reste : %d min %02d s\n' $((ecoule / 60)) $((ecoule % 60)) $((reste / 60)) $((reste % 60))
if [ $reste -le 600 ]; then
  echo "MOINS DE 10 MINUTES : n'ajoute plus rien. Finis, vérifie que npm run build passe, commit, écris NOTE.md."
fi
