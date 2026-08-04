"use client";

import {
  Archive,
  ArrowRight,
  BarChart3,
  BriefcaseBusiness,
  CalendarDays,
  Check,
  ChevronDown,
  Clipboard,
  Clock3,
  Copy,
  Download,
  FileText,
  Hash,
  Image,
  LayoutGrid,
  Mail,
  Menu,
  MessageCircle,
  MoreHorizontal,
  Plus,
  RotateCcw,
  Search,
  Settings,
  Sparkles,
  WandSparkles,
  X,
  Video,
} from "lucide-react";
import { ChangeEvent, DragEvent, useEffect, useMemo, useState } from "react";

type OutputKey = "linkedin" | "xThread" | "newsletter" | "summary" | "instagram";
type Tone = "Professional" | "Conversational" | "Bold" | "Educational";
type GeneratedContent = Record<OutputKey, string>;

type Project = {
  id: string;
  title: string;
  source: string;
  updatedAt: string;
  outputs: GeneratedContent;
};

type CalendarItem = {
  day: string;
  channel: string;
  format: string;
  idea: string;
  status: "Ready" | "Draft";
};

const sampleTitle = "The quiet advantage of building a content system";
const sampleSource = `Most creators do not have an idea problem. They have a distribution problem. A strong article is published once, shared once, and then forgotten while the creator rushes toward the next deadline.

The better approach is to treat every substantial piece of content as a source asset. One thoughtful article can become a LinkedIn post, a short thread, a newsletter, a carousel outline, and a week of conversation starters. The goal is not to copy and paste the same words everywhere. The goal is to preserve the central insight while adapting the framing, rhythm, and call to action for each channel.

A useful content system has three parts: capture the strongest ideas, match each idea to the right format, and schedule distribution while the source is still relevant. This reduces the pressure to create from scratch and gives your best thinking more chances to reach the right people.

Consistency becomes easier when repurposing is part of the writing process instead of an afterthought. Create once, shape with intention, and distribute with confidence.`;

const stopWords = new Set(
  "the a an and or but if then than to of in on for with from as at by is are was were be been being it its this that these those you your we our they their can could should would will into about after before while not do does did have has had more most one every same right".split(" "),
);

const outputLabels: Record<OutputKey, { label: string; icon: typeof BriefcaseBusiness }> = {
  linkedin: { label: "LinkedIn", icon: BriefcaseBusiness },
  xThread: { label: "X thread", icon: MessageCircle },
  newsletter: { label: "Newsletter", icon: Mail },
  summary: { label: "Summary", icon: FileText },
  instagram: { label: "Instagram", icon: Image },
};

function getSentences(text: string) {
  return text
    .replace(/\s+/g, " ")
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.length > 28);
}

function getKeywords(text: string) {
  const counts = new Map<string, number>();
  text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .split(/\s+/)
    .filter((word) => word.length > 4 && !stopWords.has(word))
    .forEach((word) => counts.set(word, (counts.get(word) ?? 0) + 1));

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([word]) => word);
}

function titleCase(value: string) {
  return value.replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function createOutputs(source: string, title: string, tone: Tone, audience: string): GeneratedContent {
  const sentences = getSentences(source);
  const keywords = getKeywords(source);
  const first = sentences[0] ?? "Your best content deserves more than one moment of attention.";
  const points = [sentences[1], sentences[2], sentences[3]].filter(Boolean);
  const topic = title || titleCase(keywords.slice(0, 3).join(" ")) || "A better content workflow";
  const hook = tone === "Bold"
    ? `Stop creating content that disappears after one post.`
    : tone === "Educational"
      ? `Here is a practical way to get more value from every idea you publish.`
      : tone === "Conversational"
        ? `A small content habit has completely changed how I think about publishing.`
        : `The highest-leverage content strategy is often hiding in work you have already finished.`;
  const hashtags = keywords.slice(0, 4).map((word) => `#${titleCase(word).replace(/\s/g, "")}`).join(" ");

  return {
    linkedin: `${hook}\n\n${first}\n\nThree ideas worth keeping:\n\n${points.map((point, index) => `${index + 1}. ${point}`).join("\n\n")}\n\nThe takeaway: create once, adapt with intention, and let strong ideas travel further.\n\nWhat is one piece of content you could give a second life this week?\n\n${hashtags || "#ContentStrategy #CreatorEconomy #Marketing"}`,
    xThread: `1/ Your content probably does not need more ideas. It needs better distribution. 🧵\n\n2/ ${first}\n\n3/ The simple system:\n• Capture the strongest insight\n• Match it to each platform\n• Schedule it while it is relevant\n\n4/ ${points[1] ?? "Adapt the framing and rhythm instead of copying the same post everywhere."}\n\n5/ Create once. Shape with intention. Distribute with confidence.\n\nSave this for your next publishing day.`,
    newsletter: `SUBJECT: ${topic}: the smarter way to create consistently\nPREVIEW: Turn one strong idea into a complete week of useful content.\n\nHi there,\n\n${hook}\n\n${first}\n\n${points.join("\n\n")}\n\nA simple way to put this into practice:\n\n1. Highlight the three strongest insights in your source piece.\n2. Give each insight a format that suits the channel.\n3. Change the opening and call to action for the people reading there.\n4. Put every asset on the calendar before starting something new.\n\nThe result is not more noise. It is more mileage from thinking you have already done.\n\nTry it with one article this week and notice how much lighter your content workflow feels.\n\nUntil next time,\nYour team`,
    summary: `${topic}\n\n${first}\n\nKEY TAKEAWAYS\n${points.map((point) => `• ${point}`).join("\n")}\n\nIN ONE SENTENCE\nA repeatable repurposing system helps ${audience.toLowerCase()} turn their best ideas into channel-specific content without starting from zero every day.`,
    instagram: `${hook}\n\nOne strong idea can become:\n\n→ a thoughtful LinkedIn post\n→ a five-part thread\n→ an email your audience saves\n→ a carousel people share\n→ a full week of content\n\nRepurposing is not repeating yourself. It is making the same valuable idea easier to discover in the format your audience already prefers.\n\nSave this for your next content planning session. ✦\n\n${hashtags || "#ContentCreator #ContentMarketing #SocialMediaTips"}`,
  };
}

function createCalendar(title: string, outputs: GeneratedContent): CalendarItem[] {
  const topic = title || "Your source content";
  return [
    { day: "MON", channel: "LinkedIn", format: "Authority post", idea: `The core insight from “${topic}”`, status: "Ready" },
    { day: "TUE", channel: "X", format: "5-part thread", idea: "Break the main framework into actionable steps", status: "Ready" },
    { day: "WED", channel: "Email", format: "Newsletter", idea: outputs.newsletter.split("\n")[0].replace("SUBJECT: ", ""), status: "Ready" },
    { day: "THU", channel: "Instagram", format: "Carousel", idea: "Five ways to apply the central idea", status: "Draft" },
    { day: "FRI", channel: "LinkedIn", format: "Conversation", idea: "Ask the audience about their current workflow", status: "Draft" },
    { day: "SAT", channel: "Instagram", format: "Caption", idea: "A short personal reflection and save-worthy checklist", status: "Ready" },
    { day: "SUN", channel: "X", format: "Quick insight", idea: "Restate the strongest takeaway in under 280 characters", status: "Draft" },
  ];
}

function downloadText(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export default function Home() {
  const [title, setTitle] = useState(sampleTitle);
  const [source, setSource] = useState(sampleSource);
  const [sourceType, setSourceType] = useState<"article" | "transcript">("article");
  const [tone, setTone] = useState<Tone>("Professional");
  const [audience, setAudience] = useState("Creators & marketers");
  const [activeOutput, setActiveOutput] = useState<OutputKey>("linkedin");
  const [outputs, setOutputs] = useState<GeneratedContent>(() => createOutputs(sampleSource, sampleTitle, "Professional", "Creators & marketers"));
  const [calendar, setCalendar] = useState<CalendarItem[]>(() => createCalendar(sampleTitle, outputs));
  const [isGenerating, setIsGenerating] = useState(false);
  const [toast, setToast] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);

  const words = useMemo(() => source.trim() ? source.trim().split(/\s+/).length : 0, [source]);
  const readTime = Math.max(1, Math.ceil(words / 220));
  const keywords = useMemo(() => getKeywords(source), [source]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("recast-projects");
      if (stored) {
        const savedProjects = JSON.parse(stored) as Project[];
        window.setTimeout(() => setProjects(savedProjects), 0);
      }
    } catch {
      localStorage.removeItem("recast-projects");
    }
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 2200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  function generate() {
    if (words < 20) {
      setToast("Add at least 20 words to generate useful content.");
      return;
    }
    setIsGenerating(true);
    window.setTimeout(() => {
      const next = createOutputs(source, title, tone, audience);
      setOutputs(next);
      setCalendar(createCalendar(title, next));
      setIsGenerating(false);
      setToast("Five assets and a 7-day plan are ready.");
    }, 900);
  }

  async function copyOutput() {
    await navigator.clipboard.writeText(outputs[activeOutput]);
    setToast(`${outputLabels[activeOutput].label} copied to clipboard.`);
  }

  function saveProject() {
    const project: Project = {
      id: crypto.randomUUID(),
      title: title || "Untitled source",
      source,
      outputs,
      updatedAt: new Date().toISOString(),
    };
    const next = [project, ...projects].slice(0, 8);
    setProjects(next);
    localStorage.setItem("recast-projects", JSON.stringify(next));
    setToast("Project saved on this device.");
  }

  function loadProject(project: Project) {
    setTitle(project.title);
    setSource(project.source);
    setOutputs(project.outputs);
    setCalendar(createCalendar(project.title, project.outputs));
    setSidebarOpen(false);
    setToast("Saved project opened.");
  }

  function handleFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    file.text().then((text) => {
      setSource(text);
      setTitle(file.name.replace(/\.[^.]+$/, ""));
      setToast("Text file imported.");
    });
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    const file = event.dataTransfer.files?.[0];
    if (!file || !file.type.includes("text")) {
      setToast("Drop a plain text or transcript file.");
      return;
    }
    file.text().then((text) => {
      setSource(text);
      setTitle(file.name.replace(/\.[^.]+$/, ""));
    });
  }

  const ActiveIcon = outputLabels[activeOutput].icon;

  return (
    <main className="app-shell">
      <aside className={`sidebar ${sidebarOpen ? "sidebar-open" : ""}`}>
        <div className="brand-row">
          <div className="brand-mark"><Sparkles size={18} strokeWidth={2.5} /></div>
          <span>recast<span>.ai</span></span>
          <button className="mobile-close" onClick={() => setSidebarOpen(false)} aria-label="Close navigation"><X size={20} /></button>
        </div>

        <button className="new-project" onClick={() => { setTitle(""); setSource(""); setSidebarOpen(false); }}>
          <Plus size={18} /> New repurpose
        </button>

        <nav className="main-nav" aria-label="Main navigation">
          <button className="nav-item active"><WandSparkles size={18} /> Repurpose</button>
          <button className="nav-item"><LayoutGrid size={18} /> My content <span>{projects.length}</span></button>
          <button className="nav-item"><CalendarDays size={18} /> Calendar</button>
          <button className="nav-item"><BarChart3 size={18} /> Performance <em>soon</em></button>
        </nav>

        <div className="recent-projects">
          <div className="side-label">Recent projects</div>
          {projects.length === 0 ? (
            <div className="empty-projects">Your saved projects will appear here.</div>
          ) : projects.slice(0, 4).map((project) => (
            <button key={project.id} onClick={() => loadProject(project)} className="project-link">
              <FileText size={15} />
              <span>{project.title}</span>
            </button>
          ))}
        </div>

        <div className="sidebar-bottom">
          <div className="usage-card">
            <div><span>Monthly usage</span><strong>3 / 20</strong></div>
            <div className="usage-track"><span /></div>
            <p>17 generations remaining</p>
          </div>
          <button className="profile-row">
            <span className="avatar">HC</span>
            <span><strong>Hasan Creator</strong><small>Free workspace</small></span>
            <MoreHorizontal size={18} />
          </button>
        </div>
      </aside>

      {sidebarOpen && <button className="sidebar-scrim" onClick={() => setSidebarOpen(false)} aria-label="Close navigation" />}

      <section className="workspace">
        <header className="topbar">
          <div className="topbar-left">
            <button className="menu-button" onClick={() => setSidebarOpen(true)} aria-label="Open navigation"><Menu size={21} /></button>
            <div><strong>Repurpose studio</strong><span>Turn one idea into a complete content system</span></div>
          </div>
          <div className="topbar-actions">
            <button className="icon-button" aria-label="Search"><Search size={18} /></button>
            <button className="icon-button" aria-label="Settings"><Settings size={18} /></button>
            <button className="save-button" onClick={saveProject}><Archive size={17} /> Save project</button>
          </div>
        </header>

        <div className="studio-grid">
          <section className="source-column">
            <div className="section-intro">
              <div><span className="step">01</span><h1>Add your source</h1></div>
              <p>Paste an article or transcript. Recast will find the strongest ideas and reshape them for every channel.</p>
            </div>

            <div className="source-card" onDragOver={(event) => event.preventDefault()} onDrop={handleDrop}>
              <div className="source-tabs">
                <button className={sourceType === "article" ? "active" : ""} onClick={() => setSourceType("article")}><FileText size={17} /> Article</button>
                <button className={sourceType === "transcript" ? "active" : ""} onClick={() => setSourceType("transcript")}><Video size={17} /> Video transcript</button>
              </div>

              <label className="field-label" htmlFor="content-title">Source title</label>
              <input id="content-title" className="title-input" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Give this project a clear title" />

              <div className="editor-wrap">
                <textarea value={source} onChange={(event) => setSource(event.target.value)} placeholder={sourceType === "article" ? "Paste your article, blog post, or notes here…" : "Paste a YouTube, podcast, webinar, or interview transcript here…"} aria-label="Source content" />
                <div className="editor-footer">
                  <label className="upload-link"><Clipboard size={15} /> Import .txt<input type="file" accept=".txt,text/plain" onChange={handleFile} /></label>
                  <span>{words.toLocaleString()} words · {readTime} min read</span>
                </div>
              </div>

              <div className="insight-strip">
                <div><Clock3 size={16} /><span><small>Source length</small><strong>{readTime} min</strong></span></div>
                <div><Hash size={16} /><span><small>Key themes</small><strong>{keywords.slice(0, 2).join(", ") || "Waiting for source"}</strong></span></div>
              </div>
            </div>

            <div className="options-card">
              <div className="option-group">
                <label>Tone of voice</label>
                <div className="select-wrap">
                  <select value={tone} onChange={(event) => setTone(event.target.value as Tone)}>
                    <option>Professional</option><option>Conversational</option><option>Bold</option><option>Educational</option>
                  </select><ChevronDown size={16} />
                </div>
              </div>
              <div className="option-group">
                <label>Primary audience</label>
                <div className="select-wrap">
                  <select value={audience} onChange={(event) => setAudience(event.target.value)}>
                    <option>Creators & marketers</option><option>Founders & operators</option><option>Students & educators</option><option>General audience</option>
                  </select><ChevronDown size={16} />
                </div>
              </div>
            </div>

            <button className={`generate-button ${isGenerating ? "generating" : ""}`} onClick={generate} disabled={isGenerating}>
              <span>{isGenerating ? <RotateCcw size={19} /> : <Sparkles size={19} />}{isGenerating ? "Repurposing your ideas…" : "Generate content suite"}</span>
              {!isGenerating && <ArrowRight size={19} />}
            </button>
            <p className="privacy-note">Your source stays in this browser and is never uploaded.</p>
          </section>

          <section className="output-column">
            <div className="section-intro output-intro">
              <div><span className="step">02</span><h2>Your content suite</h2></div>
              <span className="ready-badge"><Check size={13} /> 5 assets ready</span>
            </div>

            <div className="output-card">
              <div className="output-tabs" role="tablist">
                {(Object.keys(outputLabels) as OutputKey[]).map((key) => {
                  const ItemIcon = outputLabels[key].icon;
                  return <button role="tab" aria-selected={activeOutput === key} className={activeOutput === key ? "active" : ""} key={key} onClick={() => setActiveOutput(key)}><ItemIcon size={16} /><span>{outputLabels[key].label}</span></button>;
                })}
              </div>

              <div className="output-toolbar">
                <div><span className="platform-icon"><ActiveIcon size={17} /></span><strong>{outputLabels[activeOutput].label}</strong><em>{outputs[activeOutput].length} characters</em></div>
                <div>
                  <button onClick={copyOutput} aria-label="Copy content"><Copy size={16} /> Copy</button>
                  <button onClick={() => downloadText(`${activeOutput}.txt`, outputs[activeOutput])} aria-label="Download content"><Download size={16} /></button>
                </div>
              </div>

              <textarea className="output-editor" value={outputs[activeOutput]} onChange={(event) => setOutputs({ ...outputs, [activeOutput]: event.target.value })} aria-label={`Edit ${outputLabels[activeOutput].label} content`} />

              <div className="output-quality">
                <span><Check size={14} /> Channel-ready</span>
                <span><Check size={14} /> Tone matched</span>
                <span><Check size={14} /> Editable</span>
              </div>
            </div>

            <div className="calendar-card">
              <div className="calendar-head">
                <div><span className="calendar-icon"><CalendarDays size={18} /></span><span><strong>7-day content plan</strong><small>One source, a full week of distribution</small></span></div>
                <button onClick={() => downloadText("content-calendar.txt", calendar.map((item) => `${item.day} — ${item.channel}: ${item.idea}`).join("\n"))}><Download size={16} /> Export</button>
              </div>
              <div className="calendar-list">
                {calendar.map((item, index) => (
                  <div className="calendar-row" key={`${item.day}-${index}`}>
                    <span className="day-chip">{item.day}</span>
                    <span className={`channel-dot channel-${item.channel.toLowerCase()}`} />
                    <span className="calendar-copy"><strong>{item.idea}</strong><small>{item.channel} · {item.format}</small></span>
                    <span className={`status ${item.status.toLowerCase()}`}>{item.status}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>
      </section>

      {toast && <div className="toast"><Check size={16} /> {toast}</div>}
    </main>
  );
}
