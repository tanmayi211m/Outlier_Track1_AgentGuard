import Database from "better-sqlite3";
import path from "node:path";
import fs from "node:fs";

const dbPath = path.resolve(process.cwd(), "../data/agentguard.db");
fs.mkdirSync(path.dirname(dbPath), { recursive: true });
export const db = new Database(dbPath);
db.exec(`CREATE TABLE IF NOT EXISTS audit (
  id INTEGER PRIMARY KEY AUTOINCREMENT, timestamp TEXT NOT NULL, session_id TEXT,
  tool TEXT NOT NULL, decision TEXT NOT NULL, risk TEXT, reason TEXT,
  arguments_json TEXT, result_preview TEXT, injection_detected INTEGER DEFAULT 0
)`);

export function writeAudit(event: {
  sessionId?: string; tool: string; decision: string; risk?: string; reason?: string;
  args?: unknown; result?: unknown; injectionDetected?: boolean;
}) {
  db.prepare(`INSERT INTO audit(timestamp,session_id,tool,decision,risk,reason,arguments_json,result_preview,injection_detected)
    VALUES(?,?,?,?,?,?,?,?,?)`).run(
    new Date().toISOString(), event.sessionId ?? "demo-session", event.tool, event.decision,
    event.risk ?? "unknown", event.reason ?? "", JSON.stringify(event.args ?? {}),
    JSON.stringify(event.result ?? {}).slice(0, 1500), event.injectionDetected ? 1 : 0
  );
}
export function getAudit(limit = 250) {
  return db.prepare("SELECT * FROM audit ORDER BY id DESC LIMIT ?").all(Math.max(1, Math.min(limit, 1000)));
}
export function getStats() {
  const total = (db.prepare("SELECT COUNT(*) n FROM audit").get() as {n:number}).n;
  const blocked = (db.prepare("SELECT COUNT(*) n FROM audit WHERE decision='BLOCKED'").get() as {n:number}).n;
  const allowed = (db.prepare("SELECT COUNT(*) n FROM audit WHERE decision='ALLOWED'").get() as {n:number}).n;
  const injection = (db.prepare("SELECT COUNT(*) n FROM audit WHERE injection_detected=1").get() as {n:number}).n;
  return { total, blocked, allowed, injection };
}
