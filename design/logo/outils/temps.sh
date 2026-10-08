#!/usr/bin/env bash
# Affiche le temps écoulé et le temps restant sur les 25 minutes.
cd "$(dirname "$0")"
[ -f .debut ] || { echo "Chronomètre non démarré (outils/.debut absent)."; exit 0; }
ecoule=$(( $(date +%s) - $(cat .debut) )); reste=$(( 25*60 - ecoule ))
printf "Écoulé : %d min %02d s — Restant : %d min %02d s\n" $((ecoule/60)) $((ecoule%60)) $((reste/60)) $((reste%60))
[ $reste -le 180 ] && echo "MOINS DE 3 MINUTES : arrête d'explorer, finalise et vérifie les livrables."
exit 0
