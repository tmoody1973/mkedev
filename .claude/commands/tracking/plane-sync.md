# Plane.so Project Sync

Sync specs, tasks, and progress with Plane.so via the Plane MCP.

## Prerequisites

- Plane MCP server must be connected (`/mcp` to verify)
- Plane workspace and project must exist (will prompt to create if not)

## Usage

```
/plane-sync              # Sync all tasks from current spec
/plane-sync init         # Initialize Plane project for MKE.dev
/plane-sync status       # Show sync status
```

## Process

### 1. Verify Plane Connection

Use `mcp__plane__list_projects` to verify connection and find the MKE.dev project.

If no project exists, prompt user:
```
No MKE.dev project found in Plane. Create one?
- Project name: MKE.dev
- Identifier: MKE
```

### 2. Sync Mode: Init

When called with `init`:
1. Create project in Plane if not exists
2. Create a Cycle for "Foundation Week 1" (or current spec phase)
3. Create work items for each task group from `tasks.md`

Work item mapping:
```
Task Group → Work Item (Epic/Story)
Individual Task → Sub-item or Checklist
```

### 3. Sync Mode: Default (sync tasks)

When called without args:
1. Read `agent-os/specs/*/tasks.md` for current spec
2. Compare with existing Plane work items
3. Create new work items for unsynced tasks
4. Update status for completed tasks (checked in tasks.md)

Status mapping:
```
[ ] Unchecked → Backlog/Todo
[~] In Progress → In Progress
[x] Checked → Done
```

### 4. Sync Mode: Status

Show current sync state:
```
📊 Plane Sync Status

Project: MKE.dev (MKE)
Current Spec: 2026-01-13-foundation-setup

Local Tasks: 45 total
  ✅ Completed: 12
  🔄 In Progress: 3
  ⏳ Pending: 30

Plane Work Items: 12 synced
  ✅ Done: 10
  🔄 In Progress: 2

Last Sync: 2026-01-14 10:30 AM
```

## Plane MCP Tools Used

- `mcp__plane__list_projects` - Find/verify project
- `mcp__plane__create_project` - Create MKE.dev project
- `mcp__plane__list_work_items` - Get existing items
- `mcp__plane__create_work_item` - Create new items
- `mcp__plane__update_work_item` - Update status
- `mcp__plane__list_cycles` - Get sprint cycles
- `mcp__plane__create_cycle` - Create week cycles

## Work Item Template

When creating work items in Plane:
```
Name: [Task Group Name]
Description: From spec: [spec-name]

Tasks:
- [ ] Task 1
- [ ] Task 2
- [ ] Task 3

Acceptance Criteria:
[From tasks.md acceptance criteria]
```

## Output

After sync:
```
✅ Plane sync complete!

Created: 5 new work items
Updated: 3 items (status changed)
Skipped: 2 items (no changes)

View in Plane: https://app.plane.so/[workspace]/projects/[project]
```
