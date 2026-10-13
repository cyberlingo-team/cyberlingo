#!/usr/bin/env bash
# Génère une image avec Codex (OpenAI) en mode headless, dans le style des images jointes.
#
#   design/site/outils/generer-image.sh <sortie.png> "<description>" [référence…]
#
# Sans référence, joint design/site/matiere/progression/1.png et 4.png pour imposer le style
# du logo. Compter une à trois minutes par image ; plusieurs appels peuvent tourner en
# parallèle. Au plus 40 images par session (compteur dans outils/.images).
set -uo pipefail
OUTILS="$(cd "$(dirname "$0")" && pwd)"
MATIERE="$OUTILS/../matiere"
MAX=40

if [ $# -lt 2 ]; then
  echo "Usage : $0 <sortie.png> \"<description>\" [référence…]"
  exit 2
fi
sortie=$(realpath -m "$1"); desc=$2; shift 2
refs=("$@")
[ ${#refs[@]} -eq 0 ] && refs=("$MATIERE/progression/1.png" "$MATIERE/progression/4.png")

compteur="$OUTILS/.images"
n=$(( $(cat "$compteur" 2>/dev/null || echo 0) + 1 ))
if [ "$n" -gt "$MAX" ]; then
  echo "Plafond atteint : $MAX images générées pendant cette session."
  exit 1
fi
echo "$n" > "$compteur"

# Codex tourne en lecture seule dans un dossier jetable ; l'image qu'il produit est rangée dans
# ~/.codex/generated_images, d'où on la recopie.
travail=$(mktemp -d)
args=()
for r in "${refs[@]}"; do
  [ -f "$r" ] || { echo "Référence introuvable : $r"; exit 2; }
  cp "$r" "$travail/" && args+=(-i "$(basename "$r")")
done
cd "$travail"

prompt="Génère une image avec ton outil de génération d'images. Reprends EXACTEMENT le style des images jointes : dessin vectoriel à aplats, contours noirs épais, couleurs franches, petits reflets blancs simples, aucune texture, aucun dégradé réaliste. Sauf indication contraire de la description : fond blanc uni, aucun texte dans l'image. Description : $desc Réponds seulement avec le chemin de l'image générée."
echo "$prompt" | codex exec --skip-git-repo-check -s read-only "${args[@]}" - > codex.log 2>&1

img=$(grep -oE "$HOME/\.codex/generated_images/[^ ]+\.png" codex.log | tail -1)
if [ -n "$img" ] && [ -f "$img" ]; then
  mkdir -p "$(dirname "$sortie")" && cp "$img" "$sortie"
  echo "Image écrite : $sortie ($n/$MAX)"
  rm -rf "$travail"
else
  echo "Échec de la génération ($n/$MAX). Fin du journal de Codex :"
  tail -15 codex.log
  rm -rf "$travail"
  exit 1
fi
