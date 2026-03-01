---
description: How to run terminal commands correctly (Cwd bug workaround)
---

# Running Terminal Commands — Mandatory Rule

## Problem

Antigravity's `run_command` tool returns **`CORTEX_STEP_STATUS_CANCELED`** (silently cancels commands) in two known cases:

1. **Wrong Cwd**: `Cwd` points to a subdirectory (e.g. `frontend/`, `backend/`) instead of the workspace root.
2. **Uppercase drive letter**: `Cwd = C:\dev\ai-chat-lend` (Capital C) — use lowercase `c:` instead.

Confirmed on 2026-03-01: even `git status` and `echo "test"` get cancelled with wrong Cwd or uppercase drive.

> **Fallback**: If commands still get cancelled despite correct settings, run them manually in the VS Code terminal (Ctrl+`).

## Rule

// turbo-all

**ALWAYS set `Cwd` to the workspace root directory with a LOWERCASE drive letter (e.g. `c:\`).**

If a command needs to run inside a subdirectory, use `Set-Location` (PowerShell)
or `Push-Location`/`Pop-Location` with `;` as separator (NOT `&&` — PowerShell
does not support `&&` in older versions).

```
Cwd:         c:\dev\ai-chat-lend                       ← always the root, lowercase 'c'
CommandLine: Set-Location frontend; npm run build       ← cd inline via ;
```

## Examples

### ✅ Correct

| Goal | Cwd | CommandLine |
|------|-----|-------------|
| Build frontend | `c:\dev\ai-chat-lend` | `Set-Location frontend; npm run build` |
| Install backend deps | `c:\dev\ai-chat-lend` | `Set-Location backend; npm install` |
| Git status | `c:\dev\ai-chat-lend` | `git status` |
| Run dev server | `c:\dev\ai-chat-lend` | `Set-Location frontend; npm run dev` |
| Run tests in backend | `c:\dev\ai-chat-lend` | `Set-Location backend; npm test` |
| Docker compose | `c:\dev\ai-chat-lend` | `docker compose up -d` |

### ❌ Wrong

| Goal | Cwd | Why it fails |
|------|-----|--------------|
| Build frontend | `c:\dev\ai-chat-lend\frontend` | Cwd is a subdirectory — command gets cancelled |
| Anything | `c:\dev\ai-chat-lend\backend` | Same issue |
| Using `&&` | any | PowerShell does not support `&&` — use `;` instead |

## Key Points

1. **Never** use a subdirectory path as `Cwd` in `run_command`
2. **Always** use the workspace root (the folder opened in VS Code)
3. Use `Set-Location subfolder; command` to run commands in subdirectories
4. Use `;` to chain commands in PowerShell (NOT `&&`)
5. This applies to ALL commands, not just git — the bug is in Cwd handling
