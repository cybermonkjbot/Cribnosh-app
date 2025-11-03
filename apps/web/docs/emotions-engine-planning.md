# CribNosh Emotions Engine, Backend Planning & Integration Spec

## Feature Overview
The Emotions Engine is an AI-powered backend service that generates food/snack recommendations, nutritional advice, mood-enhancing suggestions, and contextual chat answers using mood, context, and user data.

---

## Core Modules & Flow

1. **Input Aggregation**
   - Receives: `user_input`, `mood_score`, `location`, `timeOfDay`, `active_screen`, `device_type`, (optional: `weather`, `usage_patterns`)
2. **Context Aggregation**
   - **UIContext Engine**: Collects real-time session data from frontend
   - **APIContext Engine**: Fetches stored user data (order history, dietary tags, preferences)
   - **Backend Cuisine Context**: If user location is provided, the engine queries backend for nearby chefs and aggregates all unique cuisines (from chef specialties) within a 10km radius. These are included as `nearby_cuisines` in the context for more relevant recommendations.
3. **Provider Selection Layer**
   - Decides LLM provider based on prompt size, user tier, mood, intent, and cost/priority
   - Implements decision logic (see below)
4. **Inference Engine**
   - Builds system prompt using all context
   - Dispatches to selected LLM provider
   - Parses and validates structured JSON response
5. **Response Classification**
   - Types: `recommendation`, `answer`, `notification`, `fallback`, `multi_intent`
6. **Output**
   - Returns structured JSON to frontend for rendering

---

## Provider Selection Logic
- Use Claude or Gemini for long prompts
- Prefer HuggingFace or GPT-3.5 if no chat history
- Use GPT-4 or Claude-3 Sonnet for high-priority/emotional intent
- Use HuggingFace for free-tier users or cost-sensitive ops
- Prioritize Claude/GPT-4 for high-urgency moods

### Decision Function (Python-style pseudocode)
```python
def choose_provider(prompt_length, has_user_input, user_tier, mood_score, priority):
    if user_tier == "free":
        return "huggingface"
    if prompt_length > 3000:
        return "claude"
    if priority or mood_score <= 2:
        return "gpt-4"
    if not has_user_input:
        return "huggingface"
    if prompt_length > 1500:
        return "gemini"
    return "gpt-3.5"
```

---

## LLM Provider Integration
- **OpenAI (GPT-4, GPT-3.5)**: Structured chat format
- **Anthropic Claude**: Long-context, combine system/user prompt
- **Google Gemini Pro**: Prompt chaining, grounding
- **HuggingFace**: Fallback, free-tier, retry logic

---

## System Prompt Template
```
You are CribNosh's Emotions Engine, an AI that gives food and lifestyle recommendations based on user mood, time of day, location, and preferences.

Context:
- Mood score: {mood_score}
- Time: {time}
- Location: {location}
- Diet: {diet_type}
- Past meals: {recent_orders}
- Weather: {weather}
- Active screen: {screen}
- Nearby cuisines: {nearby_cuisines}

Instruction:
- Respond in JSON format with a top-level `response_type`
- If the user asked a question, respond as `answer`
- If they didn't but mood is high/low, infer recommendation or send notification
- Recommend food, snacks, teas, or tips based on context and available cuisines

User input:
{user_input or "No input"}
```

---

## Response Schema
- `response_type`: `answer`, `recommendation`, `notification`, `fallback`, `multi_intent`
- `intent`: e.g. `mood_food_suggestion`, `nutritional_info`, `low_energy_reminder`
- `inferred_context`: All context fields used, including `nearby_cuisines` if available
- `recommendations`/`answer`/`actions`: Varies by type
- `message`: User-facing summary

---

## Fallback & Routing
- Per-model timeout (3–5s)
- Retry order: OpenAI → Claude → Gemini → HuggingFace
- Log/tag each request with model used

---

## TODOs
- [x] Design and document architecture
- [x] Implement provider selection logic
- [x] Build context aggregation modules
- [x] Integrate LLM providers (stubs)
- [x] Scaffold inference engine and API endpoint
- [x] Enrich context with backend cuisines near the user
- [ ] Implement real provider API calls
- [ ] Add monitoring/logging for requests and errors
- [ ] Write tests for all logic and API
- [ ] Add authentication/session extraction if needed 
