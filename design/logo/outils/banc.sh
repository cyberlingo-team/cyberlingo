#!/usr/bin/env bash
# Banc d'essai : montre livrables/logo-mark.svg (et logo.svg s'il existe) à toutes les tailles,
# sur fond clair et sombre, en silhouette, et en favicon dans un onglet. Résultat : rendus/banc.png
set -euo pipefail
cd "$(dirname "$0")/.."
[ -f livrables/logo-mark.svg ] || { echo "livrables/logo-mark.svg n'existe pas encore."; exit 1; }
outils/rendre.sh outils/banc.html rendus/banc.png 1500 940
