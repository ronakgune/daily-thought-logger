#!/bin/bash
# Commit with proper format for Linear auto-linking
# Usage: ./scripts/git-commit-feature.sh LINEAR-ID TYPE "message"
#
# Types: feat, fix, refactor, docs, test, chore
#
# Examples:
#   ./scripts/git-commit-feature.sh AI-7 feat "implement user authentication"
#   ./scripts/git-commit-feature.sh AI-8 fix "handle division by zero"

set -e

LINEAR_ID="$1"
TYPE="$2"
MESSAGE="$3"

if [ -z "$LINEAR_ID" ] || [ -z "$TYPE" ] || [ -z "$MESSAGE" ]; then
    echo "Usage: $0 LINEAR-ID TYPE \"message\""
    echo ""
    echo "Types: feat, fix, refactor, docs, test, chore"
    echo ""
    echo "Example: $0 AI-7 feat \"implement user authentication\""
    exit 1
fi

# Validate commit type
case "$TYPE" in
    feat|fix|refactor|docs|test|chore)
        ;;
    *)
        echo "Error: Invalid type '$TYPE'"
        echo "Valid types: feat, fix, refactor, docs, test, chore"
        exit 1
        ;;
esac

# Stage all changes
git add .

# Commit with proper format
git commit -m "$TYPE: [$LINEAR_ID] $MESSAGE

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"

echo ""
echo "✓ Committed: $TYPE: [$LINEAR_ID] $MESSAGE"
echo ""
echo "Linear will auto-link this commit to issue $LINEAR_ID"
