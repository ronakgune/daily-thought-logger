#!/bin/bash
# Parallel implementation with Cursor: Sonnet codes, Opus reviews
TASK1="$1"
TASK2="$2"

echo "=== Phase 1: Parallel Implementation with Sonnet 4.5 ==="
agent chat -m sonnet-4.5 -p "$TASK1" --print > /tmp/cursor-task1.txt &
agent chat -m sonnet-4.5 -p "$TASK2" --print > /tmp/cursor-task2.txt &
wait

echo ""
echo "=== Phase 2: Parallel Reviews with Opus 4.5 ==="
agent chat -m opus-4.5 -p "Review this implementation:

$(cat /tmp/cursor-task1.txt)

Provide specific feedback." --print > /tmp/cursor-review1.txt &

agent chat -m opus-4.5 -p "Review this implementation:

$(cat /tmp/cursor-task2.txt)

Provide specific feedback." --print > /tmp/cursor-review2.txt &
wait

echo ""
echo "=== Results ==="
echo "Task 1 Code: /tmp/cursor-task1.txt"
echo "Task 1 Review: /tmp/cursor-review1.txt"
echo "Task 2 Code: /tmp/cursor-task2.txt"
echo "Task 2 Review: /tmp/cursor-review2.txt"
