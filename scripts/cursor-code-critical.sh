#!/bin/bash
# For critical tasks: Cursor implements with Opus 4.5, Gemini reviews with max thinking
TASK="$1"

echo "=== Cursor implementing critical task with Opus 4.5 ==="
agent chat -m opus-4.5 -p "Implement: $TASK" --print | tee /tmp/cursor-impl.txt

echo "=== Gemini deep review with max thinking ==="
gemini -m review-deep -p "This is a CRITICAL implementation. Review exhaustively for:
- All possible bugs and logic errors
- Security vulnerabilities (OWASP Top 10)
- Performance bottlenecks
- Race conditions and edge cases
- Error handling completeness
- Best practices violations

Code to review:
$(cat /tmp/cursor-impl.txt)

Provide comprehensive, prioritized feedback." | tee /tmp/gemini-review.txt
