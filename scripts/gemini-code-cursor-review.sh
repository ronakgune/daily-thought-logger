#!/bin/bash
# Gemini implements, Cursor reviews with Sonnet 4.5 thinking
TASK="$1"

echo "=== Gemini implementing ==="
gemini -p "Implement: $TASK" | tee /tmp/gemini-impl.txt

echo "=== Cursor reviewing with Sonnet 4.5 thinking ==="
agent chat -m sonnet-4.5-thinking -p "Review this implementation thoroughly for:
- Bugs and logic errors
- Security vulnerabilities
- Performance issues
- Best practices violations
- Edge cases

Code to review:
$(cat /tmp/gemini-impl.txt)

Provide specific, actionable feedback." --print | tee /tmp/cursor-review.txt
