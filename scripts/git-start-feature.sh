#!/bin/bash
# Start work on a Linear issue
# Usage: ./scripts/git-start-feature.sh AI-7 [--worktree]
#
# Examples:
#   ./scripts/git-start-feature.sh AI-7           # Simple branch
#   ./scripts/git-start-feature.sh AI-7 --worktree  # Branch + worktree

set -e

LINEAR_ID="$1"
USE_WORKTREE="$2"

if [ -z "$LINEAR_ID" ]; then
    echo "Usage: $0 LINEAR-ID [--worktree]"
    echo "Example: $0 AI-7 --worktree"
    exit 1
fi

# Convert to lowercase for branch name
BRANCH_NAME="feature/$(echo "$LINEAR_ID" | tr '[:upper:]' '[:lower:]')"
WORKTREE_PATH="../main-project-worktrees/$(echo "$LINEAR_ID" | tr '[:upper:]' '[:lower:]')"

# Ensure we're in main-project directory
cd "$(dirname "$0")/.."

if [ "$USE_WORKTREE" = "--worktree" ]; then
    # Create worktree with new branch
    echo "Creating worktree for $LINEAR_ID..."
    git worktree add "$WORKTREE_PATH" -b "$BRANCH_NAME"

    echo ""
    echo "✓ Worktree created at: $WORKTREE_PATH"
    echo "✓ Branch: $BRANCH_NAME"
    echo ""
    echo "To work on this feature:"
    echo "  cd $WORKTREE_PATH"
else
    # Simple branch creation
    echo "Creating branch for $LINEAR_ID..."
    git checkout -b "$BRANCH_NAME"

    echo ""
    echo "✓ Branch created: $BRANCH_NAME"
fi

echo ""
echo "Ready to implement [$LINEAR_ID]"
