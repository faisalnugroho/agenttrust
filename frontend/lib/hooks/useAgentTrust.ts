"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import AgentTrust from "../contracts/AgentTrust";
import { getContractAddress, getStudioUrl } from "../genlayer/client";
import { useWallet } from "../genlayer/wallet";
import { success, error, configError } from "../utils/toast";
import type { AgentProfile, TaskRecord, PlatformStats } from "../contracts/types";

export function useAgentTrustContract(): AgentTrust | null {
  const { address } = useWallet();
  const contractAddress = getContractAddress();
  const studioUrl = getStudioUrl();

  const contract = useMemo(() => {
    if (!contractAddress) {
      return null;
    }
    return new AgentTrust(contractAddress, address, studioUrl);
  }, [contractAddress, address, studioUrl]);

  return contract;
}

export function usePlatformStats() {
  const contract = useAgentTrustContract();
  return useQuery<PlatformStats>({
    queryKey: ["platformStats"],
    queryFn: () => contract!.getPlatformStats(),
    enabled: !!contract,
    refetchInterval: 10000,
  });
}

export function useAgent(agentAddress: string | null) {
  const contract = useAgentTrustContract();
  return useQuery<AgentProfile | null>({
    queryKey: ["agent", agentAddress],
    queryFn: () => contract!.getAgent(agentAddress!),
    enabled: !!contract && !!agentAddress,
  });
}

export function useAgentTasks(agentAddress: string | null) {
  const contract = useAgentTrustContract();
  return useQuery<number[]>({
    queryKey: ["agentTasks", agentAddress],
    queryFn: () => contract!.getAgentTasks(agentAddress!),
    enabled: !!contract && !!agentAddress,
  });
}

export function useTask(taskId: number | null) {
  const contract = useAgentTrustContract();
  return useQuery<TaskRecord | null>({
    queryKey: ["task", taskId],
    queryFn: () => contract!.getTask(taskId!),
    enabled: !!contract && taskId !== null,
  });
}

export function useRegisterAgent() {
  const contract = useAgentTrustContract();
  const queryClient = useQueryClient();
  const { address } = useWallet();

  return useMutation({
    mutationFn: async ({
      name,
      description,
      capabilities,
      apiEndpoint,
      githubRepo,
    }: {
      name: string;
      description: string;
      capabilities: string[];
      apiEndpoint: string;
      githubRepo: string;
    }) => {
      if (!contract) throw new Error("Contract not configured");
      return contract.registerAgent(
        name,
        description,
        capabilities,
        apiEndpoint,
        githubRepo
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agent", address] });
      success("Agent registered successfully!");
    },
    onError: (err: Error) => {
      error("Registration failed", err.message);
    },
  });
}

export function useCreateTask() {
  const contract = useAgentTrustContract();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      agentAddress,
      description,
      payment,
    }: {
      agentAddress: string;
      description: string;
      payment: bigint;
    }) => {
      if (!contract) throw new Error("Contract not configured");
      return contract.createTask(agentAddress, description, payment);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["platformStats"] });
      success("Task created successfully!");
    },
    onError: (err: Error) => {
      error("Task creation failed", err.message);
    },
  });
}

export function useCompleteTask() {
  const contract = useAgentTrustContract();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      taskId,
      resultSummary,
      resultUrl,
    }: {
      taskId: number;
      resultSummary: string;
      resultUrl: string;
    }) => {
      if (!contract) throw new Error("Contract not configured");
      return contract.completeTask(taskId, resultSummary, resultUrl);
    },
    onSuccess: (_, { taskId }) => {
      queryClient.invalidateQueries({ queryKey: ["task", taskId] });
      queryClient.invalidateQueries({ queryKey: ["platformStats"] });
      success("Task completed! AI evaluation in progress...");
    },
    onError: (err: Error) => {
      error("Task completion failed", err.message);
    },
  });
}

export function useApproveTask() {
  const contract = useAgentTrustContract();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ taskId }: { taskId: number }) => {
      if (!contract) throw new Error("Contract not configured");
      return contract.approveTask(taskId);
    },
    onSuccess: (_, { taskId }) => {
      queryClient.invalidateQueries({ queryKey: ["task", taskId] });
      queryClient.invalidateQueries({ queryKey: ["platformStats"] });
      success("Task approved! Payment sent to agent.");
    },
    onError: (err: Error) => {
      error("Approval failed", err.message);
    },
  });
}
