# MKE.dev Agent System

This directory is a placeholder for the future multi-agent orchestration system for MKE.dev.

## Planned Architecture

The agent system will use Google ADK (Agent Development Kit) to orchestrate multiple specialized agents:

- **Zoning Agent**: Interprets zoning code, determines permitted uses, dimensional requirements
- **Incentive Agent**: Identifies available incentives, calculates potential benefits
- **Feasibility Agent**: Analyzes parcel development potential, constraints
- **Research Agent**: Crawls and indexes city documents, neighborhood plans

## Integration

The agent system will integrate with:
- Convex backend for data persistence
- Gemini models for LLM capabilities
- Firecrawl for web content ingestion
- Gemini File Search for PDF RAG

## Status

This package is not yet implemented. Development is planned for Week 2 onwards.

## Tech Stack (Planned)

- Google ADK for agent orchestration
- Gemini 2.0 Flash for LLM inference
- CopilotKit for generative UI integration
- Comet/Opik for LLM observability
