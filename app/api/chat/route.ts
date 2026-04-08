import { NextResponse } from "next/server";
import { readJson } from "@/lib/localDb";

interface Message { role: "user" | "assistant"; content: string; }

interface AiSettings {
  provider: string;
  openaiKey: string; openaiModel: string;
  geminiKey: string; geminiModel: string;
  claudeKey: string; claudeModel: string;
  openrouterKey: string; openrouterModel: string;
  assistantName: string;
}

function buildSiteContext(): string {
  try {
    const config   = readJson<Record<string, string>>("config.json");
    const projects = readJson<{ items: Record<string, unknown>[] }>("projects.json");
    const career   = readJson<{ intro: string; sections: { title: string; items: Record<string, string>[] }[] }>("career.json");
    const skills   = readJson<{ groups: { name: string; items: string[] }[] }>("skills.json");

    const projectList = projects.items.map(p =>
      `• ${p.title} (${p.category}, ${p.year}): ${p.description}. Tech: ${(p.tech as string[]).join(", ")}. ${p.link ? `Link: ${p.link}` : ""}`
    ).join("\n");

    const careerList = career.sections.map(s =>
      `${s.title}:\n` + s.items.map(i => `  • ${i.title} at ${i.org || "N/A"} (${i.years}) — ${i.type}`).join("\n")
    ).join("\n\n");

    const skillList = skills.groups.map(g => `${g.name}: ${g.items.join(", ")}`).join("\n");

    return `
=== PORTFOLIO OWNER PROFILE ===
Name: ${config.heroTitle || "N/A"}
Role/Title: ${config.heroSubtitle || "N/A"}
Location: ${config.location || "N/A"}
Email: ${config.email || "N/A"}
About: ${config.aboutText || "N/A"}
GitHub: ${config.github || "N/A"}
LinkedIn: ${config.linkedin || "N/A"}
Twitter: ${config.twitter || "N/A"}

=== PROJECTS ===
${projectList || "No projects listed."}

=== CAREER & EDUCATION ===
${careerList || "No career info listed."}

=== SKILLS ===
${skillList || "No skills listed."}
`.trim();
  } catch {
    return "Portfolio data unavailable.";
  }
}

async function callOpenAI(key: string, model: string, systemPrompt: string, messages: Message[]): Promise<string> {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${key}` },
    body: JSON.stringify({ model, messages: [{ role: "system", content: systemPrompt }, ...messages], max_tokens: 400, temperature: 0.5 }),
  });
  if (!res.ok) throw new Error(`OpenAI error: ${await res.text()}`);
  return (await res.json()).choices?.[0]?.message?.content ?? "No response.";
}

async function callGemini(key: string, model: string, systemPrompt: string, messages: Message[]): Promise<string> {
  const contents = messages.map(m => ({ role: m.role === "assistant" ? "model" : "user", parts: [{ text: m.content }] }));
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model.trim()}:generateContent?key=${key}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ system_instruction: { parts: [{ text: systemPrompt }] }, contents, generationConfig: { maxOutputTokens: 600, temperature: 0.5 } }),
  });
  if (!res.ok) throw new Error(`Gemini error: ${await res.text()}`);
  return (await res.json()).candidates?.[0]?.content?.parts?.[0]?.text ?? "No response.";
}

async function callClaude(key: string, model: string, systemPrompt: string, messages: Message[]): Promise<string> {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-api-key": key, "anthropic-version": "2023-06-01" },
    body: JSON.stringify({ model, max_tokens: 400, system: systemPrompt, messages }),
  });
  if (!res.ok) throw new Error(`Claude error: ${await res.text()}`);
  return (await res.json()).content?.[0]?.text ?? "No response.";
}

async function callOpenRouter(key: string, model: string, systemPrompt: string, messages: Message[]): Promise<string> {
  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${key}`, "HTTP-Referer": "https://portfolio.vercel.app", "X-Title": "Portfolio AI Assistant" },
    body: JSON.stringify({ model, messages: [{ role: "system", content: systemPrompt }, ...messages], max_tokens: 400, temperature: 0.5 }),
  });
  if (!res.ok) throw new Error(`OpenRouter error: ${await res.text()}`);
  return (await res.json()).choices?.[0]?.message?.content ?? "No response.";
}

export async function POST(req: Request) {
  try {
    const { messages }: { messages: Message[] } = await req.json();
    if (!messages?.length) return NextResponse.json({ error: "No messages provided" }, { status: 400 });

    const settings = readJson<AiSettings>("ai-settings.json");
    const siteContext = buildSiteContext();
    const systemPrompt = `You are a concise AI assistant for a personal portfolio website. Answer questions about the portfolio owner using ONLY the data below.\n\nRules:\n- Use ONLY the data provided. Never invent details.\n- If info isn't in the data, say: "I don't have that info — reach out via the contact page."\n- Keep replies short (2-4 sentences max). Be friendly and professional.\n- Don't mention you're an AI or discuss your model/technology.\n\nPORTFOLIO DATA:\n${siteContext}\nEND DATA`;

    const { provider } = settings;
    let reply: string;

    if (provider === "openai") {
      if (!settings.openaiKey) throw new Error("OpenAI API key not configured. Please add it in the admin AI settings.");
      reply = await callOpenAI(settings.openaiKey, settings.openaiModel, systemPrompt, messages);
    } else if (provider === "gemini") {
      if (!settings.geminiKey) throw new Error("Gemini API key not configured. Please add it in the admin AI settings.");
      reply = await callGemini(settings.geminiKey, settings.geminiModel, systemPrompt, messages);
    } else if (provider === "claude") {
      if (!settings.claudeKey) throw new Error("Claude API key not configured. Please add it in the admin AI settings.");
      reply = await callClaude(settings.claudeKey, settings.claudeModel, systemPrompt, messages);
    } else if (provider === "openrouter") {
      if (!settings.openrouterKey) throw new Error("OpenRouter API key not configured. Please add it in the admin AI settings.");
      reply = await callOpenRouter(settings.openrouterKey, settings.openrouterModel, systemPrompt, messages);
    } else {
      throw new Error("No AI provider configured. Please set one up in the admin AI settings.");
    }

    return NextResponse.json({ reply });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Unknown error" }, { status: 500 });
  }
}
