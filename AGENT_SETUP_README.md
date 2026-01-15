# Multi-Agent Workflow Setup

Complete setup for orchestrating Claude Code, Cursor CLI, and Gemini CLI with cross-review workflows and thinking models.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    CLAUDE CODE (OPUS)                           │
│                 Orchestrator + PR Sign-off                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────┐    codes    ┌─────────────┐                   │
│  │ CURSOR CLI  │ ──────────► │ GEMINI CLI  │ reviews           │
│  │ (Sonnet/    │             │ (Gemini 3)  │                   │
│  │  Opus)      │ ◄────────── │             │                   │
│  └─────────────┘   reviews   └─────────────┘    codes          │
│                                                                 │
│              ▼                        ▼                        │
│         ┌─────────────────────────────────────┐                │
│         │     SHARED MCP CONTEXT              │                │
│         │  (filesystem, git, memory, github)  │                │
│         └─────────────────────────────────────┘                │
│                                                                 │
│                        ▼                                       │
│              ┌─────────────────┐                               │
│              │ CLAUDE AGENT    │                               │
│              │ PR Sign-off     │                               │
│              └─────────────────┘                               │
└─────────────────────────────────────────────────────────────────┘
```

## Installed Components

### 1. Claude Code Custom Agents (`.claude/agents/`)
- **plan.md** - Planning agent (Opus) for architecture decisions
- **general-purpose.md** - Implementation agent (Sonnet) for multi-step tasks
- **bash.md** - Command execution (Sonnet) for terminal operations
- **orchestrator.md** - Multi-CLI orchestrator (Opus) for cross-tool workflows
- **pr-signoff.md** - Final PR reviewer (Opus) for comprehensive sign-off

### 2. Cross-Review Scripts (`scripts/`)
- **cursor-code-gemini-review.sh** - Regular tasks (Sonnet 4.5 → Gemini 3 Pro review)
- **cursor-code-critical.sh** - Critical tasks (Opus 4.5 → Gemini 3 Pro deep review)
- **gemini-code-cursor-review.sh** - Reverse review (Gemini → Sonnet 4.5 thinking)
- **parallel-with-cross-review.sh** - Parallel execution with cross-review
- **full-workflow.sh** - Complete workflow orchestration

### 3. MCP Configuration
- **Claude Code**: `.mcp.json` - Filesystem, Git servers
- **Cursor CLI**: `~/.cursor/mcp.json` + `.cursor/mcp.json` - Filesystem, Git, Memory, GitHub
- **Gemini CLI**: `~/.gemini/settings.json` - Filesystem, Git, Memory

## Model Configuration

### Cursor CLI Models
| Model | Use Case |
|-------|----------|
| `sonnet-4.5` | Regular implementation tasks (default) |
| `opus-4.5` | Critical/complex tasks requiring max capability |
| `sonnet-4.5-thinking` | Deep code reviews with thinking |
| `opus-4.5-thinking` | Maximum reasoning for critical reviews |

**List all available models:**
```bash
agent models
```

### Gemini CLI Models & Aliases
| Alias | Model | Config | Use Case |
|-------|-------|--------|----------|
| `review-deep` | Gemini 3 Pro | `thinkingLevel: high` | Thorough code reviews |
| `review-quick` | Gemini 3 Flash | `thinkingLevel: medium` | Fast reviews |
| `code-fast` | Gemini 2.5 Flash | `thinkingBudget: 8192` | Quick implementation |

**Configuration location:** `~/.gemini/settings.json`

## Usage Guide

### 1. Using Claude Code Orchestrator

In Claude Code, invoke the orchestrator for multi-agent workflows:

```
Use the orchestrator to have Cursor implement user authentication, then have Gemini review it
```

### 2. Using Scripts Directly

**Regular task (Cursor codes, Gemini reviews):**
```bash
./scripts/cursor-code-gemini-review.sh "implement a login form"
```

**Critical task (Opus 4.5 + deep review):**
```bash
./scripts/cursor-code-critical.sh "implement payment processing"
```

**Reverse flow (Gemini codes, Cursor reviews):**
```bash
./scripts/gemini-code-cursor-review.sh "implement rate limiting middleware"
```

**Parallel execution:**
```bash
./scripts/parallel-with-cross-review.sh "implement frontend auth UI" "implement backend auth API"
```

### 3. Using Cursor CLI Directly

**Implementation:**
```bash
# Regular task with Sonnet 4.5
agent chat -m sonnet-4.5 -p "Implement user registration" --print

# Critical task with Opus 4.5
agent chat -m opus-4.5 -p "Implement secure payment processing" --print
```

**Code Review:**
```bash
# Deep review with thinking
agent chat -m sonnet-4.5-thinking -p "Review this code for security issues: $(cat auth.ts)" --print
```

### 4. Using Gemini CLI Directly

**Implementation:**
```bash
# Fast implementation
gemini -m code-fast -p "Implement a caching layer"

# Standard implementation
gemini -p "Implement user profile API"
```

**Deep Code Review:**
```bash
# Thorough review with Gemini 3 Pro (high thinking)
gemini -m review-deep -p "Review this implementation for bugs and security: $(cat payment.ts)"

# Quick review with Gemini 3 Flash
gemini -m review-quick -p "Quick sanity check: $(cat utils.ts)"
```

### 5. Using PR Sign-off Agent

After implementations and cross-reviews, use Claude Code:

```
Use pr-signoff agent to review the changes
```

This will:
1. Run `git diff main...HEAD`
2. Check code quality, security, and tests
3. Verify cross-review feedback was addressed
4. Provide APPROVED/CHANGES REQUESTED/NEEDS DISCUSSION decision

## Workflow Examples

### Example 1: Plan → Implement → Review → Sign-off

```bash
# 1. Plan in Claude Code (plan mode)
# Claude Code analyzes requirements and creates plan

# 2. Implement with Cursor
./scripts/cursor-code-gemini-review.sh "implement user authentication based on plan"

# 3. PR Sign-off in Claude Code
# Use pr-signoff agent to review the changes
```

### Example 2: Parallel Development

```bash
./scripts/parallel-with-cross-review.sh \
  "implement frontend login form with React" \
  "implement backend JWT authentication API"

# Results in:
# - /tmp/cursor.txt - Frontend implementation
# - /tmp/gemini.txt - Backend implementation
# - /tmp/cursor-review.txt - Gemini's review of frontend
# - /tmp/gemini-review.txt - Cursor's review of backend
```

### Example 3: Critical Feature with Maximum Review

```bash
# Use Opus 4.5 for implementation + Gemini 3 Pro deep review
./scripts/cursor-code-critical.sh "implement two-factor authentication"
```

## CLI Commands Reference

### Cursor CLI

```bash
# Help
agent --help

# Interactive mode
agent chat

# Non-interactive mode
agent chat -p "prompt" --print

# With specific model
agent chat -m opus-4.5 -p "task" --print

# List models
agent models

# MCP management
agent mcp list
agent mcp enable <server-name>
agent mcp disable <server-name>

# Session management
agent ls                    # List sessions
agent resume               # Resume latest
agent resume <chat-id>     # Resume specific
```

### Gemini CLI

```bash
# Help
gemini --help

# Interactive mode
gemini

# Non-interactive mode
gemini -p "prompt"

# With specific model
gemini -m review-deep -p "review code"

# Session management
gemini --resume <session-id>

# In-session commands
/memory      # Memory management
/stats       # Usage statistics
/tools       # Available tools
/mcp         # MCP server management
```

### Claude Code

```bash
# Interactive mode
claude

# Non-interactive mode
claude -p "prompt" --print

# Model selection
claude --model opus
/model opus                # In-session

# Manage agents
/agents
```

## Configuration Files

### Claude Code
- `.claude/agents/*.md` - Custom agents
- `.mcp.json` - MCP servers

### Cursor CLI
- `~/.cursor/mcp.json` - Global MCP servers
- `.cursor/mcp.json` - Project MCP servers
- `.cursor/rules/*.md` - Project rules
- `AGENTS.md` - Agent instructions
- `CLAUDE.md` - Claude-specific instructions

### Gemini CLI
- `~/.gemini/settings.json` - Global config (models, MCP, aliases)

## Model Thinking Capabilities

### Gemini 3 Thinking Levels
- **high** - Maximum reasoning (review-deep alias)
- **medium** - Balanced reasoning (review-quick alias)
- **low** - Fast responses
- **minimal** - Minimal reasoning

### Gemini 2.5 Thinking Budgets
- **16384 tokens** - Deep analysis (review-deep)
- **8192 tokens** - Standard analysis (code-fast)
- **4096 tokens** - Quick analysis (review-quick)

### Cursor Thinking Models
- **sonnet-4.5-thinking** - Deep analysis with extended reasoning
- **opus-4.5-thinking** - Maximum capability with thinking

## Tips & Best Practices

1. **Model Selection:**
   - Use Sonnet 4.5 for regular coding (cost-effective)
   - Use Opus 4.5 for critical features (maximum quality)
   - Use thinking models for reviews (better bug detection)

2. **Cross-Review:**
   - Always have one tool review another's code
   - Use thinking models for reviews
   - Address all feedback before PR sign-off

3. **MCP Servers:**
   - Shared filesystem/git servers ensure consistency
   - Memory server helps Gemini remember context
   - GitHub server enables PR operations

4. **Parallel Execution:**
   - Use for independent features
   - Cross-review results before merging
   - Check for integration issues

5. **Authentication:**
   - Cursor: `agent login`
   - Gemini: `gemini` (OAuth on first run)

## Troubleshooting

### Cursor CLI not found
```bash
# Add to PATH (already in ~/.zshrc)
export PATH="$HOME/.local/bin:$PATH"
source ~/.zshrc
```

### MCP servers not loading
```bash
# Check MCP status
agent mcp list
gemini /mcp

# Enable if needed
agent mcp enable filesystem
```

### Model not available
```bash
# List available models
agent models
gemini # Then type /help
```

## Additional Resources

- Plan file: `/Users/palluron/.claude/plans/shiny-imagining-thacker.md`
- Cursor CLI docs: https://cursor.com/docs/cli
- Gemini CLI docs: https://google-gemini.github.io/gemini-cli/
- Claude Code docs: https://code.claude.com/docs
