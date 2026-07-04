#!/usr/bin/env bash
# Poste un message Block Kit sur Slack (payload JSON sur stdin). Si Slack
# rejette les blocs (invalid_blocks…), loggue le payload pour diagnostic puis
# retombe sur un message texte simple : le rapport arrive toujours.
# Usage: echo "$PAYLOAD" | slack-post-blocks.sh <channel> <fichier_texte_fallback>
set -euo pipefail
CHANNEL="${1:?channel}"
FALLBACK_FILE="${2:?fallback text file}"
PAYLOAD=$(cat)

RESP=$(curl -s -X POST https://slack.com/api/chat.postMessage \
  -H "Authorization: Bearer $SLACK_BOT_TOKEN" \
  -H "content-type: application/json; charset=utf-8" \
  --data "$PAYLOAD")
if printf '%s' "$RESP" | jq -e .ok > /dev/null 2>&1; then
  echo "posted"
  exit 0
fi

echo "slack error: $(printf '%s' "$RESP" | jq -r '.error // "unknown"') — payload (tronqué) :"
printf '%s' "$PAYLOAD" | head -c 1500
echo

TEXT=$(head -c 3500 "$FALLBACK_FILE" | iconv -f utf-8 -t utf-8 -c)
curl -s -X POST https://slack.com/api/chat.postMessage \
  -H "Authorization: Bearer $SLACK_BOT_TOKEN" \
  -H "content-type: application/json; charset=utf-8" \
  --data "$(jq -n --arg ch "$CHANNEL" --arg t "$TEXT" '{channel:$ch, text:$t}')" \
  | jq -r 'if .ok then "posted (fallback texte, sans boutons)" else "slack error (fallback): \(.error)" end'
