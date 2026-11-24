import fs from "node:fs";
import path from "node:path";
import YAML from "yaml";

export type ToolPolicy = { allowed: boolean; risk?: string; approval_required?: boolean };
export type PolicyFile = { mode?: "enforce" | "dry_run"; tools: Record<string, ToolPolicy>; prompt_injection?: {enabled?: boolean; block_on_detection?: boolean}; limits?: Record<string, number> };
const policyPath = path.resolve(process.cwd(), "policy.yaml");
export function loadPolicy(): PolicyFile {
  return YAML.parse(fs.readFileSync(policyPath, "utf8")) as PolicyFile;
}
export function savePolicy(p: PolicyFile) {
  fs.writeFileSync(policyPath, YAML.stringify(p), "utf8");
}
export function decide(tool: string, args: Record<string, unknown>) {
  const policy = loadPolicy();
  const rule = policy.tools?.[tool];
  if (!rule) return { allowed: false, risk: "high", reason: "Tool is not explicitly configured in policy." };
  if (!rule.allowed) return { allowed: false, risk: rule.risk ?? "high", reason: "Tool is disabled by AgentGuard policy." };
  if (policy.mode === "dry_run") return { allowed: false, risk: rule.risk ?? "low", reason: "Dry-run mode: execution is previewed but not forwarded." };
  if (rule.approval_required) return { allowed: false, risk: rule.risk ?? "high", reason: "Human approval is required; approval workflow is not enabled in this demo." };
  return { allowed: true, risk: rule.risk ?? "low", reason: "Allowed by policy." };
}
