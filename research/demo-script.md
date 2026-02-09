# MKE.dev Demo Script

**Format:** Screen recording with voiceover narration
**Duration:** 3 minutes (~450 words spoken)
**Tone:** Professional, authoritative, passionate

---

## ELEVATOR PITCH (use in submission form)

> MKE.dev is an AI-powered civic intelligence platform that turns Milwaukee's 700 pages of zoning code, dozens of permit forms, and scattered city data into a single conversation -- powered by Gemini 3.

---

## SCRIPT

### [HOOK: THE PROBLEM - 0:00-0:20]

**[SCREEN: Show Milwaukee city website -- confusing navigation, buried PDF links, dense zoning code pages. Quick cuts between 3-4 painful screens.]**

> "This is what it looks like to find zoning information in Milwaukee. You start on the city website, click through five menus, download a PDF, and hope you're reading the right subchapter out of 700 pages. Need a permit form? That's a different department, different site, different search. Want to know what you can actually build on a lot? Good luck. MKE.dev replaces all of that with one AI-powered conversation."

---

### [THE SOLUTION + GEMINI 3 - 0:20-0:40]

**[SCREEN: MKE.dev loads -- 3D map with layers, chat panel open, clean interface]**

> "MKE.dev is built on Gemini 3. Our agent runs on Gemini 3 Flash with 22 function-calling tools. It uses Gemini File Search to retrieve answers from 42 city documents in real time. And Gemini 3 Pro Image lets users visualize what could be built on any site. Let me show you what that looks like with a real question."

---

### [DEMO 1: COMPLEX ZONING QUESTION - 0:40-1:25]

**[SCREEN: Type in chat: "I want to open a restaurant at 2000 N Dr Martin Luther King Jr Drive. What's the zoning, how many parking spaces do I need, and what permits should I file?"]**

> "This is the kind of question that normally takes hours to answer. You'd need to look up the zoning district, find the parking requirements in the code, and then figure out which permit forms to file. With MKE.dev, I just ask."

**[SCREEN: Show agent working -- status indicators cycling through tool calls. Then cards appearing: ZoneInfoCard, parking calculation, PermitRecommendationsCard. Map flies to location.]**

> "Gemini 3 Flash orchestrates the entire chain. It geocodes the address, queries the city GIS for the zoning district, calculates parking requirements using Gemini function calling, searches the zoning code through Gemini File Search for applicable regulations, and recommends the right permit forms -- all in one turn. That's six tool calls, three data sources, and a structured answer in seconds."

---

### [DEMO 2: DOCUMENT ANALYZER - 1:25-2:05]

**[SCREEN: Click paperclip button, drag in a site plan PDF]**

> "Now the feature that shows what Gemini 3 thinking can really do. I upload a site plan, and Gemini 3 Flash with minimal thinking classifies it instantly -- site plan, floor plan, elevation, variance application -- it knows the difference. The system auto-enriches it by geocoding the address and pulling zoning and parcel data from the city."

**[SCREEN: Show classification completing, then ComplianceReportCard appearing]**

> "Then Gemini 3 Flash switches to high-level thinking and performs a deep compliance analysis. It retrieves the actual zoning regulations through Gemini File Search, combines them with the parcel data, and produces a structured report. Dimensional compliance. Setback checks. Use compatibility. Variance needs. Risk assessment. What used to take a city planner days now takes 30 seconds."

---

### [DEMO 3: SITE VISUALIZER - 2:05-2:35]

**[SCREEN: Click purple camera button to capture map screenshot, open visualizer, paint mask on vacant lot]**

> "Finally -- what could this site become? I capture a map view, paint a mask over the area, and describe what I want."

**[SCREEN: Type prompt: "Add a 4-story mixed-use building with retail on the ground floor", show Gemini 3 Pro Image generating]**

> "Gemini 3 Pro Image generates a photorealistic rendering. But here's what makes this different -- the system injects real zoning context into the generation: setback requirements, height limits, FAR, and lot dimensions from the parcel data. This isn't just image generation. It's AI architecture constrained by actual city regulations."

---

### [CLOSE - 2:35-3:00]

**[SCREEN: Quick montage -- conversation history, homes for sale cards, vacant lots, permit forms card, measurement tool, PDF export. End on full 3D map.]**

> "22 agent tools. 24 generative UI cards. 8 GIS data layers. Document analysis. Architectural visualization. All powered by Gemini 3. The information was always public -- it was just buried. MKE.dev makes it accessible to everyone."

**[SCREEN: MKE.dev logo / tagline: "Making Milwaukee's civic development accessible to everyone"]**

---

## PRODUCTION NOTES

### Screen Recording Checklist
- [ ] Use 1920x1080 resolution
- [ ] Dark mode OFF (better visibility for judges)
- [ ] Clear browser tabs (only MKE.dev open)
- [ ] Pre-load the Milwaukee city website zoning pages in separate tabs for the hook
- [ ] Have a site plan PDF ready to drag-drop
- [ ] Pre-load a conversation so history sidebar shows content
- [ ] Pre-paint a mask in the visualizer OR have a vacant lot ready to capture

### Timing Breakdown
| Section | Duration | Words |
|---------|----------|-------|
| Hook: The Problem | 20s | ~70 |
| The Solution + Gemini 3 | 20s | ~55 |
| Demo 1: Complex Zoning Question | 45s | ~120 |
| Demo 2: Document Analyzer | 40s | ~110 |
| Demo 3: Site Visualizer | 30s | ~70 |
| Close | 25s | ~55 |
| **Total** | **3:00** | **~480** |

### Key Gemini 3 Features to Highlight
1. **Gemini 3 Flash function calling** - 22 tools, multi-step orchestration in a single turn
2. **Gemini 3 Flash thinking levels** - MINIMAL for classification, HIGH for compliance analysis
3. **Gemini File Search** (powered by Gemini 3) - RAG over 42 zoning documents
4. **Gemini 3 Pro Image** - Zoning-aware architectural visualization
5. **Multimodal** - PDFs, images, structured JSON output

### Hackathon Requirements Mapping
| Requirement | How MKE.dev Addresses It |
|-------------|--------------------------|
| Uses Gemini 3 | 7 Gemini models, 3 are Gemini 3 (Flash, Pro, Pro Image) |
| Real-world problem | City zoning info is buried across websites, PDFs, and departments |
| Real-world solution | AI agent that retrieves, analyzes, and visualizes civic data in seconds |
| User interaction | Text chat, document upload, map interaction, image generation |
| Innovation | First civic AI combining document analysis + compliance checking + architectural visualization |

### Hook Screenshots to Capture
1. Milwaukee city website zoning page (confusing navigation)
2. A zoning code PDF (dense text, hard to parse)
3. Permit forms page (dozens of links, no guidance)
4. GIS viewer (technical, not user-friendly)

### Tips for Recording
- Speak at 150 words/minute (natural pace)
- Pause 1-2 seconds between sections for transitions
- Let the UI animations complete before narrating the next step
- If an API call is slow during recording, narrate what's happening to fill time
- Record the hook screenshots separately and splice them in during editing
