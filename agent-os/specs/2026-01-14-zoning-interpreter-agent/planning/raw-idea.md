# Raw Idea: Zoning Interpreter Agent

## Origin

During testing of the Document Ingestion Pipeline, we discovered that the RAG system was returning generic answers for location-specific questions. For example:

**User question:** "How many parking spaces do I need for my restaurant?"

**RAG response:** Generic parking information without considering that parking requirements vary significantly by zoning district (downtown districts have 75% reduced requirements).

## User Insight

The user observed that an intelligent agent should ask follow-up questions to gather necessary context:

> "I assume the agent we build would provide follow up questions to help refine the answer like asking the user, what is the address of the restaurant and the agent will use geocoding to determine the zoning and the code, correct"

## Proposed Solution

Create a conversational agent using Google ADK that:

1. **Detects when context is needed** - Questions about parking, setbacks, permitted uses, etc. require knowing the location
2. **Asks clarifying questions** - "What's the address of your restaurant?"
3. **Uses tools to gather context** - Geocode address → Query zoning at point
4. **Provides grounded answers** - With specific requirements for that zoning district

## Key Innovation

Unlike simple RAG that just searches documents, this agent:
- Maintains conversation state across turns
- Proactively gathers necessary context
- Combines multiple data sources (geocoding, ESRI zoning, RAG documents)
- Calculates specific requirements (parking spaces, setbacks)

## Technical Approach

Google ADK was chosen because:
- Native Gemini integration
- Built-in session management for multi-turn conversations
- FunctionTool with Zod schemas for type-safe tool definitions
- Support for agent-as-tool pattern for specialized sub-agents

## Example Conversation Flow

```
User: "What parking do I need for my restaurant?"

Agent: "I'd be happy to help calculate your parking requirements.
To give you accurate information, I need to know:
1. What's the address of your restaurant?
2. What's the approximate square footage?"

User: "500 N Water St, about 2,500 sq ft"

Agent: [geocode_address("500 N Water St, Milwaukee, WI")]
       → Returns coordinates: [-87.9095, 43.0389]

Agent: [query_zoning_at_point(-87.9095, 43.0389)]
       → Returns: DC (Downtown Core), TIF District

Agent: [calculate_parking("restaurant", 2500, "DC")]
       → Returns: 7 spaces at 1:400 ratio

Agent: "Based on your location at 500 N Water St in the DC
(Downtown Core) district, your 2,500 sq ft restaurant would
require approximately 7 parking spaces.

**Details:**
- District: DC (Downtown Core)
- Parking Ratio: 1 space per 400 sq ft (reduced downtown rate)
- Calculation: 2,500 ÷ 400 = 6.25, rounded up to 7 spaces
- Code Reference: Section 295-403-2

**Good News:** The DC district has several flexibility options:
1. Shared parking agreements
2. In-lieu fee payment
3. Bicycle parking credits (up to 10% reduction)

Would you like me to explain any of these options?"
```

## Success Metrics

- Agent asks for address for location-specific questions
- Geocoding accuracy >95% for Milwaukee addresses
- Correct zoning district identification
- Parking calculations match manual verification
- Session context persists for follow-up questions
