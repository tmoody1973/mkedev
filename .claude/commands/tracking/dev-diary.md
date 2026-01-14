# Developer Diary Entry

Create or update the development log for this project.

## Usage

This command can be triggered:
- **Manually** via `/dev-diary` for summaries and milestone entries
- **Automatically** after task completion (when called by implement-tasks)

## Process

### 1. Read Current State

Read the following files to understand current progress:
- `agent-os/specs/*/tasks.md` - Find completed tasks (checked items)
- `devlog.md` - Existing log entries (if present)
- Recent git commits (last 5) for context

### 2. Determine Entry Type

Based on how this was called:
- **Manual call**: Create a summary entry with user's optional message
- **Auto call after task**: Create a task completion entry

### 3. Create/Update devlog.md

Location: `/Users/tarikmoody/Documents/Projects/mkedev/devlog.md`

Format for entries:
```markdown
## [DATE] - [ENTRY_TYPE]

### Completed
- [x] Task description (spec-name)
- [x] Another task

### Key Decisions
- Decision made and rationale

### Notes
- Any blockers, learnings, or observations

### Next Up
- [ ] Upcoming task 1
- [ ] Upcoming task 2

---
```

### 4. Entry Types

**Daily Summary** (manual `/dev-diary`):
- Summarize all work done today
- List key decisions made
- Note any blockers or issues
- Outline next priorities

**Task Completion** (auto after task):
- Log the specific task completed
- Note any implementation decisions
- Time spent if known

**Milestone** (manual `/dev-diary milestone`):
- Mark completion of a task group or phase
- Summary of what was achieved
- Demo-ready features

## Output

After creating the entry, output:
```
📝 Devlog updated: `devlog.md`

Entry type: [Daily Summary / Task Completion / Milestone]
Tasks logged: [N completed tasks]

View full log: cat devlog.md
```
