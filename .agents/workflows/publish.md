---
description: How to correctly commit and publish changes
---

// turbo-all

# Publishing Changes

Follow these steps to safely build, commit, and push your changes.

## 1. Verify Build
Always ensure the project builds before pushing.
```powershell
Set-Location frontend; npm run build
```

## 2. Commit and Push
Use the correct commit format: `feat:`, `fix:`, `chore:`, or `docs:`.
**CRITICAL**: Always use `Cwd: c:\dev\ai-chat-lend` (LOWERCASE 'c').

```powershell
git add .
git commit -m "feat: your description"
git push
```

## Key Rules from AGENTS.md
- **Cwd**: Always project root with **lowercase** drive letter and **forward slashes** (`c:/dev/ai-chat-lend`).
- **Separator**: Use `;` (NOT `&&`).
- **Automatic Deploy**: Pushing to `main` triggers GitHub Actions.
