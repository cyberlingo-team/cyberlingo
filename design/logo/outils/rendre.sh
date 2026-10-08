#!/usr/bin/env bash
# Rend un fichier SVG ou HTML en PNG avec Chrome headless, pour pouvoir le regarder.
# Usage : outils/rendre.sh <entrée.svg|entrée.html> <sortie.png> [largeur=1024] [hauteur=largeur] [fond=#ffffff]
set -euo pipefail
[ $# -ge 2 ] || { echo "Usage : $0 <entrée.svg|.html> <sortie.png> [largeur] [hauteur] [fond]"; exit 1; }
entree=$(readlink -f "$1"); sortie=$2; l=${3:-1024}; h=${4:-$l}; fond=${5:-#ffffff}
[ -f "$entree" ] || { echo "Fichier introuvable : $1"; exit 1; }
mkdir -p "$(dirname "$sortie")"; sortie=$(readlink -f "$sortie")
cible="file://$entree"
if [[ "$entree" == *.svg ]]; then
  enveloppe=$(mktemp --suffix=.html)
  printf '<html><body style="margin:0;background:%s;display:grid;place-items:center;height:100vh"><img src="file://%s" style="width:92vw;height:92vh;object-fit:contain"></body></html>' "$fond" "$entree" > "$enveloppe"
  cible="file://$enveloppe"
fi
google-chrome --headless=new --disable-gpu --hide-scrollbars --virtual-time-budget=3000 \
  --window-size="$l,$h" --screenshot="$sortie" "$cible" >/dev/null 2>&1
[ -n "${enveloppe:-}" ] && rm -f "$enveloppe"
[ -s "$sortie" ] && echo "Rendu : $sortie (${l}x${h})" || { echo "Échec du rendu"; exit 1; }
