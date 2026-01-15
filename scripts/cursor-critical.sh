#!/bin/bash
# Critical tasks: Sonnet 4.5 codes, Opus 4.5 Thinking reviews deeply
TASK="$1"

echo "=== Cursor Sonnet 4.5 implementing critical task ==="
agent chat -m sonnet-4.5 -p "Implement: $TASK" --print | tee /tmp/cursor-code.txt

echo ""
echo "=== Cursor Opus 4.5 Thinking - DEEP REVIEW ==="
agent chat -m opus-4.5-thinking -p "CRITICAL REVIEW - Analyze exhaustively:

$(cat /tmp/cursor-code.txt)

Check for:
- All possible bugs and edge cases
- Security vulnerabilities (OWASP Top 10)
- Performance issues and bottlenecks
- Race conditions and concurrency issues
- Error handling completeness
- Best practices violations
- Code maintainability

Provide prioritized, comprehensive feedback with specific examples." --print | tee /tmp/cursor-review.txt

echo ""
echo "=== Results ==="
echo "Code: /tmp/cursor-code.txt"
echo "Review: /tmp/cursor-review.txt"
