#!/usr/bin/env bash
# Ajoute des propositions d'agents au backlog GitHub : une issue par ligne lue
# sur stdin, dédupliquée par titre (issues ouvertes). Affiche le nombre créé.
# Usage: <lignes> | bash scripts/backlog-add.sh <label>
set -euo pipefail
LABEL="${1:?usage: backlog-add.sh <label>}"
ADDED=0
while IFS= read -r LINE; do
  [ -z "$LINE" ] && continue
  TITLE=$(printf '%s' "$LINE" | head -c 90)
  EXISTING=$(gh issue list --state open --label agent --search "$TITLE" --json number --jq '.[0].number // empty' 2>/dev/null || true)
  if [ -n "$EXISTING" ]; then
    continue
  fi
  gh issue create --title "$TITLE" --label "$LABEL" --label agent \
    --body "$(printf 'Proposé par un agent (%s) le %s.\n\n%s\n\nLe PO arbitre ce backlog chaque lundi dans le plan de la semaine.' "$LABEL" "$(date -u +%Y-%m-%d)" "$LINE")" > /dev/null
  ADDED=$((ADDED + 1))
done
echo "$ADDED"
