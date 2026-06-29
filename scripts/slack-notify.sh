#!/usr/bin/env bash
# Posts a plain-text progress message to Slack.
# Env: SLACK_BOT_TOKEN, CHANNEL, THREAD_TS (optional). Arg $1: message text.
set -euo pipefail

[ -z "${SLACK_BOT_TOKEN:-}" ] && exit 0
[ -z "${CHANNEL:-}" ] && exit 0

PAYLOAD=$(jq -n --arg ch "$CHANNEL" --arg tts "${THREAD_TS:-}" --arg txt "$1" \
  '{channel:$ch, text:$txt} | if $tts=="" then . else . + {thread_ts:$tts} end')

curl -s -X POST https://slack.com/api/chat.postMessage \
  -H "Authorization: Bearer $SLACK_BOT_TOKEN" \
  -H "content-type: application/json; charset=utf-8" \
  --data "$PAYLOAD" > /dev/null
