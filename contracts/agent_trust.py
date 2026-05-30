# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }

import json
from dataclasses import dataclass
from genlayer import *


@allow_storage
@dataclass
class AgentProfile:
    owner: str
    name: str
    description: str
    capabilities: str
    api_endpoint: str
    github_repo: str
    total_tasks: u256
    successful_tasks: u256
    total_earnings: u256
    reputation_score: u256
    is_active: bool
    verification_level: u256


@allow_storage
@dataclass
class TaskRecord:
    task_id: u256
    agent: str
    client: str
    description: str
    outcome: u256
    quality_score: u256
    payment: u256
    verified: bool


class AgentTrust(gl.Contract):
    agents: TreeMap[Address, AgentProfile]
    tasks: TreeMap[u256, TaskRecord]
    agent_task_ids: TreeMap[Address, str]
    task_counter: u256
    platform_fee_bps: u256
    treasury: Address

    def __init__(self):
        self.task_counter = 0
        self.platform_fee_bps = 250
        self.treasury = gl.message.sender_address

    @gl.public.view
    def get_agent(self, agent_address: str) -> dict:
        addr = Address(agent_address)
        if addr not in self.agents:
            return {"exists": False}
        agent = self.agents[addr]
        return {
            "exists": True,
            "name": agent.name,
            "description": agent.description,
            "capabilities": agent.capabilities.split(",") if agent.capabilities else [],
            "api_endpoint": agent.api_endpoint,
            "github_repo": agent.github_repo,
            "total_tasks": agent.total_tasks,
            "successful_tasks": agent.successful_tasks,
            "total_earnings": agent.total_earnings,
            "reputation_score": agent.reputation_score,
            "is_active": agent.is_active,
            "verification_level": agent.verification_level,
        }

    @gl.public.view
    def get_task(self, task_id: u256) -> dict:
        if task_id not in self.tasks:
            return {"exists": False}
        task = self.tasks[task_id]
        return {
            "exists": True,
            "task_id": task.task_id,
            "agent": task.agent,
            "client": task.client,
            "description": task.description,
            "outcome": task.outcome,
            "quality_score": task.quality_score,
            "payment": task.payment,
            "verified": task.verified,
        }

    @gl.public.view
    def get_agent_tasks(self, agent_address: str) -> DynArray[u256]:
        addr = Address(agent_address)
        if addr not in self.agent_task_ids:
            return DynArray[u256]()
        raw = self.agent_task_ids[addr]
        if not raw:
            return DynArray[u256]()
        result = DynArray[u256]()
        for x in raw.split(","):
            if x:
                result.append(u256(x))
        return result

    @gl.public.write
    def register_agent(
        self,
        name: str,
        description: str,
        capabilities: DynArray[str],
        api_endpoint: str,
        github_repo: str,
    ) -> None:
        sender = gl.message.sender_address
        if sender in self.agents:
            raise Exception("Agent already registered")
        caps_str = ",".join(capabilities) if capabilities else ""
        agent = AgentProfile(
            owner=sender.as_hex,
            name=name,
            description=description,
            capabilities=caps_str,
            api_endpoint=api_endpoint,
            github_repo=github_repo,
            total_tasks=0,
            successful_tasks=0,
            total_earnings=0,
            reputation_score=0,
            is_active=True,
            verification_level=0,
        )
        self.agents[sender] = agent

    @gl.public.write
    def create_task(self, agent_address: str, description: str) -> u256:
        sender = gl.message.sender_address
        agent_addr = Address(agent_address)
        payment = gl.message.value

        if agent_addr not in self.agents:
            raise Exception("Agent not registered")
        agent = self.agents[agent_addr]
        if not agent.is_active:
            raise Exception("Agent is not active")
        if payment == 0:
            raise Exception("Payment required")

        task_id = self.task_counter
        task = TaskRecord(
            task_id=task_id,
            agent=agent_address,
            client=sender.as_hex,
            description=description,
            outcome=0,
            quality_score=0,
            payment=payment,
            verified=False,
        )
        self.tasks[task_id] = task

        existing = ""
        if agent_addr in self.agent_task_ids:
            existing = self.agent_task_ids[agent_addr]
        if existing:
            existing = existing + "," + str(task_id)
        else:
            existing = str(task_id)
        self.agent_task_ids[agent_addr] = existing

        self.task_counter = task_id + 1
        return task_id

    @gl.public.write
    def complete_task(
        self, task_id: u256, result_summary: str, result_url: str
    ) -> None:
        if task_id not in self.tasks:
            raise Exception("Task not found")
        task = self.tasks[task_id]
        if task.agent != gl.message.sender_address.as_hex:
            raise Exception("Not task agent")
        if task.outcome != 0:
            raise Exception("Task already completed")

        task_desc = str(task.description)

        def evaluate_quality() -> str:
            web_content = ""
            if result_url:
                try:
                    web_content = gl.nondet.web.render(result_url, mode="text")[:500]
                except Exception:
                    web_content = "Could not fetch URL"

            prompt = f"""Evaluate this AI agent work result:
Task: {task_desc}
Summary: {result_summary}
Web content: {web_content}

Rate quality 0-100. Respond ONLY with JSON:
{{"score": <number>}}"""

            result = gl.nondet.exec_prompt(prompt, response_format="json")
            return json.dumps(result, sort_keys=True)

        result_json = json.loads(gl.eq_principle.strict_eq(evaluate_quality))
        quality_score = min(100, max(0, int(result_json.get("score", 70))))

        task.quality_score = quality_score
        task.verified = True

        if quality_score >= 80:
            task.outcome = 1
        elif quality_score >= 50:
            task.outcome = 2
        else:
            task.outcome = 3

        self.tasks[task_id] = task

        agent_addr = Address(task.agent)
        if agent_addr in self.agents:
            agent = self.agents[agent_addr]
            agent.total_tasks += 1
            if task.outcome == 1:
                agent.successful_tasks += 1
            if agent.total_tasks >= 3:
                success_rate = (agent.successful_tasks * 1000) // agent.total_tasks
                agent.reputation_score = success_rate
            if agent.reputation_score >= 800:
                agent.verification_level = 3
            elif agent.reputation_score >= 500:
                agent.verification_level = 2
            elif agent.reputation_score >= 100:
                agent.verification_level = 1
            self.agents[agent_addr] = agent

    @gl.public.write
    def approve_task(self, task_id: u256) -> None:
        if task_id not in self.tasks:
            raise Exception("Task not found")
        task = self.tasks[task_id]
        if task.client != gl.message.sender_address.as_hex:
            raise Exception("Not task client")
        if task.outcome == 0:
            raise Exception("Task not completed")

        agent_payment = (task.payment * (10000 - self.platform_fee_bps)) // 10000

        agent_addr = Address(task.agent)
        if agent_addr in self.agents:
            agent = self.agents[agent_addr]
            agent.total_earnings += agent_payment
            self.agents[agent_addr] = agent

    @gl.public.view
    def get_platform_stats(self) -> dict:
        return {
            "total_tasks": self.task_counter,
            "platform_fee_bps": self.platform_fee_bps,
        }
