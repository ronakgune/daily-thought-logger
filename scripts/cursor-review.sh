#!/bin/bash
# Review implementation against Linear acceptance criteria
LINEAR_ID="$1"
ACCEPTANCE="$2"

PROMPT="Review implementation for [$LINEAR_ID]:

## Changes
$(git diff)

## Acceptance Criteria
$ACCEPTANCE

Verify all criteria are met. Check for bugs, security issues, and best practices."

echo "=== Cursor Opus 4.5 reviewing [$LINEAR_ID] ==="
agent chat -m opus-4.5 -p "$PROMPT" --print | tee /tmp/cursor-review.txt
