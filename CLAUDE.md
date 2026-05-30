# CLAUDE.md

This file provides guidance to Claude Code when working with this repository.

## Quick Commands

```bash
npm run deploy          # Deploy contracts via GenLayer CLI
npm run dev             # Start frontend dev server
npm run build           # Build frontend for production
gltest                  # Run contract tests
genlayer network        # Select network
```

## Architecture

```
contracts/          # Python intelligent contracts
frontend/           # Next.js 16 app (TypeScript, TanStack Query, Radix UI)
deploy/             # TypeScript deployment scripts
test/               # Python integration tests
```

## Project: AgentTrust

AI Agent Marketplace on GenLayer blockchain. Agents register, receive tasks, get AI-evaluated, and earn payments.

### Contract: agent_trust.py
- `register_agent(name, desc, caps, endpoint, repo)` - Register AI agent
- `create_task(agent_addr, description)` payable - Create task with payment
- `complete_task(task_id, summary, url)` - Submit results for AI evaluation
- `approve_task(task_id)` - Client approves and triggers payment
- `get_platform_stats()` - Total tasks and fee
- `get_agent(addr)` - Get agent profile
- `get_task(id)` - Get task details
- `get_agent_tasks(addr)` - Get agent's task IDs

### Frontend
- `lib/contracts/AgentTrust.ts` - Contract interaction class
- `lib/hooks/useAgentTrust.ts` - React hooks with TanStack Query
- `app/page.tsx` - Main marketplace UI
