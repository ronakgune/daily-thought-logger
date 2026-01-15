# Quick Start Guide

## 🎯 Main Workflow

**Cursor Agent as primary executor:**
- Sonnet 4.5 codes
- Opus 4.5 reviews
- Gemini fallback when quota exhausted

## 🚀 Three Ways to Use

### 1. Via Scripts (Easiest)

```bash
# Standard workflow
./scripts/cursor-code-and-review.sh "implement login feature"

# Critical features (deep review)
./scripts/cursor-critical.sh "implement payment processing"

# Parallel tasks
./scripts/cursor-parallel.sh "frontend task" "backend task"

# Fallback (quota exhausted)
./scripts/fallback-gemini.sh "your task"
```

### 2. Via Claude Code Orchestrator

```
Use the orchestrator to implement user authentication
```

Claude will:
1. Call Cursor Sonnet 4.5 to code
2. Call Cursor Opus 4.5 to review
3. Return results

### 3. Direct CLI

```bash
# Code with Sonnet 4.5
agent chat -m sonnet-4.5 -p "implement feature" --print

# Review with Opus 4.5
agent chat -m opus-4.5 -p "review this: $(cat file.ts)" --print

# Critical review with Opus Thinking
agent chat -m opus-4.5-thinking -p "deep review: $(cat critical.ts)" --print
```

## 📊 Model Selection

| Task | Model | Why |
|------|-------|-----|
| Implementation | `sonnet-4.5` | Fast, cost-effective |
| Code Review | `opus-4.5` | Better bug detection |
| Critical Review | `opus-4.5-thinking` | Maximum reasoning |
| Fallback | Gemini | When Cursor quota out |

## 🔧 Common Commands

```bash
# Check Cursor status
agent status

# List models
agent models

# List sessions
agent ls

# Resume latest session
agent resume
```

## ✅ Workflow Example

```bash
# 1. Standard feature
./scripts/cursor-code-and-review.sh "implement user profile"

# 2. Check results
cat /tmp/cursor-code.txt      # Implementation
cat /tmp/cursor-review.txt    # Review feedback

# 3. PR sign-off (in Claude Code)
# "Use pr-signoff agent to review the changes"
```

## 🆘 Troubleshooting

**Quota exceeded?**
```bash
./scripts/fallback-gemini.sh "your task"
```

**Not authenticated?**
```bash
agent login
```

**Check what's available:**
```bash
agent models
agent status
```

## 📁 Key Files

```
scripts/cursor-code-and-review.sh    ← Main workflow
scripts/cursor-critical.sh            ← Critical tasks
scripts/fallback-gemini.sh            ← Quota fallback
.claude/agents/orchestrator.md        ← Orchestrator config
README.md                             ← Full documentation
```

That's it! Start with `./scripts/cursor-code-and-review.sh` 🎉
