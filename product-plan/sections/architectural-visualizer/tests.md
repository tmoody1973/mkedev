# Architectural Visualizer — Test Instructions

Use test-driven development (TDD) to implement this section. Write tests first, then implement to make them pass.

## Unit Tests

### VisionCard Component
- [ ] Renders parcel address header with pin icon
- [ ] Displays generated visualization image
- [ ] Shows before/after toggle control
- [ ] Displays building specs (style, type, sq ft)
- [ ] Shows compliance indicators with checkmarks/X
- [ ] Renders action buttons (Try Another Style, Save, Share)
- [ ] Calls `onTryAnother` when button clicked
- [ ] Calls `onSave` when Save button clicked
- [ ] Calls `onShare` when Share button clicked

### PromptInput Component
- [ ] Renders text input field
- [ ] Shows placeholder text with example prompt
- [ ] Renders voice input button
- [ ] Calls `onSubmit` when Enter pressed
- [ ] Calls `onSubmit` when generate button clicked
- [ ] Calls `onVoiceStart` when voice button clicked
- [ ] Disables input while generating

### PresetSelector Component
- [ ] Renders building type dropdown/buttons
- [ ] Renders style dropdown/buttons
- [ ] Renders stories slider/picker (1-6)
- [ ] Calls `onChange` when building type selected
- [ ] Calls `onChange` when style selected
- [ ] Calls `onChange` when stories changed
- [ ] Shows current selections

### CompliancePanel Component
- [ ] Displays maximum height allowed
- [ ] Shows proposed height from generation
- [ ] Shows height compliance status (check/X)
- [ ] Displays setback requirements (front, side, rear)
- [ ] Shows proposed setbacks
- [ ] Shows setback compliance for each
- [ ] Displays lot coverage limit
- [ ] Shows proposed lot coverage
- [ ] Shows lot coverage compliance
- [ ] Shows design overlay notes if applicable

### GenerationStatus Component
- [ ] Renders thinking animation when generating
- [ ] Shows progress message ("Generating your vision...")
- [ ] Hides when generation complete
- [ ] Shows error state if generation fails

### BeforeAfterToggle Component
- [ ] Renders toggle control (slider or buttons)
- [ ] Shows "Before" label
- [ ] Shows "After" label
- [ ] Toggles between before and after images
- [ ] Calls `onChange` when toggled
- [ ] Animates transition smoothly

## Integration Tests

### Generation Flow
- [ ] User enters natural language prompt
- [ ] User selects presets (optional)
- [ ] System shows generation indicator
- [ ] Generated image appears in VisionCard
- [ ] Compliance check runs automatically
- [ ] Compliance panel shows results

### Before/After Flow
- [ ] Before image shows street view
- [ ] After image shows generated rendering
- [ ] Toggle switches between views
- [ ] Transition is smooth (fade or slide)

### Regeneration Flow
- [ ] Clicking "Try Another Style" opens options
- [ ] User can change style preset
- [ ] Regeneration starts with new options
- [ ] New image replaces previous
- [ ] Compliance updates for new design

### Save/Share Flow
- [ ] Save button persists visualization
- [ ] Share button generates shareable link
- [ ] Share link opens visualization in new context
- [ ] Saved visualizations appear in history

## Edge Cases

- [ ] Very long prompts truncate gracefully
- [ ] Generation timeout shows error message
- [ ] Invalid parcel shows error state
- [ ] Non-compliant design shows clear warnings
- [ ] Missing street view shows placeholder
- [ ] Regeneration preserves some context

## Performance Tests

- [ ] Generation starts within 1 second of request
- [ ] Before/after toggle is instant
- [ ] Image loads progressively (blur to sharp)
- [ ] Compliance check completes quickly
- [ ] UI remains responsive during generation

## Accessibility Tests

- [ ] All inputs have proper labels
- [ ] Before/after toggle is keyboard accessible
- [ ] Compliance status announced to screen reader
- [ ] Generated image has alt text
- [ ] Focus management during generation
- [ ] Color isn't only indicator of compliance
