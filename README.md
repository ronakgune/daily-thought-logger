# Multi-Agent Workflow Setup

**Cursor-Primary Setup**: Cursor Agent as the main executor, Gemini as fallback

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    CLAUDE CODE (OPUS)                           │
│              Orchestrator + PR Sign-off                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│              ┌─────────────────────┐                            │
│              │   CURSOR AGENT      │                            │
│              │  (Primary Executor) │                            │
│              ├─────────────────────┤                            │
│              │ Sonnet 4.5 → Codes  │                            │
│              │ Opus 4.5 → Reviews  │                            │
│              └─────────────────────┘                            │
│                        │                                        │
│                        ▼                                        │
│              ┌─────────────────────┐                            │
│              │   GEMINI CLI        │                            │
│              │   (Fallback Only)   │                            │
│              │  Quota Exhausted    │                            │
│              └─────────────────────┘                            │
│                                                                 │
│              ▼                        ▼                        │
│         ┌─────────────────────────────────────┐                │
│         │     SHARED MCP CONTEXT              │                │
│         │  (filesystem, git, memory, github)  │                │
│         └─────────────────────────────────────┘                │
│                                                                 │
│                        ▼                                       │
│              ┌─────────────────┐                               │
│              │ CLAUDE PR       │                               │
│              │ Sign-off Agent  │                               │
│              └─────────────────┘                               │
└─────────────────────────────────────────────────────────────────┘
```

## Installed Components

### 1. Claude Code Custom Agents (`.claude/agents/`)
- **plan.md** - Opus for planning & architecture
- **general-purpose.md** - Sonnet for implementation
- **bash.md** - Sonnet for commands
- **orchestrator.md** - Opus for Cursor workflow coordination
- **pr-signoff.md** - Opus for final PR review

### 2. Cursor-Primary Scripts (`scripts/`)
- **cursor-code-and-review.sh** - Standard workflow (Sonnet codes → Opus reviews)
- **cursor-critical.sh** - Critical tasks (Sonnet codes → Opus Thinking reviews)
- **cursor-parallel.sh** - Parallel tasks with reviews
- **fallback-gemini.sh** - Fallback when Cursor quota exhausted

### 3. Old Cross-Tool Scripts (Archived)
- `cursor-code-gemini-review.sh` - Old cross-tool workflow
- `gemini-code-cursor-review.sh` - Old reverse workflow
- `parallel-with-cross-review.sh` - Old parallel cross-tool
*(Keep for reference, but use new Cursor-only scripts)*

## Model Strategy

### Cursor Agent (Primary)

| Model | Use Case | Cost |
|-------|----------|------|
| `sonnet-4.5` | Implementation, coding | Lower |
| `opus-4.5` | Code reviews, analysis | Higher |
| `opus-4.5-thinking` | Critical reviews with deep reasoning | Highest |

**Cursor models available:**
```bash
agent models
```

### Gemini (Fallback Only)

**Use ONLY when Cursor quota exhausted:**
- `code-fast` - Implementation (Gemini 2.5 Flash)
- `review-deep` - Reviews (Gemini 3 Pro with high thinking)

## Quick Start

### 1. Standard Workflow (Recommended)

```bash
./scripts/cursor-code-and-review.sh "implement user authentication"
```

**What happens:**
1. Cursor Sonnet 4.5 implements the feature
2. Cursor Opus 4.5 reviews the code
3. Results saved to `/tmp/cursor-code.txt` and `/tmp/cursor-review.txt`

### 2. Critical Feature Workflow

```bash
./scripts/cursor-critical.sh "implement payment processing"
```

**What happens:**
1. Cursor Sonnet 4.5 implements
2. Cursor Opus 4.5 **Thinking** does deep review
3. Extended reasoning for security-critical code

### 3. Parallel Development

```bash
./scripts/cursor-parallel.sh "implement login UI" "implement auth API"
```

**What happens:**
1. Two Sonnet 4.5 instances implement in parallel
2. Two Opus 4.5 instances review in parallel
3. 4 result files generated

### 4. Fallback to Gemini

```bash
./scripts/fallback-gemini.sh "implement caching layer"
```

**Use when:** Cursor quota exhausted, need to keep working

## Usage with Claude Code Orchestrator

### Invoke via Claude Code

```
Use the orchestrator to have Cursor implement a calculator function
```

**What Claude does:**
1. Calls Cursor Sonnet 4.5 to code
2. Calls Cursor Opus 4.5 to review
3. Reports results back to you

### For critical features:

```
Use the orchestrator to implement secure password reset (CRITICAL)
```

**Claude will use Opus 4.5 Thinking for review**

## Direct CLI Usage

### Cursor Agent

**Implementation:**
```bash
agent chat -m sonnet-4.5 -p "Implement user registration" --print
```

**Code Review:**
```bash
agent chat -m opus-4.5 -p "Review this code: $(cat auth.ts)" --print
```

**Critical Review:**
```bash
agent chat -m opus-4.5-thinking -p "CRITICAL: Review for security: $(cat payment.ts)" --print
```

### Check Cursor Status

```bash
agent status              # Check authentication
agent models              # List available models
agent ls                  # List chat sessions
```

## Workflow Examples

### Example 1: Feature Development

```bash
# 1. Plan in Claude Code
# (Claude analyzes requirements)

# 2. Implement & Review
./scripts/cursor-code-and-review.sh "implement user profile API"

# 3. PR Sign-off in Claude Code
# Use pr-signoff agent to review the changes
```

### Example 2: Critical Security Feature

```bash
# Use critical workflow for security-sensitive code
./scripts/cursor-critical.sh "implement OAuth2 authentication flow"

# Opus 4.5 Thinking will do exhaustive security analysis
```

### Example 3: Quota Management

```bash
# Try Cursor first
./scripts/cursor-code-and-review.sh "implement data validation"

# If quota exceeded (error), fallback to Gemini
./scripts/fallback-gemini.sh "implement data validation"
```

## Configuration Files

### Claude Code
- `.claude/agents/*.md` - Custom agents
- `.mcp.json` - MCP servers (filesystem, git)

### Cursor CLI
- `~/.cursor/mcp.json` - Global MCP (filesystem, git, memory, GitHub)
- `.cursor/mcp.json` - Project MCP (filesystem, git)
- `.cursor/rules/*.md` - Project rules (optional)
- `AGENTS.md` / `CLAUDE.md` - Agent instructions (optional)

### Gemini CLI (Fallback)
- `~/.gemini/settings.json` - Models, MCP, aliases

## Tips & Best Practices

### 1. Use Sonnet 4.5 for Coding
- Fast and cost-effective
- High quality for implementation
- Save Opus for reviews

### 2. Use Opus 4.5 for Reviews
- Better at finding bugs
- Deeper security analysis
- Worth the cost for quality assurance

### 3. Use Opus Thinking for Critical Code
- Payment processing
- Authentication systems
- Security-sensitive features
- Complex business logic

### 4. Monitor Quota
- Check `agent status` periodically
- Have Gemini ready as fallback
- Plan critical work when quota is fresh

### 5. PR Sign-off is Final
- Always run pr-signoff agent before merging
- It checks both code and review feedback
- Final gate for quality

## Troubleshooting

### Cursor quota exceeded
```bash
# Use Gemini fallback
./scripts/fallback-gemini.sh "your task"
```

### Cursor not authenticated
```bash
agent login
```

### Check authentication status
```bash
agent status
```

### MCP servers not loading
```bash
agent mcp list
agent mcp enable filesystem
agent mcp enable git
```

## CLI Commands Reference

### Cursor Agent

```bash
# Help
agent --help

# Models
agent models                           # List available
agent chat -m sonnet-4.5 "task"       # Use specific model

# Sessions
agent ls                               # List sessions
agent resume                          # Resume latest
agent resume <chat-id>                # Resume specific

# MCP
agent mcp list                        # List MCP servers
agent mcp enable <server>             # Enable server
```

### Claude Code

```bash
# Orchestrator
Use the orchestrator to <task>

# PR Sign-off
Use pr-signoff agent to review changes

# Agents
/agents                               # Manage agents
```

## Files Created

```
.claude/agents/
├── plan.md
├── general-purpose.md
├── bash.md
├── orchestrator.md
└── pr-signoff.md

scripts/
├── cursor-code-and-review.sh       # Main workflow
├── cursor-critical.sh               # Critical features
├── cursor-parallel.sh               # Parallel tasks
└── fallback-gemini.sh               # Fallback
```

## Verified Workflow ✅

**Successfully tested on 2026-01-14** - See [WORKFLOW_TEST_RESULTS.md](WORKFLOW_TEST_RESULTS.md) for details

### Test Case: AI-5 Calculator Implementation

**Complete workflow from Linear issue → Implementation → Review → Status update:**

1. **Created Linear issue** (AI-5) via Linear MCP
2. **Cursor Sonnet 4.5** implemented calculator in ~30s
   - Created `src/calculator.ts` with all functions
   - Created comprehensive tests
   - Followed all AGENTS.md standards automatically
3. **Cursor Opus 4.5** reviewed implementation in ~25s
   - Verified all 7 acceptance criteria
   - Identified code quality as "Excellent"
   - Suggested optional improvements
4. **Updated Linear** status: Backlog → In Progress → In Review

**Total workflow time:** ~1 minute

**Key Success Factors:**
- ✅ AGENTS.md provided automatic context (no manual specs needed)
- ✅ Linear MCP tracked entire workflow
- ✅ Sonnet 4.5 produced high-quality implementation
- ✅ Opus 4.5 provided thorough review
- ✅ All project standards automatically followed

## What Changed from Original Setup

**Before:** Cursor and Gemini both as primary executors with cross-review

**Now:**
- ✅ Cursor as primary (Sonnet codes, Opus reviews)
- ✅ Gemini as fallback only (quota exhausted)
- ✅ Simpler, more cost-effective
- ✅ Better quality (Opus reviews everything)

## Next Steps

1. **Test the setup:**
   ```bash
   ./scripts/cursor-code-and-review.sh "create a hello world function"
   ```

2. **Use via Claude Code:**
   ```
   Use the orchestrator to implement a calculator
   ```

3. **For critical work:**
   ```bash
   ./scripts/cursor-critical.sh "your critical task"
   ```

Enjoy your streamlined multi-agent workflow! 🚀
