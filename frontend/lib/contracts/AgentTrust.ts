import { createClient } from "genlayer-js";
import { studionet } from "genlayer-js/chains";
import type { AgentProfile, TaskRecord, PlatformStats } from "./types";

class AgentTrust {
  private contractAddress: `0x${string}`;
  private client: ReturnType<typeof createClient>;

  constructor(
    contractAddress: string,
    address?: string | null,
    studioUrl?: string
  ) {
    this.contractAddress = contractAddress as `0x${string}`;

    const config: any = {
      chain: studionet,
    };

    if (address) {
      config.account = address as `0x${string}`;
    }

    if (studioUrl) {
      config.endpoint = studioUrl;
    }

    this.client = createClient(config);
  }

  updateAccount(address: string): void {
    const config: any = {
      chain: studionet,
      account: address as `0x${string}`,
    };
    this.client = createClient(config);
  }

  async getPlatformStats(): Promise<PlatformStats> {
    try {
      const result: any = await this.client.readContract({
        address: this.contractAddress,
        functionName: "get_platform_stats",
        args: [],
      });
      return {
        total_tasks: Number(result.total_tasks ?? 0),
        platform_fee_bps: Number(result.platform_fee_bps ?? 250),
      };
    } catch (error) {
      console.error("Error fetching platform stats:", error);
      return { total_tasks: 0, platform_fee_bps: 250 };
    }
  }

  async getAgent(address: string): Promise<AgentProfile | null> {
    try {
      const result: any = await this.client.readContract({
        address: this.contractAddress,
        functionName: "get_agent",
        args: [address],
      });
      if (!result || !result.exists) return null;
      return {
        exists: true,
        name: String(result.name ?? ""),
        description: String(result.description ?? ""),
        capabilities: Array.isArray(result.capabilities)
          ? result.capabilities.map(String)
          : [],
        api_endpoint: String(result.api_endpoint ?? ""),
        github_repo: String(result.github_repo ?? ""),
        total_tasks: Number(result.total_tasks ?? 0),
        successful_tasks: Number(result.successful_tasks ?? 0),
        total_earnings: Number(result.total_earnings ?? 0),
        reputation_score: Number(result.reputation_score ?? 0),
        is_active: Boolean(result.is_active),
        verification_level: Number(result.verification_level ?? 0),
      };
    } catch (error) {
      console.error("Error fetching agent:", error);
      return null;
    }
  }

  async getTask(taskId: number): Promise<TaskRecord | null> {
    try {
      const result: any = await this.client.readContract({
        address: this.contractAddress,
        functionName: "get_task",
        args: [taskId],
      });
      if (!result || !result.exists) return null;
      return {
        exists: true,
        task_id: Number(result.task_id ?? 0),
        agent: String(result.agent ?? ""),
        client: String(result.client ?? ""),
        description: String(result.description ?? ""),
        outcome: Number(result.outcome ?? 0),
        quality_score: Number(result.quality_score ?? 0),
        payment: Number(result.payment ?? 0),
        verified: Boolean(result.verified),
      };
    } catch (error) {
      console.error("Error fetching task:", error);
      return null;
    }
  }

  async getAgentTasks(address: string): Promise<number[]> {
    try {
      const result: any = await this.client.readContract({
        address: this.contractAddress,
        functionName: "get_agent_tasks",
        args: [address],
      });
      if (Array.isArray(result)) {
        return result.map(Number);
      }
      return [];
    } catch (error) {
      console.error("Error fetching agent tasks:", error);
      return [];
    }
  }

  async registerAgent(
    name: string,
    description: string,
    capabilities: string[],
    apiEndpoint: string,
    githubRepo: string
  ): Promise<string> {
    const tx = await this.client.writeContract({
      address: this.contractAddress,
      functionName: "register_agent",
      args: [name, description, capabilities, apiEndpoint, githubRepo],
      value: BigInt(0),
    });
    return String(tx);
  }

  async createTask(
    agentAddress: string,
    description: string,
    payment: bigint
  ): Promise<string> {
    const tx = await this.client.writeContract({
      address: this.contractAddress,
      functionName: "create_task",
      args: [agentAddress, description],
      value: payment,
    });
    return String(tx);
  }

  async completeTask(
    taskId: number,
    resultSummary: string,
    resultUrl: string
  ): Promise<string> {
    const tx = await this.client.writeContract({
      address: this.contractAddress,
      functionName: "complete_task",
      args: [taskId, resultSummary, resultUrl],
      value: BigInt(0),
    });
    return String(tx);
  }

  async approveTask(taskId: number): Promise<string> {
    const tx = await this.client.writeContract({
      address: this.contractAddress,
      functionName: "approve_task",
      args: [taskId],
      value: BigInt(0),
    });
    return String(tx);
  }
}

export default AgentTrust;
