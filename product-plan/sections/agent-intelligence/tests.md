# Agent Intelligence — Test Instructions

Use test-driven development (TDD) to implement this section. Write tests first, then implement to make them pass.

## Unit Tests

### AgentActivityIndicator Component
- [ ] Renders "Analyzing your question..." header when processing
- [ ] Shows progress bar for each active agent
- [ ] Progress bar animates smoothly from 0 to 100%
- [ ] Shows agent name next to each progress bar
- [ ] Shows checkmark when agent completes
- [ ] Hides when `isProcessing` is false

### AgentCard Component
- [ ] Renders agent icon/avatar
- [ ] Displays agent name
- [ ] Shows brief description of specialty
- [ ] Displays status indicator (idle/active/completed)
- [ ] Status indicator has correct color per state
- [ ] Calls `onClick` when card is clicked

### AgentRoster Component
- [ ] Renders all 6 agent cards
- [ ] Shows grid layout on desktop
- [ ] Stacks to single column on mobile
- [ ] Filters by status when filter prop provided
- [ ] Shows count badge for active agents

### AgentContributorsPanel Component
- [ ] Renders collapsed by default
- [ ] Shows "Sources & Contributors" header
- [ ] Expands when header clicked
- [ ] Lists all contributing agents when expanded
- [ ] Each contribution shows agent name and finding
- [ ] Each contribution shows source citations
- [ ] Calls `onSourceClick` when citation clicked

### SourceCitation Component
- [ ] Displays document title
- [ ] Shows excerpt text
- [ ] Shows page number if available
- [ ] Renders as clickable link
- [ ] Truncates long excerpts with ellipsis

## Integration Tests

### Query Processing Flow
- [ ] Activity indicator appears when query starts
- [ ] Relevant agents activate based on query type
- [ ] Progress bars update in real-time
- [ ] Completed agents show checkmarks
- [ ] Indicator hides when all agents complete

### Contributors Panel Flow
- [ ] Panel appears on assistant messages
- [ ] Clicking panel header expands it
- [ ] All contributing agents are listed
- [ ] Citations link to knowledge base documents
- [ ] Panel remembers expanded state per message

### Real-time Progress Flow
- [ ] WebSocket/SSE connection established
- [ ] Progress updates arrive in real-time
- [ ] UI updates without page refresh
- [ ] Connection errors show graceful fallback
- [ ] Reconnection happens automatically

## Edge Cases

- [ ] Single agent query shows just that agent
- [ ] Query with no agents shows appropriate message
- [ ] Very long finding text truncates correctly
- [ ] Agent error state shows error indicator
- [ ] Slow agent doesn't block UI
- [ ] Disconnection during processing shows status

## Animation Tests

- [ ] Progress bars animate at consistent speed
- [ ] Checkmark appears with fade-in animation
- [ ] Panel expand/collapse is smooth
- [ ] No animation jank on mobile
- [ ] Animations respect prefers-reduced-motion

## Accessibility Tests

- [ ] Activity indicator has ARIA live region
- [ ] Agent cards are keyboard focusable
- [ ] Panel expand/collapse is keyboard accessible
- [ ] Progress bars have ARIA progress role
- [ ] Source citations are properly labeled
- [ ] Status changes announced to screen reader
