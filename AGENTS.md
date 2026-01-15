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

## Git Conventions
- Conventional commits: feat:, fix:, refactor:, docs:, test:
- Branch naming: feature/*, bugfix/*, hotfix/*
- Always reference Linear issue ID in commits: [LIN-123]

## Security
- Never hardcode secrets
- Use environment variables for configuration
- Validate all user input
- Sanitize output to prevent XSS
