#!/bin/bash
# Parallel implementation + cross-review
CURSOR_TASK="$1"
GEMINI_TASK="$2"

echo "=== Phase 1: Parallel Implementation ==="
agent chat -m sonnet-4.5 -p "$CURSOR_TASK" --print > /tmp/cursor.txt &
gemini -p "$GEMINI_TASK" > /tmp/gemini.txt &
wait

echo "=== Phase 2: Cross-Review ==="
gemini -m review-deep -p "Review: $(cat /tmp/cursor.txt)" > /tmp/cursor-review.txt &
agent chat -m sonnet-4.5-thinking -p "Review: $(cat /tmp/gemini.txt)" --print > /tmp/gemini-review.txt &
wait

echo "=== Results ==="
echo "Cursor output: /tmp/cursor.txt"
echo "Gemini output: /tmp/gemini.txt"
echo "Cursor review: /tmp/cursor-review.txt"
echo "Gemini review: /tmp/gemini-review.txt"
