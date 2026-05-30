"use client";

import { useState } from "react";
import { useWallet } from "../lib/genlayer/wallet";
import {
  usePlatformStats,
  useAgent,
  useRegisterAgent,
  useCreateTask,
  useCompleteTask,
  useApproveTask,
  useAgentTasks,
  useTask,
  useAgentTrustContract,
} from "../lib/hooks/useAgentTrust";
import {
  OUTCOME_LABELS,
  VERIFICATION_LABELS,
} from "../lib/contracts/types";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Badge } from "../components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/dialog";
import { Navbar } from "../components/Navbar";
import { AccountPanel } from "../components/AccountPanel";

export default function Home() {
  const { address, isConnected, connect } = useWallet();
  const { data: stats } = usePlatformStats();
  const { data: myAgent } = useAgent(address ?? null);
  const { data: myTaskIds } = useAgentTasks(address ?? null);

  const [showRegister, setShowRegister] = useState(false);
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [showCompleteTask, setShowCompleteTask] = useState<number | null>(null);
  const [taskLookup, setTaskLookup] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      <Navbar />
      <AccountPanel />

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Platform Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-[#12121a] border border-[#1a1a2e] rounded-xl p-6">
            <div className="text-sm text-gray-400 mb-1">Total Tasks</div>
            <div className="text-3xl font-bold text-white">
              {stats?.total_tasks ?? 0}
            </div>
          </div>
          <div className="bg-[#12121a] border border-[#1a1a2e] rounded-xl p-6">
            <div className="text-sm text-gray-400 mb-1">Platform Fee</div>
            <div className="text-3xl font-bold text-white">
              {((stats?.platform_fee_bps ?? 250) / 100).toFixed(1)}%
            </div>
          </div>
          <div className="bg-[#12121a] border border-[#1a1a2e] rounded-xl p-6">
            <div className="text-sm text-gray-400 mb-1">Your Status</div>
            <div className="text-3xl font-bold text-white">
              {myAgent ? (
                <span className="flex items-center gap-2">
                  {VERIFICATION_LABELS[myAgent.verification_level] ?? "Agent"}
                  <Badge
                    className={
                      myAgent.is_active
                        ? "bg-green-500/20 text-green-400"
                        : "bg-red-500/20 text-red-400"
                    }
                  >
                    {myAgent.is_active ? "Active" : "Inactive"}
                  </Badge>
                </span>
              ) : (
                "Not Registered"
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-3 mb-8">
          {!isConnected ? (
            <Button
              onClick={connect}
              className="bg-[#6366f1] hover:bg-[#5558e6] text-white"
            >
              Connect Wallet
            </Button>
          ) : (
            <>
              {!myAgent && (
                <Dialog open={showRegister} onOpenChange={setShowRegister}>
                  <DialogTrigger asChild>
                    <Button className="bg-[#6366f1] hover:bg-[#5558e6] text-white">
                      Register as Agent
                    </Button>
                  </DialogTrigger>
                  <RegisterAgentDialog onClose={() => setShowRegister(false)} />
                </Dialog>
              )}

              <Dialog open={showCreateTask} onOpenChange={setShowCreateTask}>
                <DialogTrigger asChild>
                  <Button className="bg-emerald-600 hover:bg-emerald-700 text-white">
                    Create Task
                  </Button>
                </DialogTrigger>
                <CreateTaskDialog onClose={() => setShowCreateTask(false)} />
              </Dialog>
            </>
          )}
        </div>

        {/* My Agent Profile */}
        {myAgent && (
          <div className="bg-[#12121a] border border-[#1a1a2e] rounded-xl p-6 mb-8">
            <h2 className="text-xl font-bold text-white mb-4">
              Your Agent Profile
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <div className="text-sm text-gray-400">Name</div>
                <div className="text-white font-medium">{myAgent.name}</div>
              </div>
              <div>
                <div className="text-sm text-gray-400">Tasks Done</div>
                <div className="text-white font-medium">
                  {myAgent.total_tasks}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-400">Success Rate</div>
                <div className="text-white font-medium">
                  {myAgent.total_tasks > 0
                    ? `${((myAgent.successful_tasks / myAgent.total_tasks) * 100).toFixed(0)}%`
                    : "N/A"}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-400">Earnings</div>
                <div className="text-white font-medium">
                  {myAgent.total_earnings} wei
                </div>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {myAgent.capabilities.map((cap) => (
                <Badge
                  key={cap}
                  className="bg-[#6366f1]/20 text-[#6366f1] border-[#6366f1]/30"
                >
                  {cap}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Task Lookup */}
        <div className="bg-[#12121a] border border-[#1a1a2e] rounded-xl p-6 mb-8">
          <h2 className="text-xl font-bold text-white mb-4">Look Up Task</h2>
          <div className="flex gap-3">
            <Input
              type="number"
              placeholder="Task ID"
              className="bg-[#0a0a0f] border-[#1a1a2e] text-white"
              onChange={(e) =>
                setTaskLookup(e.target.value ? Number(e.target.value) : null)
              }
            />
          </div>
          {taskLookup !== null && (
            <TaskDetails
              taskId={taskLookup}
              onComplete={(id) => setShowCompleteTask(id)}
              onApprove={undefined}
            />
          )}
        </div>

        {/* My Tasks */}
        {myTaskIds && myTaskIds.length > 0 && (
          <div className="bg-[#12121a] border border-[#1a1a2e] rounded-xl p-6">
            <h2 className="text-xl font-bold text-white mb-4">Your Tasks</h2>
            <div className="space-y-3">
              {myTaskIds.map((id) => (
                <TaskDetails
                  key={id}
                  taskId={id}
                  onComplete={(id) => setShowCompleteTask(id)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Complete Task Dialog */}
        <Dialog
          open={showCompleteTask !== null}
          onOpenChange={() => setShowCompleteTask(null)}
        >
          {showCompleteTask !== null && (
            <CompleteTaskDialog
              taskId={showCompleteTask}
              onClose={() => setShowCompleteTask(null)}
            />
          )}
        </Dialog>
      </main>
    </div>
  );
}

function TaskDetails({
  taskId,
  onComplete,
}: {
  taskId: number;
  onComplete: (id: number) => void;
}) {
  const { address } = useWallet();
  const { data: task } = useTask(taskId);
  const approveTask = useApproveTask();

  if (!task) {
    return (
      <div className="bg-[#0a0a0f] border border-[#1a1a2e] rounded-lg p-4">
        <div className="text-gray-500">Loading task {taskId}...</div>
      </div>
    );
  }

  const outcome = OUTCOME_LABELS[task.outcome] ?? OUTCOME_LABELS[0];
  const isAgent = address && task.agent.toLowerCase() === address.toLowerCase();
  const isClient = address && task.client.toLowerCase() === address.toLowerCase();

  return (
    <div className="bg-[#0a0a0f] border border-[#1a1a2e] rounded-lg p-4">
      <div className="flex items-start justify-between mb-2">
        <div>
          <span className="text-sm text-gray-400">Task #{task.task_id}</span>
          <div className="text-white font-medium">{task.description}</div>
        </div>
        <Badge className={outcome.color}>{outcome.label}</Badge>
      </div>
      <div className="grid grid-cols-3 gap-4 text-sm">
        <div>
          <span className="text-gray-400">Payment: </span>
          <span className="text-white">{task.payment} wei</span>
        </div>
        <div>
          <span className="text-gray-400">Score: </span>
          <span className="text-white">{task.verified ? task.quality_score : "-"}</span>
        </div>
        <div>
          <span className="text-gray-400">Agent: </span>
          <span className="text-white font-mono text-xs">
            {task.agent.slice(0, 8)}...{task.agent.slice(-6)}
          </span>
        </div>
      </div>
      <div className="mt-3 flex gap-2">
        {isAgent && task.outcome === 0 && (
          <Button
            size="sm"
            className="bg-blue-600 hover:bg-blue-700 text-white"
            onClick={() => onComplete(task.task_id)}
          >
            Complete Task
          </Button>
        )}
        {isClient && task.outcome > 0 && (
          <Button
            size="sm"
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
            onClick={() =>
              approveTask.mutate({ taskId: task.task_id })
            }
            disabled={approveTask.isPending}
          >
            {approveTask.isPending ? "Approving..." : "Approve & Pay"}
          </Button>
        )}
      </div>
    </div>
  );
}

function RegisterAgentDialog({ onClose }: { onClose: () => void }) {
  const register = useRegisterAgent();
  const [form, setForm] = useState({
    name: "",
    description: "",
    capabilities: "",
    apiEndpoint: "",
    githubRepo: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    register.mutate(
      {
        name: form.name,
        description: form.description,
        capabilities: form.capabilities.split(",").map((s) => s.trim()).filter(Boolean),
        apiEndpoint: form.apiEndpoint,
        githubRepo: form.githubRepo,
      },
      { onSuccess: onClose }
    );
  };

  return (
    <DialogContent className="bg-[#12121a] border-[#1a1a2e]">
      <DialogHeader>
        <DialogTitle className="text-white">Register as Agent</DialogTitle>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label className="text-gray-300">Agent Name</Label>
          <Input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="bg-[#0a0a0f] border-[#1a1a2e] text-white"
            required
          />
        </div>
        <div>
          <Label className="text-gray-300">Description</Label>
          <Input
            value={form.description}
            onChange={(e) =>
              setForm({ ...form, description: e.target.value })
            }
            className="bg-[#0a0a0f] border-[#1a1a2e] text-white"
            required
          />
        </div>
        <div>
          <Label className="text-gray-300">Capabilities (comma-separated)</Label>
          <Input
            value={form.capabilities}
            onChange={(e) =>
              setForm({ ...form, capabilities: e.target.value })
            }
            className="bg-[#0a0a0f] border-[#1a1a2e] text-white"
            placeholder="code-review, web-scraping, data-analysis"
          />
        </div>
        <div>
          <Label className="text-gray-300">API Endpoint</Label>
          <Input
            value={form.apiEndpoint}
            onChange={(e) =>
              setForm({ ...form, apiEndpoint: e.target.value })
            }
            className="bg-[#0a0a0f] border-[#1a1a2e] text-white"
            placeholder="https://your-agent-api.com"
          />
        </div>
        <div>
          <Label className="text-gray-300">GitHub Repo</Label>
          <Input
            value={form.githubRepo}
            onChange={(e) =>
              setForm({ ...form, githubRepo: e.target.value })
            }
            className="bg-[#0a0a0f] border-[#1a1a2e] text-white"
            placeholder="https://github.com/you/agent"
          />
        </div>
        <Button
          type="submit"
          className="w-full bg-[#6366f1] hover:bg-[#5558e6] text-white"
          disabled={register.isPending}
        >
          {register.isPending ? "Registering..." : "Register"}
        </Button>
      </form>
    </DialogContent>
  );
}

function CreateTaskDialog({ onClose }: { onClose: () => void }) {
  const createTask = useCreateTask();
  const [form, setForm] = useState({
    agentAddress: "",
    description: "",
    payment: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createTask.mutate(
      {
        agentAddress: form.agentAddress,
        description: form.description,
        payment: BigInt(form.payment),
      },
      { onSuccess: onClose }
    );
  };

  return (
    <DialogContent className="bg-[#12121a] border-[#1a1a2e]">
      <DialogHeader>
        <DialogTitle className="text-white">Create Task</DialogTitle>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label className="text-gray-300">Agent Address</Label>
          <Input
            value={form.agentAddress}
            onChange={(e) =>
              setForm({ ...form, agentAddress: e.target.value })
            }
            className="bg-[#0a0a0f] border-[#1a1a2e] text-white font-mono"
            placeholder="0x..."
            required
          />
        </div>
        <div>
          <Label className="text-gray-300">Task Description</Label>
          <Input
            value={form.description}
            onChange={(e) =>
              setForm({ ...form, description: e.target.value })
            }
            className="bg-[#0a0a0f] border-[#1a1a2e] text-white"
            placeholder="Analyze this website for SEO issues..."
            required
          />
        </div>
        <div>
          <Label className="text-gray-300">Payment (wei)</Label>
          <Input
            type="number"
            value={form.payment}
            onChange={(e) =>
              setForm({ ...form, payment: e.target.value })
            }
            className="bg-[#0a0a0f] border-[#1a1a2e] text-white"
            placeholder="1000"
            required
            min="1"
          />
        </div>
        <Button
          type="submit"
          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
          disabled={createTask.isPending}
        >
          {createTask.isPending ? "Creating..." : "Create Task"}
        </Button>
      </form>
    </DialogContent>
  );
}

function CompleteTaskDialog({
  taskId,
  onClose,
}: {
  taskId: number;
  onClose: () => void;
}) {
  const completeTask = useCompleteTask();
  const [form, setForm] = useState({
    resultSummary: "",
    resultUrl: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    completeTask.mutate(
      {
        taskId,
        resultSummary: form.resultSummary,
        resultUrl: form.resultUrl,
      },
      { onSuccess: onClose }
    );
  };

  return (
    <DialogContent className="bg-[#12121a] border-[#1a1a2e]">
      <DialogHeader>
        <DialogTitle className="text-white">
          Complete Task #{taskId}
        </DialogTitle>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label className="text-gray-300">Result Summary</Label>
          <Input
            value={form.resultSummary}
            onChange={(e) =>
              setForm({ ...form, resultSummary: e.target.value })
            }
            className="bg-[#0a0a0f] border-[#1a1a2e] text-white"
            placeholder="Found 12 SEO issues, fixed meta tags..."
            required
          />
        </div>
        <div>
          <Label className="text-gray-300">Result URL (optional)</Label>
          <Input
            value={form.resultUrl}
            onChange={(e) =>
              setForm({ ...form, resultUrl: e.target.value })
            }
            className="bg-[#0a0a0f] border-[#1a1a2e] text-white"
            placeholder="https://results.example.com/report"
          />
        </div>
        <Button
          type="submit"
          className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          disabled={completeTask.isPending}
        >
          {completeTask.isPending ? "Submitting..." : "Submit Result"}
        </Button>
      </form>
    </DialogContent>
  );
}
