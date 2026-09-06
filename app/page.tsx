"use client";

import {
  Archive, ArrowRight, BarChart3, BriefcaseBusiness, CalendarDays, Check, ChevronDown,
  Clipboard, Clock3, Copy, Download, FileText, Hash, Image, LayoutGrid, Mail, Menu,
  MessageCircle, MoreHorizontal, Plus, RotateCcw, Search, Settings, Sparkles, Trash2,
  WandSparkles, X, Video,
} from "lucide-react";
import { createLocalOutputs, csvCell } from "@/lib/drafting";
const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE !== "false";

import { ChangeEvent, DragEvent, useEffect, useMemo, useState } from "react";

type OutputKey = "linkedin" | "xThread" | "newsletter" | "summary" | "instagram";
type Tone = "Professional" | "Conversational" | "Bold" | "Educational";
type View = "studio" | "content" | "calendar" | "performance";
type GeneratedContent = Record<OutputKey, string>;
type CalendarItem = { day: string; channel: string; format: string; idea: string; status: "Ready" | "Draft" };
type Project = {
  id: string; title: string; source: string; sourceType: "article" | "transcript"; tone: Tone;
  audience: string; updatedAt: string; outputs: GeneratedContent; calendar: CalendarItem[];
};
type Preferences = { tone: Tone; audience: string; generationMode: "auto" | "local" };

const blankOutputs: GeneratedContent = { linkedin: "", xThread: "", newsletter: "", summary: "", instagram: "" };
const sampleTitle = "The quiet advantage of building a content system";
const sampleSource = `Most creators do not have an idea problem. They have a distribution problem. A strong article is published once, shared once, and then forgotten while the creator rushes toward the next deadline.

The better approach is to treat every substantial piece of content as a source asset. One thoughtful article can become a LinkedIn post, a short thread, a newsletter, a carousel outline, and a week of conversation starters. The goal is not to copy and paste the same words everywhere. The goal is to preserve the central insight while adapting the framing, rhythm, and call to action for each channel.

A useful content system has three parts: capture the strongest ideas, match each idea to the right format, and schedule distribution while the source is still relevant. This reduces the pressure to create from scratch and gives your best thinking more chances to reach the right people.`;
const stopWords = new Set("the a an and or but if then than to of in on for with from as at by is are was were be been being it its this that these those you your we our they their can could should would will into about after before while not do does did have has had more most one every same right".split(" "));
const outputLabels: Record<OutputKey, { label: string; icon: typeof BriefcaseBusiness }> = {
  linkedin: { label: "LinkedIn", icon: BriefcaseBusiness }, xThread: { label: "X thread", icon: MessageCircle },
  newsletter: { label: "Newsletter", icon: Mail }, summary: { label: "Summary", icon: FileText }, instagram: { label: "Instagram", icon: Image },
};
const defaultPreferences: Preferences = { tone: "Professional", audience: "Creators & marketers", generationMode: DEMO_MODE ? "local" : "auto" };

function keywords(text: string) {
  const counts = new Map<string, number>();
  text.toLowerCase().replace(/[^a-z0-9\s-]/g, "").split(/\s+/).filter((word) => word.length > 4 && !stopWords.has(word))
    .forEach((word) => counts.set(word, (counts.get(word) ?? 0) + 1));
  return [...counts].sort((a, b) => b[1] - a[1]).slice(0, 5).map(([word]) => word);
}
function createCalendar(title: string, outputs: GeneratedContent): CalendarItem[] {
  const topic = title || "Your source content";
  return [
    { day: "MON", channel: "LinkedIn", format: "Authority post", idea: `The core insight from “${topic}”`, status: "Ready" },
    { day: "TUE", channel: "X", format: "Thread", idea: "Break the main framework into actionable steps", status: "Ready" },
    { day: "WED", channel: "Email", format: "Newsletter", idea: outputs.newsletter.split("\n")[0].replace("SUBJECT: ", "") || topic, status: "Ready" },
    { day: "THU", channel: "Instagram", format: "Carousel", idea: "Five ways to apply the central idea", status: "Draft" },
    { day: "FRI", channel: "LinkedIn", format: "Conversation", idea: "Ask the audience about their current workflow", status: "Draft" },
    { day: "SAT", channel: "Instagram", format: "Caption", idea: "A personal reflection and save-worthy checklist", status: "Ready" },
    { day: "SUN", channel: "X", format: "Quick insight", idea: "Restate the strongest takeaway in under 280 characters", status: "Draft" },
  ];
}
function download(filename: string, content: string, type = "text/plain") {
  const url = URL.createObjectURL(new Blob([content], { type: `${type};charset=utf-8` }));
  const anchor = document.createElement("a"); anchor.href = url; anchor.download = filename; document.body.appendChild(anchor); anchor.click(); anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}
function monthKey() { return new Date().toISOString().slice(0, 7); }

export default function Home() {
  const [accessCode, setAccessCode] = useState("");
  const [title, setTitle] = useState(sampleTitle); const [source, setSource] = useState(sampleSource);
  const [sourceType, setSourceType] = useState<"article" | "transcript">("article");
  const [preferences, setPreferences] = useState<Preferences>(defaultPreferences);
  const [tone, setTone] = useState<Tone>(defaultPreferences.tone); const [audience, setAudience] = useState(defaultPreferences.audience);
  const [outputs, setOutputs] = useState<GeneratedContent>(() => createLocalOutputs(sampleSource, sampleTitle, defaultPreferences.tone, defaultPreferences.audience));
  const [calendar, setCalendar] = useState<CalendarItem[]>(() => createCalendar(sampleTitle, outputs));
  const [activeOutput, setActiveOutput] = useState<OutputKey>("linkedin"); const [activeView, setActiveView] = useState<View>("studio");
  const [isGenerating, setIsGenerating] = useState(false); const [toast, setToast] = useState(""); const [sidebarOpen, setSidebarOpen] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]); const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  const [searchOpen, setSearchOpen] = useState(false); const [settingsOpen, setSettingsOpen] = useState(false); const [query, setQuery] = useState("");
  const [generationCount, setGenerationCount] = useState(0); const [lastMode, setLastMode] = useState<"ai" | "local">("local");
  const words = useMemo(() => source.trim() ? source.trim().split(/\s+/).length : 0, [source]);
  const readTime = Math.max(1, Math.ceil(words / 220)); const themes = useMemo(() => keywords(source), [source]);
  const filteredProjects = useMemo(() => projects.filter((project) => `${project.title} ${project.source}`.toLowerCase().includes(query.toLowerCase())), [projects, query]);
  const stats = useMemo(() => ({ projects: projects.length, assets: projects.length * 5, words: projects.reduce((sum, project) => sum + project.source.trim().split(/\s+/).filter(Boolean).length, 0), ready: projects.reduce((sum, project) => sum + project.calendar.filter((item) => item.status === "Ready").length, 0) }), [projects]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const saved = JSON.parse(localStorage.getItem("recast-projects") || "[]") as Project[]; setProjects(Array.isArray(saved)?saved.filter(p=>p&&typeof p.title==="string"&&typeof p.source==="string"&&p.outputs&&Array.isArray(p.calendar)):[]);
        const prefs = JSON.parse(localStorage.getItem("recast-preferences") || "null") as Preferences | null;
        if (prefs) { setPreferences(prefs); setTone(prefs.tone); setAudience(prefs.audience); }
        const usage = JSON.parse(localStorage.getItem("recast-usage") || "{}") as Record<string, number>; setGenerationCount(usage[monthKey()] || 0);
      } catch { setToast("Saved data could not be loaded. Existing data has been preserved."); }
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);
  useEffect(() => { if (!toast) return; const timer = setTimeout(() => setToast(""), 3000); return () => clearTimeout(timer); }, [toast]);
  useEffect(() => {
    function close(event: KeyboardEvent) { if (event.key === "Escape") { setSearchOpen(false); setSettingsOpen(false); } }
    window.addEventListener("keydown", close); return () => window.removeEventListener("keydown", close);
  }, []);

  function persistProjects(next: Project[]) { try { localStorage.setItem("recast-projects", JSON.stringify(next)); setProjects(next); return true; } catch { setToast("Storage is full or unavailable. Export your draft before closing."); return false; } }
  function countGeneration() {
    const next = generationCount + 1; setGenerationCount(next);
    try { const usage = JSON.parse(localStorage.getItem("recast-usage") || "{}") as Record<string, number>; usage[monthKey()] = next; localStorage.setItem("recast-usage", JSON.stringify(usage)); } catch { /* Drafting still works without activity persistence. */ }
  }
  function newProject() {
    setTitle(""); setSource(""); setOutputs(blankOutputs); setCalendar([]); setCurrentProjectId(null); setActiveOutput("linkedin"); setActiveView("studio"); setSidebarOpen(false); setTone(preferences.tone); setAudience(preferences.audience); setToast("New project ready.");
  }
  async function generate() {
    if (source.length > 60000) { setToast("Keep the source under 60,000 characters."); return; }
    if (words < 20) { setToast("Add at least 20 words to generate useful content."); return; }
    setIsGenerating(true);
    try {
      if (!DEMO_MODE && preferences.generationMode === "auto") {
        const response = await fetch("/api/generate", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessCode}` }, body: JSON.stringify({ title, source, sourceType, tone, audience }) });
        if (response.ok) {
          const data = await response.json() as GeneratedContent & { calendar: CalendarItem[] };
          const next = { linkedin: data.linkedin, xThread: data.xThread, newsletter: data.newsletter, summary: data.summary, instagram: data.instagram };
          setOutputs(next); setCalendar(data.calendar); setLastMode("ai"); countGeneration(); setToast("AI created five assets and a 7-day plan."); return;
        }
      }
      const next = createLocalOutputs(source, title, tone, audience); setOutputs(next); setCalendar(createCalendar(title, next)); setLastMode("local"); countGeneration();
      setToast(preferences.generationMode === "local" ? "Private local drafts are ready." : "AI is unavailable or disabled; source-based local drafts were created.");
    } catch {
      const next = createLocalOutputs(source, title, tone, audience); setOutputs(next); setCalendar(createCalendar(title, next)); setLastMode("local"); countGeneration(); setToast("Connection failed, so private local drafts were created.");
    } finally { setIsGenerating(false); }
  }
  async function copyOutput() {
    const content = outputs[activeOutput]; if (!content) { setToast("Generate or write content first."); return; }
    try { await navigator.clipboard.writeText(content); setToast(`${outputLabels[activeOutput].label} copied.`); }
    catch { download(`${activeOutput}.txt`, content); setToast("Clipboard was unavailable, so the file was downloaded."); }
  }
  function saveProject() {
    if (!source.trim()) { setToast("Add source content before saving."); return; }
    const id = currentProjectId || crypto.randomUUID();
    const project: Project = { id, title: title.trim() || "Untitled source", source, sourceType, tone, audience, outputs, calendar, updatedAt: new Date().toISOString() };
    if (!currentProjectId && projects.length >= 50) { setToast("Library full: remove a saved project before adding another."); return; }
    const next = [project, ...projects.filter((item) => item.id !== id)]; if(!persistProjects(next))return; setCurrentProjectId(id); setToast(currentProjectId ? "Project updated." : "Project saved on this device.");
  }
  function loadProject(project: Project) {
    setTitle(project.title); setSource(project.source); setSourceType(project.sourceType || "article"); setTone(project.tone || preferences.tone); setAudience(project.audience || preferences.audience);
    setOutputs(project.outputs); setCalendar(project.calendar?.length ? project.calendar : createCalendar(project.title, project.outputs)); setCurrentProjectId(project.id); setActiveView("studio"); setSidebarOpen(false); setSearchOpen(false); setToast("Saved project opened.");
  }
  function deleteProject(id: string) { if(!confirm("Delete this saved project?"))return;if(!persistProjects(projects.filter((project) => project.id !== id)))return; if (currentProjectId === id) setCurrentProjectId(null); setToast("Project deleted from this device."); }
  async function importFile(file?: File) {
    if (!file) return;
    if (file.size > 1_500_000 || (!file.name.match(/\.(txt|md)$/i) && file.type && !file.type.includes("text"))) { setToast("Choose a .txt or .md file under 1.5 MB."); return; }
    try { setSource(await file.text()); setTitle(file.name.replace(/\.[^.]+$/, "")); setToast("Text file imported."); } catch { setToast("That file could not be read."); }
  }
  function handleFile(event: ChangeEvent<HTMLInputElement>) { void importFile(event.target.files?.[0]); event.target.value = ""; }
  function handleDrop(event: DragEvent<HTMLDivElement>) { event.preventDefault(); void importFile(event.dataTransfer.files?.[0]); }
  function exportCalendar() {
    if (!calendar.length) { setToast("Generate a calendar first."); return; }
    const escape = csvCell;
    download("recast-content-calendar.csv", ["Day,Channel,Format,Idea,Status", ...calendar.map((item) => [item.day, item.channel, item.format, item.idea, item.status].map(escape).join(","))].join("\n"), "text/csv"); setToast("Calendar exported as CSV.");
  }
  function updateCalendar(index: number, update: Partial<CalendarItem>) { setCalendar((items) => items.map((item, itemIndex) => itemIndex === index ? { ...item, ...update } : item)); }
  function savePreferences() { setPreferences({ ...preferences, tone, audience }); localStorage.setItem("recast-preferences", JSON.stringify({ ...preferences, tone, audience })); setSettingsOpen(false); setToast("Preferences saved."); }
  function clearData() { if(!confirm("Clear all projects and activity saved in this browser?"))return; localStorage.removeItem("recast-projects"); localStorage.removeItem("recast-usage"); setProjects([]); setGenerationCount(0); setCurrentProjectId(null); setSettingsOpen(false); setToast("Local workspace data cleared."); }

  const ActiveIcon = outputLabels[activeOutput].icon;
  const nav = (view: View) => { setActiveView(view); setSidebarOpen(false); };

  return <main className="app-shell">
    <aside className={`sidebar ${sidebarOpen ? "sidebar-open" : ""}`}>
      <div className="brand-row"><div className="brand-mark"><Sparkles size={18} /></div><span>recast<span>.ai</span></span><button className="mobile-close" onClick={() => setSidebarOpen(false)} aria-label="Close navigation"><X size={20} /></button></div>
      <button className="new-project" onClick={newProject}><Plus size={18} /> New repurpose</button>
      <nav className="main-nav" aria-label="Main navigation">
        <button className={`nav-item ${activeView === "studio" ? "active" : ""}`} onClick={() => nav("studio")}><WandSparkles size={18} /> Repurpose</button>
        <button className={`nav-item ${activeView === "content" ? "active" : ""}`} onClick={() => nav("content")}><LayoutGrid size={18} /> My content <span>{projects.length}</span></button>
        <button className={`nav-item ${activeView === "calendar" ? "active" : ""}`} onClick={() => nav("calendar")}><CalendarDays size={18} /> Calendar</button>
        <button className={`nav-item ${activeView === "performance" ? "active" : ""}`} onClick={() => nav("performance")}><BarChart3 size={18} /> Performance</button>
      </nav>
      <div className="recent-projects"><div className="side-label">Recent projects</div>{projects.length === 0 ? <div className="empty-projects">Saved projects appear here.</div> : projects.slice(0, 4).map((project) => <button key={project.id} onClick={() => loadProject(project)} className="project-link"><FileText size={15} /><span>{project.title}</span></button>)}</div>
      <div className="sidebar-bottom"><div className="usage-card"><div><span>This month</span><strong>{generationCount}</strong></div><div className="usage-track"><span style={{ width: `${Math.min(100, generationCount * 5)}%` }} /></div><p>{generationCount} content suite{generationCount === 1 ? "" : "s"} generated</p></div>
        <button className="profile-row" onClick={() => setSettingsOpen(true)}><span className="avatar">HC</span><span><strong>Hasan Creator</strong><small>Local workspace</small></span><MoreHorizontal size={18} /></button></div>
    </aside>
    {sidebarOpen && <button className="sidebar-scrim" onClick={() => setSidebarOpen(false)} aria-label="Close navigation" />}
    <section className="workspace">
      <header className="topbar"><div className="topbar-left"><button className="menu-button" onClick={() => setSidebarOpen(true)} aria-label="Open navigation"><Menu size={21} /></button><div><strong>{activeView === "studio" ? "Repurpose studio" : activeView === "content" ? "My content" : activeView === "calendar" ? "Content calendar" : "Performance"}</strong><span>{activeView === "studio" ? "Turn one idea into a complete content system" : "Your device-local content workspace"}</span></div></div>
        <div className="topbar-actions"><button className="icon-button" onClick={() => setSearchOpen(true)} aria-label="Search"><Search size={18} /></button><button className="icon-button" onClick={() => setSettingsOpen(true)} aria-label="Settings"><Settings size={18} /></button>{activeView === "studio" && <button className="save-button" onClick={saveProject}><Archive size={17} /> {currentProjectId ? "Update project" : "Save project"}</button>}</div></header>

      {activeView === "studio" ? <div className="studio-grid">
        <section className="source-column"><div className="section-intro"><div><span className="step">01</span><h1>Add your source</h1></div><p>Paste an article or transcript. Recast identifies the strongest ideas and reshapes them for each channel.</p></div>
          <div className="source-card" onDragOver={(event) => event.preventDefault()} onDrop={handleDrop}><div className="source-tabs"><button className={sourceType === "article" ? "active" : ""} onClick={() => setSourceType("article")}><FileText size={17} /> Article</button><button className={sourceType === "transcript" ? "active" : ""} onClick={() => setSourceType("transcript")}><Video size={17} /> Video transcript</button></div>
            <label className="field-label" htmlFor="content-title">Source title</label><input id="content-title" className="title-input" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Give this project a clear title" />
            <div className="editor-wrap"><textarea value={source} onChange={(event) => setSource(event.target.value)} placeholder={sourceType === "article" ? "Paste your article, blog post, or notes here..." : "Paste a video, podcast, webinar, or interview transcript here..."} aria-label="Source content" /><div className="editor-footer"><label className="upload-link"><Clipboard size={15} /> Import .txt or .md<input type="file" accept=".txt,.md,text/plain,text/markdown" onChange={handleFile} /></label><span>{words.toLocaleString()} words · {readTime} min read</span></div></div>
            <div className="insight-strip"><div><Clock3 size={16} /><span><small>Source length</small><strong>{readTime} min</strong></span></div><div><Hash size={16} /><span><small>Key themes</small><strong>{themes.slice(0, 2).join(", ") || "Waiting for source"}</strong></span></div></div></div>
          <div className="options-card"><div className="option-group"><label>Tone of voice</label><div className="select-wrap"><select value={tone} onChange={(event) => setTone(event.target.value as Tone)}><option>Professional</option><option>Conversational</option><option>Bold</option><option>Educational</option></select><ChevronDown size={16} /></div></div><div className="option-group"><label>Primary audience</label><div className="select-wrap"><select value={audience} onChange={(event) => setAudience(event.target.value)}><option>Creators & marketers</option><option>Founders & operators</option><option>Students & educators</option><option>General audience</option></select><ChevronDown size={16} /></div></div></div>
          <button className={`generate-button ${isGenerating ? "generating" : ""}`} onClick={generate} disabled={isGenerating}><span>{isGenerating ? <RotateCcw size={19} /> : <Sparkles size={19} />}{isGenerating ? "Repurposing your ideas..." : "Generate content suite"}</span>{!isGenerating && <ArrowRight size={19} />}</button>
          <p className="privacy-note">{DEMO_MODE?"Portfolio demo: source-based draft templates, editable outputs and browser-saved projects. No AI key needed.":"Local mode stays in your browser. AI mode sends your source to the configured model."}</p>
        </section>
        <section className="output-column"><div className="section-intro output-intro"><div><span className="step">02</span><h2>Your content suite</h2></div><span className={`ready-badge ${outputs.linkedin ? "" : "muted"}`}><Check size={13} /> {outputs.linkedin ? `5 assets · ${lastMode === "ai" ? "AI" : "local"}` : "Waiting for source"}</span></div>
          <div className="output-card"><div className="output-tabs" role="tablist">{(Object.keys(outputLabels) as OutputKey[]).map((key) => { const Icon = outputLabels[key].icon; return <button role="tab" aria-selected={activeOutput === key} className={activeOutput === key ? "active" : ""} key={key} onClick={() => setActiveOutput(key)}><Icon size={16} /><span>{outputLabels[key].label}</span></button>; })}</div>
            <div className="output-toolbar"><div><span className="platform-icon"><ActiveIcon size={17} /></span><strong>{outputLabels[activeOutput].label}</strong><em>{outputs[activeOutput].length.toLocaleString()} characters</em></div><div><button onClick={copyOutput}><Copy size={14} /> Copy</button><button onClick={() => outputs[activeOutput] ? download(`${activeOutput}.txt`, outputs[activeOutput]) : setToast("Generate or write content first.")}><Download size={14} /> Export</button></div></div>
            <textarea className="output-editor" value={outputs[activeOutput]} onChange={(event) => setOutputs({ ...outputs, [activeOutput]: event.target.value })} placeholder="Your generated content will appear here. You can also write or edit it directly." aria-label={`${outputLabels[activeOutput].label} output`} />
            <div className="output-quality"><span><Check size={12} /> Editable</span><span><Check size={12} /> Review before publishing</span><span><Check size={12} /> Yours to refine</span></div></div>
          <CalendarCard calendar={calendar} update={updateCalendar} exportCalendar={exportCalendar} />
        </section>
      </div> : activeView === "content" ? <Library projects={filteredProjects} query={query} setQuery={setQuery} load={loadProject} remove={deleteProject} newProject={newProject} />
        : activeView === "calendar" ? <div className="dashboard-page"><div className="page-heading"><span className="eyebrow">Publishing plan</span><h1>Content calendar</h1><p>Edit ideas, change readiness, and export the current project as CSV.</p></div>{calendar.length ? <CalendarCard calendar={calendar} update={updateCalendar} exportCalendar={exportCalendar} expanded /> : <EmptyState icon={<CalendarDays size={25} />} title="No calendar yet" copy="Generate a content suite to build your seven-day plan." action={newProject} actionLabel="Start repurposing" />}</div>
          : <div className="dashboard-page"><div className="page-heading"><span className="eyebrow">Device-local analytics</span><h1>Performance snapshot</h1><p>These totals reflect saved work on this browser, with no invented reach or engagement data.</p></div><div className="metric-grid"><Metric label="Saved projects" value={stats.projects} /><Metric label="Content assets" value={stats.assets} /><Metric label="Words processed" value={stats.words.toLocaleString()} /><Metric label="Ready calendar items" value={stats.ready} /></div><div className="insight-panel"><h2>Workspace activity</h2><p>You generated {generationCount} suite{generationCount === 1 ? "" : "s"} this month. Save projects to include them in the totals above.</p><button className="secondary-action" onClick={() => nav("content")}>Review saved content <ArrowRight size={16} /></button></div></div>}
    </section>

    {searchOpen && <Modal title="Search your content" close={() => setSearchOpen(false)}><div className="modal-search"><Search size={17} /><input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search titles and source text" /></div><div className="search-results">{filteredProjects.length ? filteredProjects.map((project) => <button key={project.id} onClick={() => loadProject(project)}><FileText size={16} /><span><strong>{project.title}</strong><small>Updated {new Date(project.updatedAt).toLocaleDateString()}</small></span><ArrowRight size={15} /></button>) : <p>No saved projects match your search.</p>}</div></Modal>}
    {settingsOpen && <Modal title="Workspace settings" close={() => setSettingsOpen(false)}><div className="settings-stack"><label>Default tone<select value={tone} onChange={(event) => setTone(event.target.value as Tone)}><option>Professional</option><option>Conversational</option><option>Bold</option><option>Educational</option></select></label><label>Default audience<select value={audience} onChange={(event) => setAudience(event.target.value)}><option>Creators & marketers</option><option>Founders & operators</option><option>Students & educators</option><option>General audience</option></select></label><label>Generation mode<select value={preferences.generationMode} onChange={(event) => setPreferences({ ...preferences, generationMode: event.target.value as Preferences["generationMode"] })}>{!DEMO_MODE&&<option value="auto">AI when configured, local fallback</option>}<option value="local">Always use private local drafts</option></select></label>{!DEMO_MODE&&<label>AI access code<input type="password" autoComplete="off" value={accessCode} onChange={e=>setAccessCode(e.target.value)}/></label>}<p>AI credentials are stored only on the server. Saved projects remain on this device.</p><div className="modal-actions"><button className="danger-button" onClick={clearData}><Trash2 size={15} /> Clear local data</button><button className="save-button" onClick={savePreferences}>Save settings</button></div></div></Modal>}
    {toast && <div className="toast" role="status"><Check size={15} /> {toast}</div>}
  </main>;
}

function CalendarCard({ calendar, update, exportCalendar, expanded = false }: { calendar: CalendarItem[]; update: (index: number, update: Partial<CalendarItem>) => void; exportCalendar: () => void; expanded?: boolean }) {
  return <div className={`calendar-card ${expanded ? "calendar-expanded" : ""}`}><div className="calendar-head"><div><span className="calendar-icon"><CalendarDays size={17} /></span><span><strong>7-day content calendar</strong><small>Click a status or edit any idea</small></span></div><button onClick={exportCalendar}><Download size={14} /> Export CSV</button></div><div className="calendar-list">{calendar.length ? calendar.map((item, index) => <div className="calendar-row" key={`${item.day}-${index}`}><span className="day-chip">{item.day}</span><span className={`channel-dot channel-${item.channel.toLowerCase()}`} /><div className="calendar-copy"><input value={item.idea} onChange={(event) => update(index, { idea: event.target.value })} aria-label={`${item.day} content idea`} /><small>{item.channel} · {item.format}</small></div><button className={`status ${item.status.toLowerCase()}`} onClick={() => update(index, { status: item.status === "Ready" ? "Draft" : "Ready" })}>{item.status}</button></div>) : <div className="calendar-empty">Generate a suite to create your publishing plan.</div>}</div></div>;
}
function Library({ projects, query, setQuery, load, remove, newProject }: { projects: Project[]; query: string; setQuery: (value: string) => void; load: (project: Project) => void; remove: (id: string) => void; newProject: () => void }) {
  return <div className="dashboard-page"><div className="page-heading page-heading-row"><div><span className="eyebrow">Local library</span><h1>My content</h1><p>Open, update, or remove projects saved in this browser.</p></div><button className="save-button" onClick={newProject}><Plus size={16} /> New project</button></div><div className="library-search"><Search size={17} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search saved content" /></div>{projects.length ? <div className="project-grid">{projects.map((project) => <article className="project-card" key={project.id}><div className="project-card-icon"><FileText size={20} /></div><span className="project-date">{new Date(project.updatedAt).toLocaleDateString()}</span><h2>{project.title}</h2><p>{project.source.slice(0, 140)}{project.source.length > 140 ? "..." : ""}</p><div><button className="secondary-action" onClick={() => load(project)}>Open project <ArrowRight size={15} /></button><button className="delete-icon" onClick={() => remove(project.id)} aria-label={`Delete ${project.title}`}><Trash2 size={16} /></button></div></article>)}</div> : <EmptyState icon={<LayoutGrid size={25} />} title="No saved content" copy={query ? "No projects match your search." : "Save a repurposing project and it will appear here."} action={newProject} actionLabel="Create a project" />}</div>;
}
function Modal({ title, close, children }: { title: string; close: () => void; children: React.ReactNode }) { return <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) close(); }}><section className="modal" role="dialog" aria-modal="true" aria-label={title}><header><h2>{title}</h2><button onClick={close} aria-label="Close"><X size={19} /></button></header>{children}</section></div>; }
function Metric({ label, value }: { label: string; value: string | number }) { return <div className="metric-card"><span>{label}</span><strong>{value}</strong></div>; }
function EmptyState({ icon, title, copy, action, actionLabel }: { icon: React.ReactNode; title: string; copy: string; action: () => void; actionLabel: string }) { return <div className="empty-state"><span>{icon}</span><h2>{title}</h2><p>{copy}</p><button className="secondary-action" onClick={action}>{actionLabel} <ArrowRight size={15} /></button></div>; }
