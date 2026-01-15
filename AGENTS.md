# Project: Agent Playground

## Tech Stack
- Language: TypeScript/JavaScript
- Runtime: Node.js 20+
- Package Manager: npm

## Coding Standards
- Use TypeScript with strict mode
- Use async/await (no callbacks)
- Use ES modules (import/export)
- Error handling: Always wrap async code in try/catch
- Naming: camelCase for variables/functions, PascalCase for classes/types

## File Structure
- `src/` - Source code
- `tests/` - Test files
- `scripts/` - Shell scripts and automation

## Testing Requirements
- Write tests for all new functions
- Use Jest or Vitest for testing
- Minimum 80% coverage for new code

## Git Workflow

### Branch Creation
- Use Linear's gitBranchName: `feature/ai-x`, `bugfix/ai-x`
- For parallel work: use git worktrees

### Worktree Location
- Main repo: `/agent_playground/main-project/`
- Worktrees: `/agent_playground/main-project-worktrees/{branch}/`

### Commit Format
```
type: [AI-X] short description

Optional longer description.

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
```

### Commit Types
- `feat` - New feature
- `fix` - Bug fix
- `refactor` - Code refactoring
- `docs` - Documentation
- `test` - Adding tests
- `chore` - Maintenance

### PR Requirements
- Title: `[AI-X] Description`
- Body: Include Linear issue link
- Request review before merge

### Linear Integration
- Always reference Linear issue ID in commits: `[AI-X]`
- Linear auto-links commits containing the issue identifier

## Security
- Never hardcode secrets
- Use environment variables for configuration
- Validate all user input
- Sanitize output to prevent XSS
