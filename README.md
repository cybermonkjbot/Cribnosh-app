# 🤖 Expo + Convex + Private APIs: Mobile App Backend System

## Overview

This project is a modern, full-stack **React Native** application bootstrapped with **Expo**, backed by a real-time **Convex serverless database**, and enhanced with **Private API integrations**. It is designed with modularity, scalability, and AI-compatibility in mind — meaning AI agents and developer tools can reason about it, extend its features, and participate in its development lifecycle.

> ⚠️ This README includes contextual cues and conventions to assist AI agents in understanding structure, intent, and interaction points.

## 🚀 Tech Stack

| Layer        | Tech             | Purpose                                     |
|--------------|------------------|---------------------------------------------|
| Frontend     | Expo (React Native) | Cross-platform mobile app framework        |
| Backend      | Convex           | Real-time serverless backend (Typescript)   |
| APIs         | Custom Private APIs | Business logic, auth, external data        |
| AI Hooks     | Structured Components, Prompts | Agent-ready development surface         |


## 📁 Project Structure

```bash
.
├── app/                    # Expo/React Native App Pages
│   ├── screens/            # UI Screens
│   ├── components/         # Reusable Components
│   ├── hooks/              # Custom Hooks (AI-aware)
│   └── utils/              # Utilities
├── convex/                 # Convex Backend Functions
│   ├── functions/          # Queries & Mutations
│   └── schema.ts           # Convex Schema (Typesafe)
├── api/                    # Private API client logic
├── agents/                 # AI Agent Integration Points
├── .env                    # Environment Variables (non-committed)
└── README.md               # Project Description
````

> 🤖 **AI Notes**: All directories follow single-responsibility. `agents/` folder is a designated integration zone for agent-like behavior or assistant extensions.


## ✅ Getting Started

### 1. Clone the Project

```bash
git clone https://github.com/your-org/your-project.git
cd your-project
```

### 2. Install Dependencies

```bash
bun install
```

### 3. Start Expo

```bash
bunx expo start
```

### 4. Connect Convex

```bash
bunx convex dev
```

### 5. Set Up Env

Create a `.env` file:

```env
PRIVATE_API_URL=https://api.myapp.com
API_KEY=supersecretkey123
CONVEX_DEPLOYMENT=my-convex-app
```

---

## 🔐 Private APIs

Private APIs live under `/api`. These are typically secured with bearer tokens or internal app keys.

* `/api/auth.ts` – Token validation, user session
* `/api/user.ts` – User data retrieval
* `/api/ai.ts` – AI prompt chains, feedback, decisions

> 🤖 These APIs return deterministic, schema-validated JSON to support agent and frontend predictability.

---

## 🧠 AI Integration Strategy

This project is designed to support intelligent agents via:

* **Predictable Schema**: All API endpoints and Convex functions return structured, typed responses.
* **Agent Hooks**: Located in `/agents`, these define entry points for autonomous functions, assistants, or LLMs.
* **Prompt-Ready Metadata**: Components, endpoints, and backend functions include comments and tags useful for prompt generation or dynamic interpretation.

---

## 📡 Convex Functions

Convex backend functions are stored in:

```bash
convex/functions/
```

You can define:

* **Queries** (e.g., `getUserProfile`)
* **Mutations** (e.g., `createPost`, `updateSetting`)
* **Scheduled Jobs** (for background tasks)

All functions are written in **Typescript** and adhere to Convex's functional and reactive paradigm.

---

## 🧩 Component Design Pattern

Each screen uses:

```tsx
<Screen>
  <Header title="Dashboard" />
  <MainContent>
    <DataList />
  </MainContent>
</Screen>
```

This allows AI agents and design tools to reason about layout and state using semantic components.

---

## 🧪 Testing

```bash
bun test
```

Tests use:

* **Jest** for unit/integration
* **MSW** for mocking APIs
* **Expo's Testing Library** for mobile interaction testing

---

## 🛠 Development Notes

* Use `bunx convex dev` to run local Convex instance
* Keep all types in `/types.ts` or co-located with their usage
* Always document APIs in `api/docs` for future AI reference
* Ensure deterministic output wherever AI agents are expected to interact

---

## 🤝 Contributing

Follow this structure:

1. clone the repo
2. Create a feature branch
3. Add your changes
4. Describe your logic clearly (include intent comments)
5. Open a PR with structured summary

---

## 📎 AI Prompt Examples (in `/agents/prompts.ts`)

```ts
export const getUserOnboardingPrompt = (user: User) => `
You're an onboarding assistant. Welcome ${user.name}, then explain how to use the app.
Return structured steps and links to screens.
`;
```

---

## 📄 License

Private Non Licensible © 2025 \ Cribnosh Technologies

---

## 🧭 Meta

* **Maintainer**: @cribnosh
* **Current Version**: 0.1.0
* **AI Agent Ready**: ✅
* **Last Updated**: July 2025

```

