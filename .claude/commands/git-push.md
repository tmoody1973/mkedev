# Git Commit and Push

Commit staged changes and push to GitHub.

**Repository:** https://github.com/tmoody1973/mkedev

## Usage

```
/git-push                    # Auto-generate commit message from changes
/git-push "commit message"   # Use provided commit message
```

## Process

### 1. Check Current State

Run these commands to understand what needs to be committed:
```bash
git status
git diff --stat
```

### 2. Stage Changes

If there are unstaged changes, stage them appropriately:
- Stage all changes: `git add -A`
- Or stage specific files if user indicates

**Do NOT stage:**
- `.env` or `.env.local` files
- `node_modules/`
- `.DS_Store`
- Any files with secrets/credentials

### 3. Generate Commit Message

If no message provided, generate one based on changes:

**Format:**
```
<type>(<scope>): <short description>

<body - what changed and why>

Co-Authored-By: Claude <noreply@anthropic.com>
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Formatting, styling
- `refactor`: Code restructuring
- `test`: Adding tests
- `chore`: Maintenance, config

**Scopes for MKE.dev:**
- `monorepo`: Project structure
- `convex`: Database/backend
- `clerk`: Authentication
- `mapbox`: Map integration
- `esri`: ESRI layers
- `chat`: Chat panel
- `ui`: UI components
- `docs`: Documentation

### 4. Commit and Push

```bash
git commit -m "$(cat <<'EOF'
<commit message here>

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"

git push origin main
```

If push fails due to upstream changes:
```bash
git pull --rebase origin main
git push origin main
```

### 5. Confirm Success

After push, output:
```
✅ Pushed to GitHub!

Commit: <short hash> - <message summary>
Branch: main
Remote: https://github.com/tmoody1973/mkedev

View: https://github.com/tmoody1973/mkedev/commits/main
```

## Safety Rules

- NEVER force push (`--force`) unless explicitly requested
- NEVER commit `.env` files or secrets
- ALWAYS include Co-Authored-By for Claude contributions
- CHECK for uncommitted changes before operations
- WARN if pushing to main with large changes (suggest PR instead)
