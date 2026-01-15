#!/bin/bash
# Implement a Linear issue with full context
LINEAR_ID="$1"
TASK_DESC="$2"
ACCEPTANCE="$3"
FILES="$4"

PROMPT="Task: [$LINEAR_ID] $TASK_DESC

## Acceptance Criteria
$ACCEPTANCE

## Relevant Files
$FILES

Follow AGENTS.md rules. Reference [$LINEAR_ID] in commits."

echo "=== Cursor Sonnet 4.5 implementing [$LINEAR_ID] ==="
agent chat -m sonnet-4.5 -p "$PROMPT" --print | tee /tmp/cursor-impl.txt
