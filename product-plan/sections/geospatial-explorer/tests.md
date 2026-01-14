# Geospatial Explorer — Test Instructions

Use test-driven development (TDD) to implement this section. Write tests first, then implement to make them pass.

## Unit Tests

### MapView Component
- [ ] Renders Mapbox map container
- [ ] Centers on Milwaukee coordinates by default
- [ ] Applies correct zoom level from props
- [ ] Switches between light and dark map styles

### MapControls Component
- [ ] Renders zoom in/out buttons
- [ ] Calls `onZoomIn` when plus clicked
- [ ] Calls `onZoomOut` when minus clicked
- [ ] Renders 2D/3D toggle button
- [ ] Calls `onToggle3D` when toggle clicked
- [ ] Shows correct icon for current view mode

### LayerPanel Component
- [ ] Renders all 8 layer toggles
- [ ] Shows layer name and icon for each layer
- [ ] Calls `onToggle` when layer checkbox clicked
- [ ] Displays layer count badge
- [ ] Is draggable on mobile (bottom sheet behavior)
- [ ] Shows legend for active layers

### AddressSearchBar Component
- [ ] Renders search input field
- [ ] Shows autocomplete suggestions while typing
- [ ] Calls `onSearch` when suggestion selected
- [ ] Calls `onSearch` when Enter pressed
- [ ] Clears input after search
- [ ] Shows voice search button
- [ ] Calls `onVoiceSearch` when voice button clicked

### SelectedParcelInfo Component
- [ ] Displays parcel address when selected
- [ ] Shows coordinates (lat/lng)
- [ ] Shows tax key
- [ ] Hides when no parcel selected
- [ ] Shows "View Details" button
- [ ] Calls `onViewDetails` when button clicked

## Integration Tests

### Layer Toggle Flow
- [ ] Toggling layer on adds it to map
- [ ] Toggling layer off removes it from map
- [ ] Multiple layers can be active simultaneously
- [ ] Layer legend updates when layers change
- [ ] Layer visibility persists across sessions

### Address Search Flow
- [ ] Typing address shows autocomplete suggestions
- [ ] Selecting suggestion navigates map to location
- [ ] Map zooms to appropriate level for address
- [ ] Parcel at address is highlighted
- [ ] Search history is saved (optional)

### Parcel Selection Flow
- [ ] Clicking parcel on map selects it
- [ ] Selected parcel shows highlight border
- [ ] SelectedParcelInfo bar appears
- [ ] Clicking "View Details" triggers chat query
- [ ] Clicking elsewhere deselects parcel

### Geolocation Flow
- [ ] "Locate me" button requests user location
- [ ] Map centers on user's current location
- [ ] User location marker appears on map
- [ ] Permission denied shows appropriate message

### 2D/3D Toggle Flow
- [ ] Toggling to 3D tilts map perspective
- [ ] Buildings extrude in 3D mode
- [ ] Toggling back to 2D flattens view
- [ ] Animation is smooth (not jarring)

## Edge Cases

- [ ] Map handles no layers active gracefully
- [ ] Search with no results shows "No results found"
- [ ] Very long address truncates in info bar
- [ ] Map handles rapid zoom in/out
- [ ] Layer loading shows loading indicator
- [ ] Network error for layer shows error state

## Performance Tests

- [ ] Map renders within 2 seconds on desktop
- [ ] Layer toggle responds within 100ms
- [ ] Address autocomplete responds within 300ms
- [ ] Panning/zooming is 60fps smooth
- [ ] Multiple layers active doesn't degrade performance

## Accessibility Tests

- [ ] Map controls are keyboard accessible
- [ ] Layer panel is keyboard navigable
- [ ] Search input has appropriate labels
- [ ] Selected parcel announced to screen reader
- [ ] Color contrast meets WCAG AA for overlays
