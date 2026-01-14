# LinkedIn Post: MKE.dev Map Performance

---

## Post Content

**🗺️ I just made Milwaukee's parcel data load 10x faster. Here's how.**

For the past week, I've been building MKE.dev—a voice-first civic intelligence platform for Milwaukee. One of the core features is an interactive map showing zoning districts, parcels, TIF zones, opportunity zones, and more.

The problem? Milwaukee's GIS data lives on ESRI ArcGIS servers. Every time you pan or zoom, your browser asks the city's server: *"What parcels are in this view?"* Then it waits. And waits.

**159,975 parcels. 148,000 zoning polygons. 5,000+ city-owned lots.**

That's a lot of waiting.

---

**The Solution: Pre-generate everything.**

Instead of asking the city's server on every interaction, I:

1️⃣ **Exported all 7 layers** from Milwaukee's ESRI REST services (zoning, parcels, TIF districts, opportunity zones, historic districts, architectural review areas, city-owned properties)

2️⃣ **Converted to PMTiles**—a single-file vector tile format designed for fast loading

3️⃣ **Uploaded to Cloudflare R2**—edge-cached globally, served in milliseconds

4️⃣ **Integrated with Mapbox GL JS**—smooth 60fps panning and zooming

**The result?** 313,000+ features rendered instantly. No loading spinners. No stuttering. Just a map that feels *native*.

---

**The zoning colors tell Milwaukee's story.**

I color-coded every zone type:
- 🟢 **Greens** for residential (RS1-RS6, RT1-RT4, RM1-RM7)
- 🔵 **Blues** for commercial (NS, LB, RB, CS)
- 🟣 **Purples** for industrial (IL, IM, IH)
- 🟠 **Oranges** for mixed-use (MX1-MX3, DX1-DX3)

Zoom out and you can see the city's planning history—where the factories were, where neighborhoods grew, where corridors evolved.

---

**Click any parcel. See everything.**

- Address
- Tax key
- Zoning code
- Lot size
- Owner information
- Assessed value

All loaded instantly. Compare that to the city's official parcel viewer, which requires multiple clicks and server round-trips for the same data.

---

**Why does this matter?**

For **homeowners**: Quickly understand what you can build on your property.

For **developers**: Scout opportunities without waiting for slow map loads.

For **urban planners**: Visualize the city's zoning landscape at a glance.

For **everyone**: Accessible civic data shouldn't require patience.

---

**This is just the foundation.**

Next up: Voice-first AI that can *explain* what you're looking at. Ask "What can I build here?" and get a real answer—grounded in Milwaukee's actual zoning code.

MKE.dev is my entry for the Gemini 3 Hackathon. The goal? Make Milwaukee's civic development information accessible to everyone, regardless of technical expertise.

More updates coming soon. 🚀

---

*#MilwaukeeWI #CivicTech #OpenData #UrbanPlanning #GIS #Mapbox #PMTiles #AI #GeminiHackathon #MKEdev*

---

## Suggested Image/Video

Option 1: Side-by-side comparison GIF
- Left: Milwaukee's official parcel viewer loading slowly
- Right: MKE.dev loading instantly

Option 2: Screen recording showing:
- Zooming from city level to parcel level
- Clicking a parcel to show metadata popup
- Toggling different overlay layers

Option 3: Static screenshot showing:
- The full map with colored zoning districts
- The layer panel with all 7 layers visible
- A parcel popup with property details

---

## Shorter Version (for character limits)

🗺️ I just made Milwaukee's parcel data load 10x faster.

The city has 160,000 parcels on ESRI servers. Every pan = network request = waiting.

My solution for MKE.dev:
✅ Export all 7 GIS layers (313K features)
✅ Convert to PMTiles format
✅ Host on Cloudflare's edge network
✅ Integrate with Mapbox GL JS

Result: Instant rendering. No spinners. Click any parcel for immediate property details.

Next: Adding voice AI to explain what you're looking at.

Building this for the Gemini 3 Hackathon. More soon!

#MilwaukeeWI #CivicTech #GIS #OpenData #UrbanPlanning

---

## Thread Version (for X/Twitter)

**Tweet 1:**
🗺️ I just made Milwaukee's parcel data load 10x faster.

The city has 160,000 parcels. Every map interaction = server request = waiting.

My solution? Pre-generate everything. Here's the thread 🧵

**Tweet 2:**
Step 1: Export all 7 layers from Milwaukee's ESRI REST services

- Zoning districts (148K polygons)
- Parcels (160K)
- TIF districts
- Opportunity zones
- Historic districts
- ARB areas
- City-owned lots

313,000+ features total.

**Tweet 3:**
Step 2: Convert to PMTiles

PMTiles is a single-file vector tile format. Instead of thousands of individual tile files, everything lives in one 133MB file.

Cloudflare R2 serves it from the edge. Millisecond load times globally.

**Tweet 4:**
Step 3: Color-code the zones

🟢 Residential (greens)
🔵 Commercial (blues)
🟣 Industrial (purples)
🟠 Mixed-use (oranges)

Zoom out and you see Milwaukee's planning history. Where factories were. Where neighborhoods grew.

**Tweet 5:**
Step 4: Click any parcel

Instant popup with:
- Address
- Tax key
- Zoning code
- Lot size
- Owner info

No loading. No multiple clicks. Just data.

**Tweet 6:**
This is the foundation for MKE.dev—a voice-first civic AI for Milwaukee.

Next: Ask "What can I build here?" and get a real answer from the actual zoning code.

Building for the @Google Gemini 3 Hackathon. More soon!

#MilwaukeeWI #CivicTech #GIS
