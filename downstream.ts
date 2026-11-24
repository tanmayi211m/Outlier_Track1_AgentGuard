import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import path from "node:path";

const gmailServerPath = path.resolve(process.cwd(), "../gmail_server/server.py");
const python = process.env.PYTHON_EXECUTABLE || "python";
const transport = new StdioClientTransport({ command: python, args: ["-u", gmailServerPath], cwd: path.dirname(gmailServerPath) });
export const downstream = new Client({ name: "agentguard-gmail-connector", version: "1.0.0" });
await downstream.connect(transport);
export async function listDownstreamTools() {
  const result = await downstream.listTools();
  return result.tools;
}
export async function invokeDownstream(name: string, args: Record<string, unknown>) {
  return downstream.callTool({ name, arguments: args });
}
export async function closeDownstream() {
  await downstream.close();
}
