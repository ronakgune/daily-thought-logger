#!/bin/bash
# Clean up after PR merge
# Usage: ./scripts/git-finish-feature.sh LINEAR-ID
#
# This script:
# - Removes the worktree (if exists)
# - Deletes the local branch
# - Switches to main and pulls latest
#
# Example:
#   ./scripts/git-finish-feature.sh AI-7

set -e

LINEAR_ID="$1"

if [ -z "$LINEAR_ID" ]; then
    echo "Usage: $0 LINEAR-ID"
    echo "Example: $0 AI-7"
    exit 1
fi

# Convert to lowercase for branch name
BRANCH_NAME="feature/$(echo "$LINEAR_ID" | tr '[:upper:]' '[:lower:]')"
WORKTREE_PATH="../main-project-worktrees/$(echo "$LINEAR_ID" | tr '[:upper:]' '[:lower:]')"

# Ensure we're in main-project directory
cd "$(dirname "$0")/.."

# Check if worktree exists and remove it
if git worktree list | grep -q "$WORKTREE_PATH"; then
    echo "Removing worktree at $WORKTREE_PATH..."
    git worktree remove "$WORKTREE_PATH"
    echo "✓ Worktree removed"
fi

# Switch to main branch
echo "Switching to main branch..."
git checkout main

# Delete the feature branch
if git branch --list "$BRANCH_NAME" | grep -q "$BRANCH_NAME"; then
    echo "Deleting branch $BRANCH_NAME..."
    git branch -d "$BRANCH_NAME"
    echo "✓ Branch deleted"
else
    echo "Branch $BRANCH_NAME not found locally (already deleted or never existed)"
fi

# Pull latest changes
echo "Pulling latest changes..."
git pull || echo "Note: Could not pull (no remote configured or network issue)"

echo ""
echo "✓ Cleanup complete for $LINEAR_ID"
