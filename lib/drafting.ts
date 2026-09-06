export type Tone = "Professional" | "Conversational" | "Bold" | "Educational";
export type GeneratedContent = Record<"linkedin" | "xThread" | "newsletter" | "summary" | "instagram", string>;
export function sentences(source: string) {
  return source.trim().split(/(?<=[.!?])\s+|\n+/).map(s => s.trim()).filter(Boolean);
}
const shorten = (text: string, length: number) => text.length > length ? text.slice(0, length - 1).replace(/\s+\S*$/, "") + "…" : text;
// Extractive demo: preserve the source's claims rather than inventing a new topic.
export function createLocalOutputs(source: string, title: string, tone: Tone, audience: string): GeneratedContent {
  const lines = sentences(source), topic = title.trim() || shorten(lines[0] || "Source notes", 80);
  const selected = [...new Set(lines)].slice(0, 6), first = selected[0] || "", points = selected.slice(1);
  const hook = tone === "Bold" ? `${topic}. Here are the key points.` : tone === "Conversational" ? `Let's talk about ${topic}.` : tone === "Educational" ? `A short guide to ${topic}.` : topic;
  const takeaways = (points.length ? points : selected).map(s => `• ${s}`).join("\n\n");
  const thread = [shorten(hook, 260), ...selected.map(s => shorten(s, 260))];
  return {
    linkedin: `${hook}\n\n${first}\n\n${takeaways}\n\nWhich point matters most for ${audience.toLowerCase()}?`,
    xThread: thread.map((s, i) => `${i + 1}/${thread.length} ${s}`).join("\n\n"),
    newsletter: `SUBJECT: ${topic}\nPREVIEW: ${shorten(first, 130)}\n\nHello,\n\n${selected.join("\n\n")}\n\nWhat would you add to this discussion?`,
    summary: `${topic}\n\n${first}\n\nKEY POINTS FROM THE SOURCE\n${takeaways}`,
    instagram: `${hook}\n\n${shorten(selected.slice(0, 3).join("\n\n"), 1600)}\n\nSave these notes for later. Which idea would you explore next?`,
  };
}
export function csvCell(value: string) {
  const safe = /^[\s]*[=+@-]/.test(value) ? "'" + value : value;
  return `"${safe.replace(/"/g, '""')}"`;
}
