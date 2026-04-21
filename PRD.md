# PRD: Copilot Progress Reporter
### VS Code Extension — v1.0

---

## Overview

A lightweight VS Code extension that registers a tool into GitHub Copilot's agentic loop. When Copilot runs a multi-step task, it calls this tool at key moments — start, each todo step, and finish — and the tool fires a POST request to a backend endpoint with a structured progress payload.

The goal is simple: **know what Copilot is doing, in real time, from your own backend.**

---

## Problem

When Copilot runs in agent mode, it works autonomously through a task. There is currently no native way to observe or record that progress outside of the VS Code UI. If you want your own system to know what Copilot is doing — for logging, dashboards, auditing, or triggering downstream actions — you have no hook today.

---

## Goals

- Report task start, step-by-step progress, and task completion to a backend endpoint
- Keep it minimal and reliable in v1 — no complex logic, just clean reporting
- Design the payload and architecture so new event types can be added later with zero friction
- The extension should be invisible — no UI, no popups, just a registered tool that works in the background

---

## Out of Scope (v1)

- Authentication / API key management
- Retry logic on failed POST requests
- A settings UI inside VS Code
- Reporting errors or Copilot failures (future)
- Any dashboard or frontend to consume the data (that's your backend's job)

---

## How It Works

The extension registers a single tool with VS Code's language model tool API. Copilot can see this tool during agentic tasks and decides when to call it based on its description. The tool accepts a structured payload and fires a POST request. That's it.

---

## The Tool

**Name:** `reportProgress`

**Description given to Copilot:**
> "Reports the current progress of an agentic task to an external backend. Call this when the task starts, after each step in the todo list is completed, and when the full task is finished."

**Inputs Copilot must provide:**

| Field | Type | Description |
|---|---|---|
| `event` | string | One of: `task_start`, `step_complete`, `task_finish` |
| `stepCurrent` | number | The current step number (e.g. 2) |
| `stepTotal` | number | Total number of steps in the todo list (e.g. 5) |
| `stepLabel` | string | A short description of the current step |
| `taskSummary` | string | A one-line description of the overall task |

---

## Event Types (v1)

### `task_start`
Fired when Copilot begins a new agentic task, before any steps are executed.

```json
{
  "event": "task_start",
  "stepCurrent": 0,
  "stepTotal": 4,
  "stepLabel": "Planning task",
  "taskSummary": "Refactor the auth module to use JWT",
  "timestamp": "2025-04-21T10:00:00Z"
}
```

---

### `step_complete`
Fired after each item in Copilot's todo list is completed.

```json
{
  "event": "step_complete",
  "stepCurrent": 2,
  "stepTotal": 4,
  "stepLabel": "Updated login handler to validate JWT signature",
  "taskSummary": "Refactor the auth module to use JWT",
  "timestamp": "2025-04-21T10:01:45Z"
}
```

The `stepCurrent / stepTotal` gives you the progress ratio — e.g. **2/4**.

---

### `task_finish`
Fired when Copilot has completed all steps and is returning to the user.

```json
{
  "event": "task_finish",
  "stepCurrent": 4,
  "stepTotal": 4,
  "stepLabel": "All steps complete",
  "taskSummary": "Refactor the auth module to use JWT",
  "timestamp": "2025-04-21T10:04:10Z"
}
```

---

## POST Request Behaviour

- **Method:** POST
- **Endpoint:** Configured in `.vscode/settings.json` (see Configuration)
- **Headers:** `Content-Type: application/json`
- **Body:** The event payload above
- **On failure (v1):** Log to VS Code output panel, do not retry, do not block Copilot

---

## Configuration

Set the endpoint in your workspace `settings.json`. No UI needed:

```json
{
  "copilotReporter.endpoint": "https://your-backend.com/copilot/progress"
}
```

This is the only setting in v1. Future versions may add auth headers, environment flags, or filter rules here.

---

## File Structure

```
copilot-reporter/
├── src/
│   └── extension.ts        ← tool registration + POST logic
├── package.json            ← extension manifest + tool declaration
├── tsconfig.json
└── README.md
```

Intentionally flat. No services layer, no abstraction overhead — easy to read and modify.

---

## Future Expansion (Not v1)

The payload shape and event type enum are designed to grow without breaking changes. Potential v2+ additions:

| Addition | What it enables |
|---|---|
| `task_error` event | Report when Copilot hits a blocker |
| `auth` header config | Secure your endpoint with a token |
| Retry on failure | Reliability for flaky networks |
| `agentId` field | Track multiple Copilot sessions |
| Filter by event type | Only send `task_finish` if that's all you need |
| Metadata field | Pass arbitrary key-value pairs per event |

---

## Success Criteria for v1

- [ ] Extension installs and activates in VS Code without errors
- [ ] Copilot calls the tool at task start, after each step, and at finish during an agentic task
- [ ] Each call results in a POST to the configured endpoint with a correctly shaped payload
- [ ] A `timestamp` is added automatically — Copilot does not need to provide it
- [ ] Failed POSTs are logged silently and do not interrupt Copilot's task
- [ ] Endpoint is configurable per workspace via `settings.json`

---

*v1.0 — scoped to be built and shipped in a single session.*