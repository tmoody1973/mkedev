# Conversational Interface — Test Instructions

Use test-driven development (TDD) to implement this section. Write tests first, then implement to make them pass.

## Unit Tests

### ChatInput Component
- [ ] Renders text input and send button
- [ ] Calls `onSendMessage` when send button clicked with non-empty text
- [ ] Clears input after sending
- [ ] Calls `onSendMessage` when Enter key pressed
- [ ] Does not send empty messages
- [ ] Shows voice toggle button
- [ ] Calls `onVoiceToggle` when voice button clicked

### VoiceIndicator Component
- [ ] Renders pulsing animation when `isActive` is true
- [ ] Shows waveform visualization when `isActive` is true
- [ ] Hides when `isActive` is false
- [ ] Displays transcription text when provided

### MessageBubble Component
- [ ] Renders user messages with correct styling (right-aligned)
- [ ] Renders assistant messages with correct styling (left-aligned)
- [ ] Displays timestamp correctly
- [ ] Renders generative cards when present in message

### GenerativeCards
- [ ] `ZoneInfoCard` displays zoning district name and code
- [ ] `ZoneInfoCard` shows permitted uses list
- [ ] `ParcelAnalysisCard` displays address and tax key
- [ ] `ParcelAnalysisCard` shows feasibility score with color coding
- [ ] `IncentivesSummaryCard` lists all incentive zones
- [ ] `IncentivesSummaryCard` shows benefits for each zone
- [ ] `PermitProcessCard` displays permit timeline
- [ ] `CodeCitationCard` shows source document excerpts
- [ ] All cards expand/collapse on click

### HistorySidebar Component
- [ ] Renders list of conversations
- [ ] Shows starred conversations in separate section
- [ ] Search input filters conversations by keyword
- [ ] Calls `onSelectConversation` when conversation clicked
- [ ] Calls `onStarConversation` when star icon clicked
- [ ] Toggles open/closed state

## Integration Tests

### Chat Flow
- [ ] User can type and send a message
- [ ] Message appears in chat history
- [ ] Loading indicator shows while awaiting response
- [ ] Assistant response appears with appropriate cards
- [ ] Conversation is auto-saved

### Voice Flow
- [ ] Clicking voice toggle activates voice mode
- [ ] Voice indicator shows pulsing animation
- [ ] Transcription appears in real-time
- [ ] Voice input is sent when user stops speaking
- [ ] Voice mode deactivates after sending

### History Flow
- [ ] Opening sidebar shows conversation list
- [ ] Selecting a conversation loads its messages
- [ ] Starring a conversation moves it to starred section
- [ ] Search filters conversations correctly

### Map Integration
- [ ] Clicking a parcel on map triggers contextual query
- [ ] Response includes ParcelAnalysisCard for clicked parcel
- [ ] Card includes link to highlight parcel on map

## Edge Cases

- [ ] Empty conversation history shows helpful empty state
- [ ] Very long messages truncate with "show more" option
- [ ] Network error during send shows error message
- [ ] Voice recognition failure shows error message
- [ ] Multiple rapid messages queue correctly

## Accessibility Tests

- [ ] All interactive elements are keyboard accessible
- [ ] Voice toggle has appropriate ARIA labels
- [ ] Screen reader announces new messages
- [ ] Focus management works correctly in sidebar
- [ ] Color contrast meets WCAG AA standards
