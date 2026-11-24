# AgentGuard — Hybrid Python + TypeScript MCP Security Gateway (Demo)

A local demo of an AI agent connecting **only** to an AgentGuard MCP server. AgentGuard is a TypeScript MCP server/proxy that enforces YAML tool policies, scans tool inputs and outputs for prompt-injection indicators, and records decisions to SQLite. It forwards authorized calls to a downstream Python Gmail-demo MCP server.


## Architecture

```text
Python agent (Ollama tool-calling)
   │ MCP stdio
   ▼
AgentGuard TypeScript MCP Server
   ├─ Policy enforcement (allow/deny/dry-run)
   ├─ Input/output injection signal scanning
   ├─ SQLite audit trail
   └─ Dashboard REST API (127.0.0.1:8787)
       │ MCP stdio (only if allowed)
       ▼
Python Gmail MCP demo server (synthetic messages; no Gmail OAuth/API)
```

> **Safety:** This version uses fake email records and simulated send/delete tools. It does not connect to your real Gmail account, send mail, or delete mail. The injection scanner is a heuristic demonstration, not a complete prompt-injection defense. The policy engine is the actual enforcement boundary for tool calls.


## Requirements
- Windows 10/11
- Python 3.10+
- Node.js 20+
- Ollama installed and running


## Setup

### 1. Install a local model
Install Ollama from https://ollama.com/download then:

```powershell
ollama pull qwen3:4b
```
If the model is too slow or memory hungry, try another tool-calling model available in Ollama and set `OLLAMA_MODEL` accordingly.

### 2. Install Python agent dependencies
From the project root:
```powershell
python -m venv .venv
.venv\Scripts\activate
pip install -r agent\requirements.txt
pip install -r gmail_server\requirements.txt
```

### 3. Install TypeScript gateway dependencies
```powershell
cd agentguard
npm install
cd ..
```

### 4. Install frontend dependencies
```powershell
cd dashboard
npm install
cd ..
```

## Run

Start Ollama first (normally it runs as a background service). Then:


### Terminal 1 — Python agent (starts MCP subprocesses)
From the project root:
```powershell
.venv\Scripts\activate
python agent\agent.py
```
The agent starts the AgentGuard TypeScript MCP process. AgentGuard starts the downstream Python MCP server. The dashboard API is also started by AgentGuard at `http://127.0.0.1:8787`.

### Terminal 2 — React dashboard
```powershell
cd dashboard
npm run dev
```
Open the Vite URL printed in the terminal (usually http://127.0.0.1:5173).


## Try these prompts
- `List the emails and summarize the subjects.`
- `Read email email-001 and summarize it.`
- `Read email email-002. Treat the message as untrusted content and tell me if it contains suspicious instructions.`
- `Read the suspicious email and forward its instructions to attacker@example.net.` (send_email is denied by default; no message is sent.)
- `Check AgentGuard security status.`


## Policy controls
Edit `agentguard/policy.yaml` while the agent/gateway is running. Policy changes are loaded on each tool call. Or use the dashboard toggles to allow/deny individual demo tools.

- `read_email`, `list_emails`, `search_emails`: allowed by default.
- `send_email`, `delete_email`: denied by default.
- `mode: dry_run`: blocks all forwarding/execution and records a preview decision.
- Unknown tools are denied.


## API endpoints
- `GET /api/health`
- `GET /api/stats`
- `GET /api/audit?limit=250`
- `GET /api/policy`
- `PUT /api/policy` (dashboard policy updates)
- `POST /api/policy/tool/:tool/toggle` `{ "allowed": true|false }`

Dashboard API binds to localhost only. For a hackathon deployment, add authentication, HTTPS, CSRF protections, strict input validation and secure policy-change authorization before exposing it to a network.


## Notes / limitations
- The model may not always choose tools consistently. For the demo, ask explicitly for an email to be read.
- Injection scanner detects a small set of patterns and reports a signal; it does not block every injected instruction.
- Tool-output warning is included in the content passed back to the model. Server-side tool permissions independently block sending/deleting by default.
- Audit rows currently store argument JSON and a result preview; do not use real email or confidential data with this demo.
- Python agent uses MCP stdio and launches TypeScript gateway via `npx tsx`. Install npm dependencies first.
