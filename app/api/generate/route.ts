import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60;

type Tone = "Professional" | "Conversational" | "Bold" | "Educational";

const tones = new Set<Tone>(["Professional", "Conversational", "Bold", "Educational"]);
const schema = {
  type: "object",
  additionalProperties: false,
  required: ["linkedin", "xThread", "newsletter", "summary", "instagram", "calendar"],
  properties: {
    linkedin: { type: "string" },
    xThread: { type: "string" },
    newsletter: { type: "string" },
    summary: { type: "string" },
    instagram: { type: "string" },
    calendar: {
      type: "array",
      minItems: 7,
      maxItems: 7,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["day", "channel", "format", "idea", "status"],
        properties: {
          day: { type: "string", enum: ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"] },
          channel: { type: "string", enum: ["LinkedIn", "X", "Email", "Instagram"] },
          format: { type: "string" },
          idea: { type: "string" },
          status: { type: "string", enum: ["Ready", "Draft"] },
        },
      },
    },
  },
};

function outputText(payload: unknown) {
  if (!payload || typeof payload !== "object") return "";
  const response = payload as { output_text?: unknown; output?: unknown };
  if (typeof response.output_text === "string") return response.output_text;
  if (!Array.isArray(response.output)) return "";
  for (const item of response.output) {
    if (!item || typeof item !== "object") continue;
    const content = (item as { content?: unknown }).content;
    if (!Array.isArray(content)) continue;
    for (const part of content) {
      if (part && typeof part === "object" && typeof (part as { text?: unknown }).text === "string") {
        return (part as { text: string }).text;
      }
    }
  }
  return "";
}

export async function POST(request: Request) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (process.env.NEXT_PUBLIC_DEMO_MODE !== "false" || !apiKey || !process.env.AI_ACCESS_CODE) {
    return NextResponse.json({ error: "AI generation is not configured." }, { status: 503 });
  }

  if(request.headers.get("authorization") !== `Bearer ${process.env.AI_ACCESS_CODE}`) return NextResponse.json({error:"Enter the AI access code in Workspace settings."},{status:401});
  let input: { title?: unknown; source?: unknown; tone?: unknown; audience?: unknown; sourceType?: unknown };
  try {
    input = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const title = typeof input.title === "string" ? input.title.trim().slice(0, 180) : "Untitled source";
  const source = typeof input.source === "string" ? input.source.trim() : "";
  const tone = tones.has(input.tone as Tone) ? (input.tone as Tone) : "Professional";
  const audience = typeof input.audience === "string" ? input.audience.trim().slice(0, 100) : "General audience";
  const sourceType = input.sourceType === "transcript" ? "video transcript" : "article";
  const wordCount = source ? source.split(/\s+/).length : 0;

  if (wordCount < 20) return NextResponse.json({ error: "Add at least 20 words." }, { status: 400 });
  if (source.length > 60000) return NextResponse.json({ error: "Source is too long. Keep it under 60,000 characters." }, { status: 413 });

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 45000);
  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-5-mini",
        reasoning: { effort: "low" },
        max_output_tokens: 5000,
        input: [
          {
            role: "system",
            content: "You are a senior content strategist. Repurpose source material faithfully without inventing facts. Make each channel-native asset distinct, specific, polished, and immediately publishable. Preserve the author's central ideas and avoid generic AI cliches. Return only the requested structured data.",
          },
          {
            role: "user",
            content: `Create a full content suite from this ${sourceType}.\n\nTITLE: ${title || "Untitled source"}\nTONE: ${tone}\nAUDIENCE: ${audience}\n\nRequirements:\n- LinkedIn: 180-350 words, strong hook, readable spacing, thoughtful CTA, 3-5 relevant hashtags.\n- X thread: 5-7 numbered posts, each concise enough for X.\n- Newsletter: subject, preview text, useful body, and closing CTA.\n- Summary: concise overview plus 3-5 key takeaways.\n- Instagram: strong caption with readable spacing, CTA, and 5-8 relevant hashtags.\n- Calendar: exactly seven days, realistic channel mix, formats, and specific ideas.\n\nSOURCE:\n${source}`,
          },
        ],
        text: { format: { type: "json_schema", name: "content_suite", strict: true, schema } },
      }),
    });

    if (!response.ok) {
      console.error("OpenAI generation failed", response.status);
      return NextResponse.json({ error: "The AI service could not complete this request." }, { status: 502 });
    }

    const payload = await response.json();
    const text = outputText(payload);
    if (!text) return NextResponse.json({ error: "The AI service returned an empty response." }, { status: 502 });
    return NextResponse.json({ ...JSON.parse(text), mode: "ai" });
  } catch (error) {
    console.error("Generation route error", error);
    return NextResponse.json({ error: error instanceof DOMException && error.name === "AbortError" ? "AI generation timed out." : "AI generation failed." }, { status: 502 });
  } finally {
    clearTimeout(timeout);
  }
}
