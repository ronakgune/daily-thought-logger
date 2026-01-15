#!/bin/bash
# Cursor implements (Sonnet 4.5), Gemini reviews with thinking
TASK="$1"
MODEL="${2:-sonnet-4.5}"  # Default to Sonnet 4.5, use opus-4.5 for critical

echo "=== Cursor implementing with $MODEL ==="
agent chat -m "$MODEL" -p "Implement: $TASK" --print | tee /tmp/cursor-impl.txt

echo "=== Gemini reviewing with thinking model ==="
# Uses review-deep alias (thinkingBudget: 16384) for thorough analysis
gemini -m review-deep -p "Review this implementation thoroughly for:
- Bugs and logic errors
- Security vulnerabilities
- Performance issues
- Best practices violations
- Edge cases

Code to review:
$(cat /tmp/cursor-impl.txt)

Provide specific, actionable feedback." | tee /tmp/gemini-review.txt
