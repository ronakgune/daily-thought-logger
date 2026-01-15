#!/bin/bash
# Cursor-only workflow: Sonnet 4.5 codes, Opus 4.5 reviews
TASK="$1"

echo "=== Cursor Sonnet 4.5 implementing ==="
agent chat -m sonnet-4.5 -p "Implement: $TASK" --print | tee /tmp/cursor-code.txt

echo ""
echo "=== Cursor Opus 4.5 reviewing ==="
agent chat -m opus-4.5 -p "Review this implementation for bugs, security, and best practices:

$(cat /tmp/cursor-code.txt)

Provide specific, actionable feedback." --print | tee /tmp/cursor-review.txt

echo ""
echo "=== Results ==="
echo "Code: /tmp/cursor-code.txt"
echo "Review: /tmp/cursor-review.txt"
