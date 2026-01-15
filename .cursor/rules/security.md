---
description: Security rules for all code
alwaysApply: true
---

# Security Rules

- Never log sensitive data (passwords, tokens, PII)
- Use parameterized queries (no string concatenation for SQL)
- Validate and sanitize all external input
- Use HTTPS for all external requests
- Set appropriate CORS headers
- Use secure session management
