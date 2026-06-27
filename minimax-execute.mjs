import { mkdir, readFile, writeFile } from "node:fs/promises";
import { isAbsolute, join, normalize, relative, resolve } from "node:path";

const root = process.cwd();
const defaultMinimaxBaseUrl = "https://api.minimax.chat/v1";
const defaultMinimaxModel = "MiniMax-Text-01";

async function readEnvValue(name) {
  if (process.env[name]) return process.env[name];
  for (const fileName of [".env.local", ".env"]) {
    try {
      const text = await readFile(join(root, fileName), "utf8");
      const line = text.split(/\r?\n/).find((item) => item.trim().startsWith(`${name}=`));
      if (!line) continue;
      const raw = line.slice(line.indexOf("=") + 1).trim();
      return raw.replace(/^['"]|['"]$/g, "");
    } catch {
      // Optional env files.
    }
  }
  return "";
}

function argValue(name) {
  const prefix = `--${name}=`;
  const inline = process.argv.find((item) => item.startsWith(prefix));
  if (inline) return inline.slice(prefix.length);
  const index = process.argv.indexOf(`--${name}`);
  return index >= 0 ? process.argv[index + 1] : "";
}

function positionalTask() {
  const args = process.argv.slice(2).filter((item) => !item.startsWith("--"));
  return args.join(" ").trim();
}

async function taskText() {
  const file = argValue("task-file");
  if (file) return readFile(normalize(file), "utf8");
  return argValue("task") || positionalTask();
}

async function readContextFiles() {
  const list = argValue("files");
  if (!list) return [];
  if (!process.argv.includes("--allow-code-export")) {
    throw new Error("Refusing to send files to MiniMax without --allow-code-export");
  }
  const maxChars = Math.max(2000, Number(argValue("max-file-chars")) || 16000);
  const paths = list.split(",").map((item) => item.trim()).filter(Boolean);
  const entries = [];
  for (const path of paths) {
    const normalized = normalize(path);
    const resolved = resolve(root, normalized);
    const rootRelative = relative(root, resolved);
    const fileName = normalized.split(/[\\/]/).pop() || normalized;
    const looksSensitive = /^\.env(\.|$)/.test(fileName)
      || /\.(pem|p12|pfx)$/i.test(fileName)
      || /(secret|credential|token|api[-_]?key|apikey)/i.test(fileName);
    if (rootRelative.startsWith("..") || isAbsolute(rootRelative)) {
      entries.push({ path, error: "Skipped: file is outside the workspace." });
      continue;
    }
    if (looksSensitive) {
      entries.push({ path, error: "Skipped: file name looks sensitive." });
      continue;
    }
    try {
      const text = await readFile(resolved, "utf8");
      entries.push({ path, content: text.slice(0, maxChars), truncated: text.length > maxChars });
    } catch (error) {
      entries.push({ path, error: String(error?.message || error) });
    }
  }
  return entries;
}

function jsonFromModelText(text) {
  if (!text) return null;
  const clean = text.replace(/```json|```/g, "").trim();
  const parseCandidate = (candidate) => {
    try {
      return JSON.parse(candidate);
    } catch {
      return null;
    }
  };
  const balancedObject = (() => {
    const start = clean.indexOf("{");
    if (start < 0) return "";
    let depth = 0;
    let inString = false;
    let escape = false;
    for (let index = start; index < clean.length; index += 1) {
      const char = clean[index];
      if (escape) {
        escape = false;
        continue;
      }
      if (char === "\\") {
        escape = true;
        continue;
      }
      if (char === "\"") {
        inString = !inString;
        continue;
      }
      if (inString) continue;
      if (char === "{") depth += 1;
      if (char === "}") {
        depth -= 1;
        if (depth === 0) return clean.slice(start, index + 1);
      }
    }
    return "";
  })();
  const greedy = clean.match(/\{[\s\S]*\}/)?.[0] || "";
  for (const candidate of [clean, balancedObject, greedy]) {
    const parsed = parseCandidate(candidate) || parseCandidate(candidate.replace(/,\s*([}\]])/g, "$1"));
    if (parsed) return parsed;
  }
  return null;
}

function outputTextFromChatCompletion(payload) {
  const content = payload?.choices?.[0]?.message?.content;
  if (Array.isArray(content)) {
    return content.map((item) => item.text || item.content || "").filter(Boolean).join("\n");
  }
  return String(content || payload?.choices?.[0]?.text || "").trim();
}

function messages(task, contextFiles) {
  return [
    {
      role: "system",
      content: [
        "You are the MiniMax execution drafter for the FiveCrop project.",
        "You do not directly edit files. Produce a concrete, reviewable execution draft for Codex to audit and apply.",
        "Prefer small scoped changes, identify risks, and include tests.",
        "Do not ask for secrets. Do not include plaintext API keys.",
        "Return only JSON."
      ].join("\n")
    },
    {
      role: "user",
      content: JSON.stringify({
        outputContract: {
          understanding: "short restatement of the task",
          proposedPlan: ["ordered execution steps"],
          fileChanges: [
            {
              path: "relative file path",
              intent: "why this file changes",
              patchSketch: "specific patch or code sketch, not automatically applied"
            }
          ],
          risks: ["risks or uncertain assumptions"],
          tests: ["commands or checks Codex should run"],
          decisionPoints: ["choices Codex should make before applying"],
          confidence: 0.0
        },
        task,
        contextFiles
      })
    }
  ];
}

async function main() {
  const task = await taskText();
  if (!task) throw new Error("Usage: npm run minimax:exec -- --task \"...\" [--files app.js,server.mjs]");

  const provider = String(await readEnvValue("AUX_LLM_PROVIDER") || "local").toLowerCase();
  const apiKey = await readEnvValue("MINIMAX_API_KEY");
  const model = await readEnvValue("MINIMAX_MODEL") || defaultMinimaxModel;
  const baseUrl = await readEnvValue("MINIMAX_BASE_URL") || defaultMinimaxBaseUrl;
  const timeoutMs = Math.max(5000, Number(await readEnvValue("AUX_LLM_REQUEST_TIMEOUT_MS")) || 30000);
  const contextFiles = await readContextFiles();
  const outputPath = argValue("out") || join("tmp", "minimax-execution-draft.json");

  await mkdir(join(root, "tmp"), { recursive: true });

  if (provider !== "minimax" || !apiKey) {
    const fallback = {
      provider: "local",
      model: "none",
      ready: false,
      fallbackReason: provider !== "minimax" ? "AUX_LLM_PROVIDER is not minimax" : "MINIMAX_API_KEY is missing",
      understanding: task,
      proposedPlan: ["Configure MiniMax env vars, then rerun this command."],
      fileChanges: [],
      risks: ["MiniMax execution draft was not generated."],
      tests: [],
      decisionPoints: ["Add AUX_LLM_PROVIDER=minimax and MINIMAX_API_KEY to .env.local."],
      confidence: 0
    };
    await writeFile(outputPath, JSON.stringify(fallback, null, 2), "utf8");
    console.log(`minimax-exec-fallback out=${outputPath} reason=${fallback.fallbackReason}`);
    return;
  }

  const requestDraft = async (structured = true) => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const requestBody = {
        model,
        messages: messages(task, contextFiles),
        temperature: 0.2,
        max_tokens: 1800
      };
      if (structured) requestBody.response_format = { type: "json_object" };
      return await fetch(`${baseUrl.replace(/\/$/, "")}/chat/completions`, {
        method: "POST",
        signal: controller.signal,
        headers: {
          authorization: `Bearer ${apiKey}`,
          "content-type": "application/json"
        },
        body: JSON.stringify(requestBody)
      });
    } finally {
      clearTimeout(timeout);
    }
  };

  let response = await requestDraft(true);
  let payload = await response.json().catch(() => ({}));
  if (!response.ok && response.status === 400 && /response_format|json_object|json|format/i.test(JSON.stringify(payload))) {
    response = await requestDraft(false);
    payload = await response.json().catch(() => ({}));
  }
  if (!response.ok) {
    throw new Error(`MiniMax HTTP ${response.status}: ${JSON.stringify(payload).slice(0, 500)}`);
  }
  const draft = jsonFromModelText(outputTextFromChatCompletion(payload));
  if (!draft) throw new Error("MiniMax returned non-JSON content");
  const result = {
    provider: "minimax",
    model,
    ready: true,
    generatedAt: new Date().toISOString(),
    task,
    ...draft
  };
  await writeFile(outputPath, JSON.stringify(result, null, 2), "utf8");
  console.log(`minimax-exec-ok out=${outputPath} files=${contextFiles.length}`);
}

main().catch((error) => {
  console.error(`minimax-exec-failed ${String(error?.message || error)}`);
  process.exitCode = 1;
});
