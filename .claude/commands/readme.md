---
description: Generate or update the GitHub README.md based on current codebase state
argument-hint: Optional focus area (e.g., "add PMTiles section", "update tech stack")
---

# README Generator

Generate or update the project README.md file for GitHub based on the current state of the codebase.

## Usage

```
/readme              # Full README generation/update
/readme "section"    # Update specific section only
```

## Arguments

$ARGUMENTS

---

## Process

### 1. Gather Project Information

Analyze the codebase to extract current state:

**Files to Read:**
- `CLAUDE.md` - Project guidelines and tech stack
- `agent-os/product/mission.md` - Project mission (if exists)
- `agent-os/product/roadmap.md` - Development roadmap (if exists)
- `agent-os/product/tech-stack.md` - Technology decisions (if exists)
- `package.json` - Root package info
- `apps/web/package.json` - Web app dependencies
- `pnpm-workspace.yaml` - Monorepo structure
- `.env.local.example` - Required environment variables
- `devlog.md` - Recent development progress

**Commands to Run:**
```bash
# Get monorepo structure
ls -la apps/ packages/

# Get dependency versions
cat apps/web/package.json | grep -A5 '"dependencies"'

# Check for existing README
cat README.md 2>/dev/null || echo "No README exists"
```

### 2. README Structure

Generate README with these sections:

```markdown
# Project Name

> Tagline/description

![Status Badge](badge-url) ![License](license-badge)

## Overview
- What the project does
- Key features
- Target users

## Tech Stack
| Layer | Technology |
|-------|------------|
| ... | ... |

## Quick Start

### Prerequisites
- Node.js 20+
- pnpm 9+
- etc.

### Installation
```bash
# Clone, install, configure steps
```

### Development
```bash
# How to run locally
```

## Project Structure
```
project/
├── apps/
│   ├── web/        # Description
│   └── agents/     # Description
├── packages/       # Description
└── ...
```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| ... | ... | ... |

## Features

### Feature 1
Description and screenshot/demo

### Feature 2
Description and screenshot/demo

## Roadmap
- [x] Completed items
- [ ] Planned items

## Contributing
Guidelines for contributors

## License
License information

## Acknowledgments
Credits and thanks
```

### 3. Content Guidelines

**Writing Style:**
- Clear, concise language
- Technical but accessible
- Action-oriented instructions
- Use code blocks for commands
- Include screenshots where helpful

**For MKE.dev Specifically:**
- Emphasize voice-first, AI-powered features
- Highlight Milwaukee civic focus
- Include Gemini 3 Hackathon context
- Show map/chat split interface
- Document ESRI + PMTiles integration

### 4. Update vs Create

**If README.md exists:**
1. Read current README
2. Identify sections that need updating
3. Preserve custom content user may have added
4. Update only outdated information
5. Add new sections for new features

**If no README.md:**
1. Generate complete README from scratch
2. Use all gathered information
3. Include all standard sections

### 5. Output Actions

1. Generate/update README.md content
2. Write to `/Users/tarikmoody/Documents/Projects/mkedev/README.md`
3. Show diff of changes (if updating)
4. Suggest commit message for the update

### 6. Commit Message Format

```
docs(readme): <description of changes>

- Updated sections: X, Y, Z
- Added sections: A, B
- Removed outdated: C

Co-Authored-By: Claude <noreply@anthropic.com>
```

---

## Section Templates

### For Hackathon Projects

Include:
- Hackathon name and deadline
- Demo video link (placeholder)
- Team members
- Submission requirements checklist

### For Civic Tech

Include:
- City/region focus
- Data sources (ESRI, PMTiles, etc.)
- Open data acknowledgments
- Government partnership info

### For AI Projects

Include:
- AI models used
- API requirements
- Usage limits/costs
- Responsible AI notes

---

## Quick Reference

**Badges to include:**
- Build status
- License
- Node version
- pnpm version

**Useful shields.io patterns:**
```
![Node](https://img.shields.io/badge/node-20%2B-green)
![pnpm](https://img.shields.io/badge/pnpm-9%2B-orange)
![License](https://img.shields.io/badge/license-MIT-blue)
```
