#!/bin/bash
# switch-project.sh - Switch active project context
#
# Usage: ./switch-project.sh <project-name>
# Example: ./switch-project.sh project2
#
# Lists available projects if no argument given

WORKSPACE="/Users/palluron/agent_playground"
PROJECTS_FILE="$WORKSPACE/.claude/projects.json"
CURRENT_FILE="$WORKSPACE/.claude/current-project.json"

# Check if projects.json exists
if [ ! -f "$PROJECTS_FILE" ]; then
    echo "Error: projects.json not found at $PROJECTS_FILE"
    exit 1
fi

# If no argument, list available projects
if [ -z "$1" ]; then
    echo "Available projects:"
    echo "==================="
    jq -r '.projects | keys[]' "$PROJECTS_FILE" | while read project; do
        desc=$(jq -r ".projects[\"$project\"].description" "$PROJECTS_FILE")
        linear=$(jq -r ".projects[\"$project\"].linear.projectName" "$PROJECTS_FILE")
        current=$(jq -r '.activeProject' "$CURRENT_FILE")
        if [ "$project" = "$current" ]; then
            echo "  * $project (ACTIVE)"
        else
            echo "    $project"
        fi
        echo "      Linear: $linear"
        echo "      $desc"
        echo ""
    done
    echo "Usage: $0 <project-name>"
    exit 0
fi

PROJECT_NAME="$1"

# Check if project exists
if ! jq -e ".projects[\"$PROJECT_NAME\"]" "$PROJECTS_FILE" > /dev/null 2>&1; then
    echo "Error: Project '$PROJECT_NAME' not found in projects.json"
    echo ""
    echo "Available projects:"
    jq -r '.projects | keys[]' "$PROJECTS_FILE"
    exit 1
fi

# Update current-project.json
cat > "$CURRENT_FILE" << EOF
{
  "activeProject": "$PROJECT_NAME",
  "setAt": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "setBy": "switch-project.sh",
  "_usage": {
    "read": "All agents read this to determine current project context",
    "write": "Updated by: project-switch command, or auto-set from Linear issue",
    "override": "Pass explicit project in command to override without changing this file"
  }
}
EOF

# Get project details for confirmation
LINEAR_PROJECT=$(jq -r ".projects[\"$PROJECT_NAME\"].linear.projectName" "$PROJECTS_FILE")
PROJECT_PATH=$(jq -r ".projects[\"$PROJECT_NAME\"].path" "$PROJECTS_FILE")

echo "✓ Switched to project: $PROJECT_NAME"
echo "  Path: $WORKSPACE/$PROJECT_PATH"
echo "  Linear Project: $LINEAR_PROJECT"
echo ""
echo "All agents will now target this project by default."
