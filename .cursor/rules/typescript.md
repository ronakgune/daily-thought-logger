---
description: TypeScript coding rules
globs: ["**/*.ts", "**/*.tsx"]
alwaysApply: true
---

# TypeScript Rules

- Use explicit types (no `any` unless absolutely necessary)
- Use interfaces for object shapes, types for unions/primitives
- Use `const` assertions for literal types
- Prefer `unknown` over `any` for untyped data
- Use optional chaining (?.) and nullish coalescing (??)
- Document public APIs with JSDoc comments
