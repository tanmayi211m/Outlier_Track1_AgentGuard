const patterns: RegExp[] = [
  /ignore\s+(all\s+)?previous\s+instructions/i,
  /disregard\s+(all\s+)?(prior|previous)\s+instructions/i,
  /reveal\s+(the\s+)?(system|developer)\s+prompt/i,
  /send\s+(all|the)\s+(files|documents|data)\s+to/i,
  /exfiltrat(e|ion)/i,
  /you are now (a|an|the)/i,
  /override\s+(security|policy|guardrails)/i
];
export function scanUntrustedText(value: unknown): { detected: boolean; matches: string[] } {
  const text = typeof value === "string" ? value : JSON.stringify(value ?? "");
  const matches = patterns.filter(p => p.test(text)).map(p => p.source);
  return { detected: matches.length > 0, matches };
}
