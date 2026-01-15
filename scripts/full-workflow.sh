#!/bin/bash
# Full workflow: Plan → Implement → Cross-Review → PR Sign-off
TASK="$1"

echo "=== Step 1: Planning (Claude Opus) ==="
echo "Claude Code handles this via orchestrator or plan mode"

echo "=== Step 2: Implementation ==="
./scripts/cursor-code-gemini-review.sh "$TASK"

echo "=== Step 3: PR Sign-off ==="
echo "Run: claude -p 'Use pr-signoff agent to review the changes'"
