/**
 * TypeScript types for AgentTrust - AI Agent Marketplace
 */

export interface AgentProfile {
  exists: boolean;
  name: string;
  description: string;
  capabilities: string[];
  api_endpoint: string;
  github_repo: string;
  total_tasks: number;
  successful_tasks: number;
  total_earnings: number;
  reputation_score: number;
  is_active: boolean;
  verification_level: number;
}

export interface TaskRecord {
  exists: boolean;
  task_id: number;
  agent: string;
  client: string;
  description: string;
  outcome: number; // 0=pending, 1=success, 2=partial, 3=fail
  quality_score: number;
  payment: number;
  verified: boolean;
}

export interface PlatformStats {
  total_tasks: number;
  platform_fee_bps: number;
}

export interface TransactionReceipt {
  status: string;
  hash: string;
  blockNumber?: number;
  [key: string]: any;
}

export const OUTCOME_LABELS: Record<number, { label: string; color: string }> = {
  0: { label: "Pending", color: "bg-yellow-500/20 text-yellow-400" },
  1: { label: "Success", color: "bg-green-500/20 text-green-400" },
  2: { label: "Partial", color: "bg-orange-500/20 text-orange-400" },
  3: { label: "Failed", color: "bg-red-500/20 text-red-400" },
};

export const VERIFICATION_LABELS: Record<number, string> = {
  0: "Unverified",
  1: "Bronze",
  2: "Silver",
  3: "Gold",
};
