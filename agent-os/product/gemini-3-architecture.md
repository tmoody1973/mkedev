# Gemini 3 Architecture: How It All Works Together

> Plain English explanation of how Gemini File Search, 1M Context Caching, and Thinking Levels work together in MKE.dev

---

## The Three Pieces

### 1. Gemini File Search (RAG)

Think of this like a **librarian**. You ask a question, and the librarian quickly searches through filing cabinets, pulls out the 3-5 most relevant pages, and hands them to you. Fast and cheap, but you only see fragments.

| Aspect | Details |
|--------|---------|
| **Where it lives** | Google's servers (File Search Stores) |
| **What's in it** | 42 PDFs - zoning codes, area plans, incentive programs |
| **How it works** | You ask "What's the parking requirement for restaurants?" → Gemini searches → Finds the relevant paragraph → Returns just that snippet |
| **Good for** | Simple, specific questions with one clear answer |

### 2. Gemini 3's 1M Context Window

Think of this like having the **entire library book open on your desk at once**. Instead of searching for snippets, you load EVERYTHING into the AI's memory and let it read the whole thing.

| Aspect | Details |
|--------|---------|
| **Where it lives** | Loaded fresh into each Gemini 3 request |
| **What's in it** | The same zoning documents, but as raw text |
| **How it works** | You ask "Compare ALL commercial zones for breweries" → Gemini has the entire zoning code in memory → Can cross-reference any section with any other section |
| **Good for** | Complex questions that need the big picture, comparisons, "what are my options" queries |

### 3. Thinking Levels

Think of this like asking someone to **"show their work" on a math test**. Instead of just giving an answer, Gemini 3 Pro writes out its thought process first.

| Aspect | Details |
|--------|---------|
| **Where it lives** | Built into Gemini 3 Pro |
| **What it does** | Before answering, the AI thinks through the problem step-by-step |
| **How it works** | You ask a feasibility question → Gemini thinks: "OK, first I need to identify the use types... brewing is Light Manufacturing... taproom is Tavern..." → Then gives final answer |
| **Good for** | Complex feasibility analysis where you want to see HOW it reached the conclusion |

---

## How MKE.dev Uses Them Together

```
User asks a question
        ↓
   Smart Router classifies the query
        ↓
   ┌─────────────────────────────────────────┐
   │                                         │
   ↓                                         ↓
SIMPLE                              COMPLEX/FEASIBILITY
"What's RS4 zoning?"                "Compare all zones for breweries"
        ↓                                    ↓
   File Search (RAG)                 Gemini 3 + 1M Context
   - Fast (~2 seconds)               - Slower (~10 seconds)
   - Cheap                           - More expensive
   - Returns snippet                 - Cross-references everything
        ↓                                    ↓
                                    Is it a FEASIBILITY query?
                                             ↓
                                    ┌────────┴────────┐
                                    ↓                 ↓
                                   NO               YES
                              Gemini 3 Flash    Gemini 3 Pro
                              (fast answer)     + Thinking Levels
                                                (shows reasoning)
```

---

## Query Classification

The Smart Router uses pattern matching to classify queries:

### Simple Queries → File Search (RAG)
- Specific questions about one zone or requirement
- "What is...", "How many...", "What's the setback..."
- Single-factor lookups

### Complex Queries → Gemini 3 Flash + 1M Context
Pattern triggers:
```
/compare|across|all zones|every zone|comprehensive/i
/conflict|contradiction|overlap/i
/what are my options|where can I|which zones allow/i
/tradeoffs?|pros and cons|advantages/i
/best zone|recommend|optimal/i
```

### Feasibility Queries → Gemini 3 Pro + Thinking
Pattern triggers:
```
/feasibility|feasible|can I build/i
/mixed.?use.*development/i
/analyze.*requirements|requirements.*analyz/i
/comply|compliance|meet.*requirements/i
/what.*need.*to.*build/i
```

---

## Real Examples

### Simple Query → File Search

**Question:**
> "What is the setback requirement for RS4?"

**Processing:**
- Router sees: specific question, one zone
- Uses: File Search (RAG)
- Returns: "Per §295-505-2, the front setback in RS4 is 25 feet..."

### Complex Query → Gemini 3 Context

**Question:**
> "Which commercial zones allow breweries with taprooms and outdoor seating?"

**Processing:**
- Router sees: "which zones", comparative, multiple factors
- Uses: Gemini 3 Flash with full zoning corpus in context
- Returns: Table comparing NS1, NS2, LB1, LB2, CS, RB1, RB2 with all requirements

**Sample Response:**
| District | Brewery | Taproom | Outdoor Seating | Live Music |
|----------|---------|---------|-----------------|------------|
| NS1 | Not Allowed | Special Use | Permitted | Restricted |
| LB2 | Permitted | Permitted | Permitted | Permitted |
| IM | Permitted | Permitted | Permitted | Permitted |

### Feasibility Query → Gemini 3 Pro + Thinking

**Question:**
> "Can I build a mixed-use development with 8 units at 500 N Water St?"

**Processing:**
- Router sees: "can I build", "feasibility"
- Uses: Gemini 3 Pro with Thinking Levels

**Reasoning Output:**
> "First I need to check the zoning at this address... it's C9F which is Downtown... density limits don't apply here... parking is exempt in Downtown districts... I should check the Downtown Overlay requirements for glazing and entrance placement..."

**Final Answer:**
> "Yes, highly feasible. Here's what you need to comply with..."

---

## Why This Matters for the Hackathon

Most AI apps just use RAG (File Search). MKE.dev demonstrates THREE Gemini 3 capabilities:

| Feature | What It Shows |
|---------|---------------|
| **1M Context** | Can analyze entire document corpora at once |
| **Thinking Levels** | Shows AI reasoning (not just answers) |
| **Smart Routing** | Efficient - uses right tool for each query type |

The File Search Stores are still valuable for simple queries (cheaper, faster), but Gemini 3's context window unlocks questions that RAG simply can't answer well.

---

## Technical Implementation

### Files

| File | Purpose |
|------|---------|
| `convex/agents/contextCache.ts` | Smart router, query classifier, deep analysis |
| `convex/ingestion/ragV2.ts` | File Search RAG implementation |
| `convex/ingestion/fileSearchStores.ts` | Store management |

### Models Used

| Model | Use Case |
|-------|----------|
| `gemini-3-flash-preview` | Fast 1M context analysis |
| `gemini-3-pro-preview` | Deep thinking with reasoning |
| File Search tool | RAG for simple queries |

### API Endpoints

| Endpoint | Purpose |
|----------|---------|
| `agents/contextCache:smartQuery` | Main entry point (auto-routes) |
| `agents/contextCache:deepAnalysis` | Direct Gemini 3 with 1M context |
| `ingestion/ragV2:queryDocuments` | File Search RAG |

---

## Cost/Performance Tradeoffs

| Method | Latency | Cost | Best For |
|--------|---------|------|----------|
| File Search (RAG) | ~2s | Low | Simple, specific queries |
| Gemini 3 Flash + Context | ~10s | Medium | Complex comparisons |
| Gemini 3 Pro + Thinking | ~20s | High | Feasibility analysis |

The Smart Router automatically picks the cheapest/fastest method that can handle each query type.
