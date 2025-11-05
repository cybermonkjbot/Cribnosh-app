# CribNosh Emotions Engine Backend

This module implements the Emotions Engine backend service, responsible for:
- Aggregating user and session context
- Selecting the appropriate LLM provider
- Building and dispatching prompts
- Parsing and classifying responses
- Providing a unified API for mood-based recommendations, answers, and notifications

## Structure
- `core/`, Context aggregation, provider selection, inference engine
- `providers/`, Integrations for OpenAI, Anthropic, Gemini, HuggingFace
- `types.ts`, Shared types and response schema

See `docs/emotions-engine-planning.md` for the full spec and TODOs. 
