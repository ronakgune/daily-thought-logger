#!/bin/bash
# Fallback to Gemini when Cursor quota is exhausted
TASK="$1"

echo "⚠️  Using Gemini fallback (Cursor quota exhausted)"
echo ""

echo "=== Gemini implementing ==="
gemini -m code-fast -p "Implement: $TASK" | tee /tmp/gemini-code.txt

echo ""
echo "=== Gemini reviewing ==="
gemini -m review-deep -p "Review this implementation for bugs, security, and best practices:

$(cat /tmp/gemini-code.txt)

Provide specific, actionable feedback." | tee /tmp/gemini-review.txt

echo ""
echo "=== Results ==="
echo "Code: /tmp/gemini-code.txt"
echo "Review: /tmp/gemini-review.txt"
