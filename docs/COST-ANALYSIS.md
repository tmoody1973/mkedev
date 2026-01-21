# MKE.dev Cost Analysis & Development Estimation

> Realistic cost breakdown for building a voice-first AI civic intelligence platform

**Document Date:** January 21, 2026
**Project:** MKE.dev - Voice-First AI-Powered Civic Intelligence Platform

---

## Executive Summary

| Scope | Timeline | Cost Range |
|-------|----------|------------|
| **MVP** | 6-10 weeks | $60,000 - $120,000 |
| **Full Feature Set** | 16-24 weeks | $180,000 - $350,000 |
| **Enterprise/Production** | 24-36 weeks | $300,000 - $600,000 |

These estimates assume a small, experienced team (2-4 developers) and include design, development, testing, and initial deployment. They do not include ongoing maintenance, hosting, or API costs.

---

## Part 1: MVP Cost Estimation

### MVP Scope Definition

A Minimum Viable Product for MKE.dev would include:

| Feature | Included in MVP |
|---------|-----------------|
| Interactive map with Milwaukee data | Yes |
| Basic zoning lookup by address | Yes |
| Simple chat interface | Yes |
| User authentication | Yes |
| 2-3 ESRI layers (Zoning, Parcels, TIF) | Yes |
| Basic AI chat (no voice) | Yes |
| Mobile responsive | Yes |
| RAG with zoning code PDFs | No |
| Voice interface | No |
| AI image generation | No |
| Generative UI cards | No |
| 3D map visualization | No |
| PDF report generation | No |

### MVP Development Breakdown

| Component | Hours | Rate | Cost |
|-----------|-------|------|------|
| **Project Setup & Architecture** | | | |
| Monorepo setup, CI/CD | 8-12 | $150/hr | $1,200 - $1,800 |
| Database schema design | 12-16 | $175/hr | $2,100 - $2,800 |
| **Frontend Development** | | | |
| Next.js app setup | 8-12 | $150/hr | $1,200 - $1,800 |
| UI component library setup | 16-24 | $150/hr | $2,400 - $3,600 |
| Map integration (Mapbox) | 24-32 | $175/hr | $4,200 - $5,600 |
| ESRI layer integration (3 layers) | 24-40 | $175/hr | $4,200 - $7,000 |
| Chat panel UI | 16-24 | $150/hr | $2,400 - $3,600 |
| Authentication UI | 8-12 | $150/hr | $1,200 - $1,800 |
| **Backend Development** | | | |
| Convex schema + queries | 24-32 | $175/hr | $4,200 - $5,600 |
| Authentication (Clerk) | 12-16 | $150/hr | $1,800 - $2,400 |
| Basic AI chat integration | 24-32 | $175/hr | $4,200 - $5,600 |
| ESRI API integration | 16-24 | $175/hr | $2,800 - $4,200 |
| **Testing & QA** | | | |
| Unit tests | 16-24 | $125/hr | $2,000 - $3,000 |
| Integration testing | 16-24 | $125/hr | $2,000 - $3,000 |
| **Deployment** | | | |
| Production setup | 8-12 | $150/hr | $1,200 - $1,800 |
| Documentation | 8-12 | $100/hr | $800 - $1,200 |

**MVP Total Hours:** 240-360 hours
**MVP Total Cost:** **$60,000 - $120,000**

### MVP Timeline

| Phase | Duration |
|-------|----------|
| Discovery & Design | 1-2 weeks |
| Core Development | 4-6 weeks |
| Testing & Polish | 1-2 weeks |
| **Total** | **6-10 weeks** |

---

## Part 2: Full Feature Set Cost Estimation

### Complete Feature List (As Implemented)

#### Tier 1: Core Platform
- Next.js 15 with App Router
- RetroUI neobrutalist design system
- Clerk authentication (Google OAuth + email)
- Convex real-time database
- Responsive mobile-first design

#### Tier 2: Map & GIS
- Mapbox GL JS integration
- 8 Milwaukee ESRI layers
- PMTiles for high-performance tiles (313,000+ features)
- 2D/3D toggle with zoning extrusions
- Parcel click interactions with popups
- Layer visibility and opacity controls

#### Tier 3: AI & Voice
- Zoning Interpreter Agent (14 tools)
- Gemini Live voice interface (bidirectional audio)
- File Search RAG (42 documents, 5 stores)
- Context caching for deep analysis
- Query classification (simple/complex/feasibility)

#### Tier 4: Generative UI
- 11 CopilotKit card types
- Real-time card rendering in chat
- Interactive property cards with actions
- Street View integration

#### Tier 5: AI Visualization
- Gemini 3 Pro Image integration
- Mask painting canvas (Konva.js)
- Screenshot capture (map + Street View)
- Zoom/pan controls
- Model fallback (Pro → 2.5 Flash)
- Scale-accurate generation

#### Tier 6: Data & Reports
- Homes MKE integration
- Vacant lots layer
- Conversation history with search
- PDF report generation (Hybiscus)
- Incentives RAG

### Full Feature Development Breakdown

| Component | Hours | Rate | Cost |
|-----------|-------|------|------|
| **Infrastructure & Setup** | | | |
| Monorepo, CI/CD, environments | 16-24 | $175/hr | $2,800 - $4,200 |
| Database design & schema | 24-32 | $200/hr | $4,800 - $6,400 |
| Authentication system | 16-24 | $150/hr | $2,400 - $3,600 |
| **Map & GIS (Tier 2)** | | | |
| Mapbox integration | 32-48 | $175/hr | $5,600 - $8,400 |
| ESRI layer integration (8 layers) | 48-64 | $175/hr | $8,400 - $11,200 |
| PMTiles pipeline | 40-56 | $200/hr | $8,000 - $11,200 |
| 3D visualization | 32-48 | $175/hr | $5,600 - $8,400 |
| Layer controls & interactions | 24-32 | $150/hr | $3,600 - $4,800 |
| **AI & Voice (Tier 3)** | | | |
| Zoning Agent (14 tools) | 80-120 | $200/hr | $16,000 - $24,000 |
| Gemini Live voice integration | 60-80 | $225/hr | $13,500 - $18,000 |
| RAG system (5 stores, 42 docs) | 48-64 | $200/hr | $9,600 - $12,800 |
| Context caching & deep analysis | 32-48 | $200/hr | $6,400 - $9,600 |
| **Generative UI (Tier 4)** | | | |
| CopilotKit integration | 24-32 | $175/hr | $4,200 - $5,600 |
| 11 card components | 56-80 | $150/hr | $8,400 - $12,000 |
| Card actions & interactions | 24-32 | $150/hr | $3,600 - $4,800 |
| **AI Visualization (Tier 5)** | | | |
| Visualizer architecture | 24-32 | $200/hr | $4,800 - $6,400 |
| Konva.js mask painting | 40-56 | $175/hr | $7,000 - $9,800 |
| Screenshot capture system | 24-32 | $150/hr | $3,600 - $4,800 |
| Gemini image generation | 32-48 | $200/hr | $6,400 - $9,600 |
| Zoom/pan, gallery, fallback | 24-32 | $150/hr | $3,600 - $4,800 |
| **Data Integration (Tier 6)** | | | |
| Homes MKE integration | 32-48 | $175/hr | $5,600 - $8,400 |
| Vacant lots layer | 32-48 | $175/hr | $5,600 - $8,400 |
| Conversation history | 24-32 | $150/hr | $3,600 - $4,800 |
| PDF report generation | 16-24 | $150/hr | $2,400 - $3,600 |
| **Testing & QA** | | | |
| Unit & integration tests | 48-64 | $125/hr | $6,000 - $8,000 |
| E2E testing | 32-48 | $125/hr | $4,000 - $6,000 |
| Accessibility testing | 16-24 | $125/hr | $2,000 - $3,000 |
| **Design & UX** | | | |
| UI/UX design | 40-60 | $150/hr | $6,000 - $9,000 |
| Design system documentation | 16-24 | $125/hr | $2,000 - $3,000 |
| **DevOps & Deployment** | | | |
| Production infrastructure | 24-32 | $175/hr | $4,200 - $5,600 |
| Monitoring (Sentry) | 8-12 | $150/hr | $1,200 - $1,800 |
| Documentation | 24-32 | $100/hr | $2,400 - $3,200 |

**Full Feature Total Hours:** 1,000 - 1,500 hours
**Full Feature Total Cost:** **$180,000 - $350,000**

### Full Feature Timeline

| Phase | Duration |
|-------|----------|
| Discovery & Planning | 2-3 weeks |
| Design & Architecture | 2-3 weeks |
| Core Platform (Tiers 1-2) | 4-6 weeks |
| AI & Voice (Tier 3) | 4-6 weeks |
| Generative UI & Visualization (Tiers 4-5) | 3-4 weeks |
| Data Integration (Tier 6) | 2-3 weeks |
| Testing & Polish | 2-3 weeks |
| **Total** | **16-24 weeks** |

---

## Part 3: Agency/Contractor Rate Comparison

### Hourly Rates by Provider Type

| Provider Type | Hourly Rate | Best For |
|---------------|-------------|----------|
| Freelance Junior | $50 - $80 | Simple tasks, maintenance |
| Freelance Mid-level | $100 - $150 | Feature development |
| Freelance Senior | $150 - $250 | Architecture, complex features |
| Freelance Principal | $200 - $350 | Technical leadership |
| Small Agency (US) | $150 - $250 | Full projects, blended rate |
| Large Agency (US) | $200 - $350 | Enterprise, complex projects |
| Boutique AI Agency | $250 - $400 | AI/ML specialized work |
| Offshore Agency | $40 - $80 | Cost-sensitive projects |
| Nearshore Agency | $75 - $125 | Balance of cost/quality |

### Project Cost by Provider

| Provider | MVP Cost | Full Feature Cost |
|----------|----------|-------------------|
| Single Senior Freelancer | $50,000 - $90,000 | $150,000 - $280,000 |
| Small US Agency (2-3 devs) | $75,000 - $120,000 | $200,000 - $350,000 |
| Large US Agency | $100,000 - $180,000 | $300,000 - $500,000 |
| AI Specialized Agency | $120,000 - $200,000 | $350,000 - $600,000 |
| Offshore Team | $25,000 - $50,000 | $80,000 - $150,000 |
| Hybrid (US Lead + Offshore) | $45,000 - $80,000 | $120,000 - $250,000 |

---

## Part 4: Ongoing Operational Costs

### Monthly SaaS & API Costs

| Service | Free Tier | Production Estimate | Notes |
|---------|-----------|---------------------|-------|
| **Convex** | 2M function calls | $25 - $200/mo | Database + serverless |
| **Clerk** | 10K MAU | $25 - $100/mo | Authentication |
| **Mapbox** | 50K loads | $100 - $500/mo | Map tiles + geocoding |
| **Gemini API** | Limited | $200 - $1,000/mo | Depends on usage |
| **Google Maps** | $200 credit | $50 - $200/mo | Street View API |
| **Vercel** | Hobby free | $20 - $150/mo | Hosting |
| **Cloudflare R2** | 10GB free | $5 - $30/mo | PMTiles storage |
| **Sentry** | 5K errors | $26 - $80/mo | Error monitoring |
| **Hybiscus** | Pay per use | $10 - $50/mo | PDF generation |
| **Domain + DNS** | - | $15 - $30/mo | Domain registration |

**Estimated Monthly Operations:** $500 - $2,500/month

### Annual Operational Budget

| Usage Level | Monthly | Annual |
|-------------|---------|--------|
| Low (1K users) | $500 - $800 | $6,000 - $10,000 |
| Medium (10K users) | $1,000 - $1,500 | $12,000 - $18,000 |
| High (50K users) | $2,000 - $4,000 | $24,000 - $48,000 |
| Enterprise (100K+ users) | $5,000 - $15,000 | $60,000 - $180,000 |

---

## Part 5: What a City/Company Would Pay

### Government/Municipal Contract Pricing

Cities and government entities typically pay premium rates due to:
- Compliance requirements (ADA, WCAG, security audits)
- Procurement processes and documentation
- Extended support and SLA requirements
- Training and onboarding
- Data privacy and sovereignty concerns

| Project Scope | Commercial Rate | Government Rate | Premium |
|---------------|-----------------|-----------------|---------|
| MVP | $60K - $120K | $100K - $200K | +50-75% |
| Full Feature | $180K - $350K | $300K - $550K | +50-60% |
| Enterprise | $300K - $600K | $500K - $900K | +40-50% |

### Typical Government Contract Structure

**Phase 1: Discovery & Requirements** (8-12 weeks)
- Stakeholder interviews
- Technical assessment
- Requirements documentation
- Cost: $30,000 - $60,000

**Phase 2: Design & Prototyping** (6-10 weeks)
- UX/UI design
- Interactive prototypes
- Accessibility review
- Cost: $40,000 - $80,000

**Phase 3: Development** (16-32 weeks)
- Iterative development
- Regular demos
- Security reviews
- Cost: $150,000 - $400,000

**Phase 4: Testing & Compliance** (4-8 weeks)
- QA testing
- Accessibility audit (WCAG 2.1 AA)
- Security audit
- 508 compliance
- Cost: $30,000 - $80,000

**Phase 5: Deployment & Training** (4-6 weeks)
- Production deployment
- Staff training
- Documentation
- Cost: $20,000 - $50,000

**Total Government Contract:** $270,000 - $670,000

### Support & Maintenance Contract

| Service Level | Monthly Cost | Annual Cost |
|---------------|--------------|-------------|
| Basic (business hours, 48hr response) | $2,000 - $4,000 | $24,000 - $48,000 |
| Standard (extended hours, 24hr response) | $4,000 - $8,000 | $48,000 - $96,000 |
| Premium (24/7, 4hr response) | $8,000 - $15,000 | $96,000 - $180,000 |

---

## Part 6: Cost Breakdown by Feature

### Feature-Level Cost Estimation

This helps prioritize features based on ROI:

| Feature | Dev Hours | Cost | Complexity | User Value |
|---------|-----------|------|------------|------------|
| Basic map with layers | 80-120 | $12K-20K | Medium | High |
| User authentication | 16-24 | $2.5K-4K | Low | High |
| Chat interface | 24-40 | $4K-7K | Medium | High |
| Zoning lookup (basic) | 32-48 | $5K-8K | Medium | High |
| Zoning Agent (full) | 80-120 | $16K-24K | High | High |
| Voice interface | 60-80 | $13K-18K | High | Medium |
| RAG system | 48-64 | $10K-13K | High | High |
| Generative UI cards | 56-80 | $8K-12K | Medium | Medium |
| AI Visualizer | 120-160 | $22K-30K | Very High | Medium |
| PMTiles pipeline | 40-56 | $8K-11K | High | Medium |
| 3D map view | 32-48 | $6K-8K | Medium | Low |
| PDF reports | 16-24 | $2.5K-4K | Low | Low |
| Conversation history | 24-32 | $4K-5K | Medium | Medium |
| Homes integration | 32-48 | $6K-8K | Medium | Medium |
| Vacant lots layer | 32-48 | $6K-8K | Medium | Medium |

### Recommended MVP Feature Set (Best ROI)

For a city on a limited budget, prioritize:

1. **Basic map with zoning/parcels** - $12K-20K
2. **User authentication** - $2.5K-4K
3. **Chat interface** - $4K-7K
4. **Zoning lookup (basic)** - $5K-8K
5. **RAG with zoning code** - $10K-13K

**Recommended MVP Total:** $35,000 - $55,000

---

## Part 7: Build vs Buy Analysis

### Custom Development (This Project)

**Pros:**
- Fully customized to Milwaukee's needs
- Ownership of all code and data
- No vendor lock-in
- Can be open-sourced for other cities

**Cons:**
- Higher upfront cost
- Requires ongoing maintenance
- Technical debt management
- Need to hire/contract developers

### Alternative: Commercial GIS Platform + AI Add-ons

| Solution | Annual Cost | Limitations |
|----------|-------------|-------------|
| ESRI ArcGIS Hub | $50K-150K/yr | Limited AI, no voice |
| Mapbox + ChatGPT API | $20K-50K/yr | No deep zoning integration |
| OpenGov/Accela | $100K-300K/yr | Government-focused but generic |

**Verdict:** Custom development makes sense for MKE.dev because:
- Deep integration with Milwaukee-specific data
- Voice-first and AI-native approach
- Unique visualization capabilities
- Can be replicated for other cities

---

## Part 8: Risk Factors & Contingencies

### Development Risk Factors

| Risk | Impact | Mitigation | Contingency Budget |
|------|--------|------------|-------------------|
| AI API changes | High | Abstract API layer | +10-15% |
| ESRI data format changes | Medium | Version pinning | +5-10% |
| Scope creep | High | Fixed scope contracts | +15-20% |
| Integration complexity | Medium | Prototype first | +10% |
| Performance issues | Medium | Load testing early | +5-10% |

**Recommended Contingency:** Add 20-30% to base estimates

---

## Summary

### Quick Reference

| Question | Answer |
|----------|--------|
| What would an MVP cost? | $60,000 - $120,000 |
| What would full features cost? | $180,000 - $350,000 |
| What would a city pay (with compliance)? | $300,000 - $670,000 |
| Monthly operating costs? | $500 - $2,500 |
| Annual maintenance contract? | $24,000 - $96,000 |
| Timeline for MVP? | 6-10 weeks |
| Timeline for full features? | 16-24 weeks |

### Honest Assessment

This project represents a **substantial engineering effort**. The combination of:
- Real-time mapping with multiple data sources
- AI agent with 14+ tools
- Voice interface with live transcription
- Image generation with mask painting
- RAG across 42 documents

...would typically require a team of 3-5 developers working 4-6 months.

**For a hackathon project**, this is impressive scope. **For a production city deployment**, additional work would be needed for:
- Security hardening
- Accessibility compliance (WCAG 2.1 AA)
- Load testing and optimization
- Disaster recovery
- User training and documentation
- Ongoing maintenance and support

---

## Part 9: The AI-Assisted Development Reality

### What Actually Happened: Building MKE.dev

This project was built by **one non-technical person with basic coding knowledge** using **Claude Code** (AI pair programming) in approximately **2 weeks of active development**.

Let that sink in.

### Traditional vs AI-Assisted Development

| Factor | Traditional Team | Solo + Claude Code |
|--------|------------------|-------------------|
| **Team Size** | 3-5 developers | 1 person |
| **Technical Skill Required** | Senior-level expertise | Basic understanding |
| **Timeline** | 16-24 weeks | ~2 weeks |
| **Cost (Labor)** | $180,000 - $350,000 | ~$200/month (Claude subscription) |
| **Cost Reduction** | Baseline | **99%+ reduction** |
| **Time Reduction** | Baseline | **85-90% reduction** |

### What This Means

#### The Math Doesn't Lie

| Metric | Traditional | AI-Assisted | Difference |
|--------|-------------|-------------|------------|
| Development hours | 1,000-1,500 hrs | ~80-120 hrs | 10-12x faster |
| Hourly cost | $150-200/hr | ~$2-3/hr effective | 50-75x cheaper |
| Total cost | $180K-$350K | <$1,000 | 99.5%+ savings |
| Expertise needed | 5+ years experience | Basic coding literacy | Democratized |

#### Features Successfully Implemented (Solo + AI)

All of these were built by a non-developer with Claude Code:

- [x] Next.js 15 monorepo with TypeScript
- [x] Real-time database (Convex) with 10+ tables
- [x] Authentication system (Clerk)
- [x] Interactive map with 8 ESRI layers
- [x] PMTiles pipeline (313,000+ features)
- [x] 2D/3D map toggle with camera animations
- [x] AI agent with 14 function-calling tools
- [x] Voice interface (Gemini Live API)
- [x] RAG system with 42 documents across 5 stores
- [x] 11 generative UI card components
- [x] AI image generation with mask painting (Konva.js)
- [x] Zoom/pan canvas controls
- [x] Screenshot capture and gallery
- [x] PDF report generation
- [x] Conversation history with search
- [x] Error monitoring (Sentry)

**This is not a toy project.** This is production-grade software with complex integrations.

### Honest Caveats

#### What AI-Assisted Development Is Good At
- Rapid prototyping and iteration
- Implementing known patterns and integrations
- Debugging and fixing errors
- Writing boilerplate and repetitive code
- Explaining concepts and suggesting approaches
- Maintaining consistency across a codebase

#### What Still Requires Human Judgment
- Product vision and user needs
- Business logic and domain expertise
- Design decisions and UX priorities
- Knowing what to build (not just how)
- Quality standards and "good enough" decisions
- Security review and production hardening

#### What This Project Would Still Need for Production
- Professional security audit (~$10,000-$30,000)
- Accessibility audit and remediation (~$5,000-$15,000)
- Load testing and optimization (~$5,000-$10,000)
- Legal review for data handling (~$5,000-$10,000)
- Professional design polish (~$10,000-$20,000)
- Documentation and training materials (~$5,000-$10,000)

**Production-ready total:** Add $40,000-$95,000 to AI-assisted build

### The New Economics of Software Development

#### Before AI Coding Assistants (2023 and earlier)
```
Idea → Hire developers → Wait months → Pay $100K+ → Maybe get what you wanted
```

#### After AI Coding Assistants (2025+)
```
Idea → Describe to AI → Iterate in real-time → Ship in weeks → Cost ~$0
```

#### Who Can Build Software Now

| Before | After |
|--------|-------|
| Computer Science degree | Basic computer literacy |
| 5+ years coding experience | Understanding of what you want |
| $150K+ salary expectations | Curiosity and persistence |
| Months of development time | Days to weeks |
| Team of specialists | One person + AI |

### Implications for Cities and Organizations

#### Option A: Traditional RFP Process
1. Write RFP (2-3 months)
2. Vendor selection (2-3 months)
3. Contract negotiation (1-2 months)
4. Development (6-12 months)
5. Testing and deployment (2-3 months)
6. **Total: 12-24 months, $300K-$700K**

#### Option B: AI-Assisted Internal Development
1. Identify a motivated employee with domain knowledge
2. Provide Claude Code / Cursor / similar tool (~$200/month)
3. Build iteratively with stakeholder feedback
4. Deploy and iterate
5. **Total: 1-3 months, <$5K**

### Why This Matters for Civic Tech

MKE.dev demonstrates that:

1. **Cities don't need massive IT budgets** to build modern software
2. **Domain experts can become builders** - the person who understands zoning can build the zoning tool
3. **Rapid iteration beats waterfall RFPs** - build, test, learn, repeat
4. **Open source + AI = democratized government** - other cities can fork and adapt

### The Uncomfortable Truth for the Software Industry

This project would have been quoted at **$180,000-$350,000** by agencies.

It was built for essentially **the cost of a Claude subscription**.

This isn't a fluke. This is the new reality. The traditional software development cost structure is being disrupted in real-time.

#### What This Means for:

**Developers:** Your value is shifting from "can write code" to "can architect systems, make good decisions, and ship quality products." Code generation is becoming commoditized.

**Agencies:** The $150-300/hour model is under pressure. Value must come from strategy, design, and expertise - not typing.

**Cities/Organizations:** You have more options than ever. Don't automatically assume you need a $500K contract. Explore AI-assisted development first.

**Non-Technical People:** You can build real software now. The barrier to entry has collapsed. If you can clearly describe what you want, you can build it.

### Final Comparison

| Approach | Cost | Time | Result |
|----------|------|------|--------|
| Large Agency | $300K-$600K | 6-12 months | Professional, polished |
| Small Agency | $150K-$300K | 4-8 months | Good quality |
| Freelance Team | $80K-$200K | 3-6 months | Variable quality |
| Solo + Claude Code | <$1K | 2-4 weeks | Functional, needs polish |

**The solo + AI approach delivers 80-90% of the functionality at <1% of the cost.**

For a hackathon, MVP, or proof of concept - this is revolutionary.

For production deployment to thousands of users - you'd want to invest in the polish, security, and accessibility work. But you're starting from a working product, not a blank page.

---

## Conclusion

### If You're a City Official Reading This

You have three paths:

1. **Traditional RFP** - $300K-$700K, 12-24 months, proven but slow and expensive
2. **Hire and Empower** - Find an employee who understands the domain, give them AI tools, let them build - $5K-$50K, 1-6 months
3. **Hybrid** - Use AI-assisted development for the prototype, then hire an agency to harden for production - $50K-$150K, 3-6 months

### If You're a Developer Reading This

Your job is changing. Embrace AI assistance - it makes you 10x more productive. Focus on architecture, quality, and the decisions machines can't make well yet.

### If You're a Non-Technical Person Reading This

**You can build software now.** Not toy apps - real, complex, useful software. The tools exist. The barrier is no longer technical skill - it's clarity of vision and persistence.

MKE.dev is proof.

---

*This cost analysis is based on industry standard rates as of January 2026 and the actual implemented features in MKE.dev. The AI-assisted development section reflects the real experience of building this project.*
