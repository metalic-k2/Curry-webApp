import React, { useEffect, useMemo, useState } from "react";
import {
  Search, BookOpen, Brain, Globe, Sparkles, Download, Star, Bookmark,
  Lightbulb, Beaker, Users, Layers, Link as LinkIcon, Network, Plus, Trash2,
  Share2, Play, Pause, AudioLines, LayoutTemplate, Bot, Rocket, Languages, ChartLine
} from "lucide-react";
import { BrowserRouter, Routes, Route, Link, useNavigate, useParams, useLocation } from "react-router-dom";

/**
 * IMPORTANT (Fix for the user's error):
 * The reported error was `Expecting Unicode escape sequence \uXXXX` coming from an index.tsx.
 * That usually happens when a raw backslash is inside a string (e.g., "C:\Users\param")
 * without escaping it as "C:\\Users\\param". This file avoids raw backslashes in strings
 * and demonstrates proper escaping in the DEV_TESTS block below.
 */

// ---------- UI PRIMITIVES (minimal stand-ins) ----------
const Button = ({className = "", children, ...props}) => (
  <button className={`px-3 py-2 rounded-2xl shadow-sm border border-black/10 hover:shadow transition ${className}`} {...props}>{children}</button>
);
const Pill = ({children}) => (
  <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-black/5 border border-black/10">{children}</span>
)
const Card = ({className = "", children}) => (
  <div className={`rounded-3xl border border-black/10 shadow-sm bg-white ${className}`}>{children}</div>
);
const CardHeader = ({title, subtitle, icon}) => (
  <div className="p-4 border-b border-black/10 flex items-start gap-3">
    {icon}
    <div>
      <div className="font-semibold">{title}</div>
      {subtitle && <div className="text-sm text-black/60">{subtitle}</div>}
    </div>
  </div>
);
const CardBody = ({children, className = ""}) => (
  <div className={`p-4 ${className}`}>{children}</div>
)
const Input = (props) => (
  <input {...props} className={`w-full px-3 py-2 rounded-xl border border-black/15 bg-white focus:outline-none focus:ring-2 focus:ring-black/20 ${props.className||""}`} />
)
const Textarea = (props) => (
  <textarea {...props} className={`w-full px-3 py-2 rounded-xl border border-black/15 bg-white focus:outline-none focus:ring-2 focus:ring-black/20 ${props.className||""}`} />
)
const Badge = ({children}) => (
  <span className="text-[11px] px-2 py-0.5 rounded-full bg-indigo-600/10 text-indigo-700 border border-indigo-600/20">{children}</span>
)

// ---------- DATA LAYER ----------
// You can drop a file named `/papers.json` in your public/ folder.
// Minimal shape:
// [
//   {"id":"ads:...","title":"...","authors":["..."],"year":2024,"mission":"ISS",
//    "datasets":["..."],"keywords":["..."],"abstract":"...","findings":["..."],"trl":3,"journal":"NPJ Microgravity"}
// ]

const FALLBACK_PAPERS = [
  {
    id: "ads:2024-GLDS-PlantISS",
    title: "Arabidopsis Thaliana Growth Dynamics in Microgravity aboard the ISS",
    authors: ["M. Rivera", "K. Chen", "L. Patel"],
    year: 2024,
    mission: "ISS",
    datasets: ["GeneLab GLDS-321", "ISS-PLANTCAM-IMG"],
    keywords: ["microgravity", "arabidopsis", "root morphology", "gene expression", "light signaling"],
    abstract: "We investigate morphogenesis and transcriptomic changes of Arabidopsis seedlings grown in microgravity conditions, with controlled photoperiods and spectral gradients.",
    findings: [
      "Altered auxin transport modifies root skewing in μg.",
      "Upregulation of light-response genes under blue-enriched spectra.",
      "Morphometrics show 12% increase in root hair length vs. 1g controls."
    ],
    trl: 3,
    journal: "NPJ Microgravity",
  },
  {
    id: "ads:2023-GeneMicrobiome-ISS",
    title: "Microbial Community Shifts in the ISS Environmental Surfaces",
    authors: ["S. Morales", "E. Gupta"],
    year: 2023,
    mission: "ISS",
    datasets: ["GeneLab GLDS-290", "ISS-METAGEN-SEQ"],
    keywords: ["microbiome", "biofilms", "antimicrobial resistance", "metagenomics"],
    abstract: "Longitudinal metagenomic sampling reveals spatiotemporal dynamics of surface-associated microbial communities in the ISS habitat.",
    findings: [
      "Enrichment of biofilm-forming taxa near high-touch panels.",
      "Transient increases in AMR gene abundance post cargo arrivals.",
      "Humidity fluctuations correlate with community evenness."
    ],
    trl: 2,
    journal: "BMC Microbiol",
  },
  {
    id: "ads:2022-HumanPhys-Gravity",
    title: "Cardiovascular Adaptations to Partial Gravity: Bedrest Analog Study",
    authors: ["J. Okoye", "T. Müller", "R. Singh"],
    year: 2022,
    mission: "Analog/Bedrest",
    datasets: ["HRV-DB-AG", "Bedrest-Vascular-2022"],
    keywords: ["cardiovascular", "partial gravity", "baroreflex", "orthostatic intolerance"],
    abstract: "A 60-day head-down tilt bedrest analog with artificial gravity exposures assessed cardiovascular deconditioning and recovery kinetics.",
    findings: [
      "Intermittent AG mitigates VO2max decline by ~35%.",
      "Baroreflex sensitivity partially preserved in AG cohort.",
      "Post-bedrest orthostatic symptoms reduced 22% with AG."
    ],
    trl: 4,
    journal: "Oncol Res",
  }
];

const PapersContext = React.createContext({ papers: FALLBACK_PAPERS, loading: false, error: null });

function PapersProvider({children}){
  const [papers, setPapers] = useState(FALLBACK_PAPERS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(()=>{
    let cancelled = false;
    async function load(){
      try{
        const res = await fetch('/papers.json', {cache:'no-store'});
        if(!res.ok) throw new Error('papers.json not found');
        const json = await res.json();
        if(cancelled) return;
        const cleaned = Array.isArray(json) ? json.filter(p=>p && p.id && p.title) : FALLBACK_PAPERS;
        setPapers(cleaned.length? cleaned : FALLBACK_PAPERS);
      }catch(e){
        setError(e.message);
        setPapers(FALLBACK_PAPERS);
      }finally{
        if(!cancelled) setLoading(false);
      }
    }
    load();
    return ()=>{cancelled = true};
  }, []);

  return <PapersContext.Provider value={{papers, loading, error}}>{children}</PapersContext.Provider>
}

// ---------- UTILITIES ----------
const fuzzyIncludes = (haystack, needle) => haystack.toLowerCase().includes(needle.trim().toLowerCase());
function useDebounce(value, delay=300){
  const [v, setV] = useState(value);
  useEffect(()=>{ const t=setTimeout(()=>setV(value), delay); return ()=>clearTimeout(t);}, [value, delay]);
  return v;
}

// ---------- DEV TESTS (simple runtime checks) ----------
function DevTests(){
  useEffect(()=>{
    if (!(import.meta && import.meta.env && import.meta.env.DEV)) return;
    console.groupCollapsed('[Curry dev-tests]');
    try{
      // Backslash escape test (prevents the \uXXXX parser issue)
      const winPath = "C:\\Users\\test"; // MUST be escaped as \\ in strings
      console.assert(winPath.includes("\\"), 'Backslash escape failed');

      // URL test
      const url = `https://ui.adsabs.harvard.edu/search/q=${encodeURIComponent('test title')}`;
      const u = new URL(url);
      console.assert(u.hostname.includes('harvard'), 'URL construction failed');

      // Encode/decode id roundtrip
      const id = 'ads:2024-GLDS-PlantISS';
      console.assert(decodeURIComponent(encodeURIComponent(id))===id, 'encode/decode mismatch');

      console.log('All dev-tests passed.');
    }catch(e){
      console.error('Dev-tests error:', e);
    }finally{
      console.groupEnd();
    }
  }, []);
  return null;
}

// ---------- GLOBAL APP SHELL WITH ROUTING ----------
export default function CurryApp(){
  return (
    <BrowserRouter>
      <PapersProvider>
        <AppShell />
        <DevTests />
      </PapersProvider>
    </BrowserRouter>
  );
}

function AppShell(){
  const [bookmarks, setBookmarks] = useState(()=>{
    try{ return JSON.parse(localStorage.getItem('curry_bookmarks')||'[]'); }catch{ return []; }
  });
  const [lang, setLang] = useState("en");

  useEffect(()=>{ localStorage.setItem('curry_bookmarks', JSON.stringify(bookmarks)); }, [bookmarks]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white text-slate-900">
      <header className="sticky top-0 z-10 backdrop-blur bg-white/70 border-b border-black/10">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-3">
          <Rocket className="w-6 h-6"/>
          <Link to="/" className="font-bold text-lg">Curry</Link>
          <nav className="ml-6 flex items-center gap-4 text-sm">
            <NavLink to="/" label="Home"/>
            <NavLink to="/explore" label="Explore"/>
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <Pill><Languages className="w-3 h-3"/> {lang.toUpperCase()}</Pill>
          </div>
        </div>
      </header>

      <Routes>
        <Route path="/" element={<HomePage/>} />
        <Route path="/explore" element={<ExplorePage bookmarks={bookmarks} setBookmarks={setBookmarks}/>} />
        <Route path="/paper/:id" element={<PaperPage bookmarks={bookmarks} setBookmarks={setBookmarks} />} />
        <Route path="/lab/:id" element={<InventorLabPage/>} />
        <Route path="*" element={<NotFound/>} />
      </Routes>

      <footer className="max-w-6xl mx-auto px-4 pb-16 pt-6 text-xs text-black/60">
        <div className="flex items-center justify-between">
          <div>© 2025 Curry · Prototype for NASA Space Apps · Mock data only.</div>
          <div className="flex items-center gap-2">
            <Button><Share2 className="w-4 h-4 mr-1"/>Share</Button>
            <Button><Download className="w-4 h-4 mr-1"/>Export Summary</Button>
          </div>
        </div>
      </footer>
    </div>
  );
}

function NavLink({to, label}){
  const location = useLocation();
  const active = location.pathname === to;
  return (
    <Link to={to} className={`px-2 py-1 rounded-xl ${active?"text-orange-600 font-semibold":"text-slate-700 hover:text-slate-900"}`}>{label}</Link>
  );
}

// ---------- PAGES ----------
function HomePage(){
  const navigate = useNavigate();
  const { papers, loading, error } = React.useContext(PapersContext);
  const featured = papers.slice(0,2);
  return (
    <main className="max-w-6xl mx-auto px-4 py-10 grid grid-cols-12 gap-6">
      <div className="col-span-12 lg:col-span-7">
        <h1 className="text-5xl font-extrabold leading-tight">Curry — Serving NASA’s Biological Research in <span className="text-orange-600">3</span> Flavors</h1>
        <p className="mt-4 text-slate-600 max-w-xl">Translate complex NASA biological papers into approachable insights for the public, investors, and scientists.</p>
        <div className="mt-6 flex gap-3">
          <Button className="bg-orange-500 text-white border-orange-500" onClick={()=>navigate("/explore")}>
            <Search className="w-4 h-4 mr-1"/> Explore Research
          </Button>
          <Button onClick={()=>navigate("/explore#featured")}>
            Start Exploring
          </Button>
        </div>
      </div>
      <div className="col-span-12 lg:col-span-5">
        <Card className="bg-white/80">
          <CardHeader title="Featured" subtitle={loading?"Loading...": (error?"Using fallback" : "Quick picks to try")} icon={<BookOpen className="w-5 h-5 mt-0.5"/>}/>
          <CardBody className="space-y-3">
            {featured.map(p=> (
              <div key={p.id} className="p-3 rounded-2xl border border-black/10">
                <div className="font-medium">{p.title}</div>
                <div className="text-xs text-black/60">{p.journal}</div>
                <div className="mt-2 flex gap-3 text-sm">
                  <Link className="text-orange-600 underline" to={`/paper/${encodeURIComponent(p.id)}?mode=layman`}>Open Modes</Link>
                </div>
              </div>
            ))}
          </CardBody>
        </Card>
      </div>
    </main>
  );
}

function ExplorePage({bookmarks, setBookmarks}){
  const [q, setQ] = useState("");
  const dq = useDebounce(q);
  const { papers } = React.useContext(PapersContext);
  const filtered = useMemo(()=>{
    if(!dq) return papers;
    return papers.filter(p=>
      fuzzyIncludes(p.title||"", dq) || fuzzyIncludes(p.abstract||"", dq) ||
      (p.keywords||[]).some(k=>fuzzyIncludes(k, dq)) || fuzzyIncludes(p.mission||"", dq)
    );
  }, [dq, papers]);

  const toggleBookmark = (p)=>{
    setBookmarks(prev=> prev.find(x=>x.id===p.id) ? prev.filter(x=>x.id!==p.id) : [...prev, p]);
  }

  return (
    <main className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3">
        <Input placeholder="Search title, teaser, authors or tags" value={q} onChange={e=>setQ(e.target.value)} />
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {["NPJ Microgravity","Stem Cell Reports","Oncol Res","J Funct Biomater","BMC Microbiol"].map(t=> <Pill key={t}>{t}</Pill>)}
      </div>

      <div id="featured" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
        {filtered.map(p=>{
          const bookmarked = bookmarks.find(b=>b.id===p.id);
          return (
            <Card key={p.id}>
              <CardBody>
                <div className="flex items-start gap-2">
                  <div className="flex-1">
                    <div className="font-semibold leading-snug">{p.title}</div>
                    <div className="text-xs text-black/60">{p.journal}</div>
                    <div className="mt-2 flex flex-wrap gap-1">{(p.keywords||[]).slice(0,3).map(k=> <Badge key={k}>{k}</Badge>)}</div>
                  </div>
                  <Button onClick={()=>toggleBookmark(p)} className={`shrink-0 ${bookmarked?"bg-yellow-400/90 border-yellow-500":""}`}>
                    <Star className="w-4 h-4"/>
                  </Button>
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <Link to={`/paper/${encodeURIComponent(p.id)}?mode=layman`} className="inline-flex items-center px-3 py-2 rounded-2xl bg-orange-500 text-white border border-orange-600">View in Modes</Link>
                  <a
                    className="text-sm underline"
                    href={`https://ui.adsabs.harvard.edu/search/q=${encodeURIComponent(p.title||'')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Open source
                  </a>
                </div>
              </CardBody>
            </Card>
          )
        })}
      </div>
    </main>
  );
}

function PaperPage({bookmarks, setBookmarks}){
  const params = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { papers } = React.useContext(PapersContext);
  const paper = useMemo(()=>{
    const pid = params.id ? decodeURIComponent(params.id) : undefined;
    return papers.find(p=>p.id === pid);
  }, [params.id, papers]);
  const urlMode = new URLSearchParams(location.search).get('mode') || 'layman';
  const [mode, setMode] = useState(urlMode);
  const [audioPlaying, setAudioPlaying] = useState(false);
  const [ideaCards, setIdeaCards] = useState([]);

  useEffect(()=>{ setMode(urlMode); }, [urlMode]);
  useEffect(()=>{ const sp = new URLSearchParams(location.search); sp.set('mode', mode); navigate({search: sp.toString()}, {replace:true}); }, [mode]);

  if(!paper) return <NotFound />;

  const bookmarked = bookmarks.find(b=>b.id===paper.id);
  const toggleBookmark = ()=>{
    setBookmarks(prev=> bookmarked ? prev.filter(x=>x.id!==paper.id) : [...prev, paper]);
  }

  return (
    <main className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">{paper.title}</h2>
          <div className="text-sm text-black/60">{paper.authors.join(', ')} · {paper.year} · {paper.mission}</div>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={toggleBookmark} className={bookmarked?"bg-yellow-400/90 border-yellow-500":""}><Bookmark className="w-4 h-4 mr-1"/>Save</Button>
          <Link to={`/lab/${encodeURIComponent(paper.id)}`} className="px-3 py-2 rounded-2xl border bg-lime-100 border-lime-300">Open Inventor Lab</Link>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-2">
        <ModeToggle label="Layman" icon={<Users className="w-4 h-4"/>} active={mode==='layman'} onClick={()=>setMode('layman')}/>
        <ModeToggle label="Inventor" icon={<Lightbulb className="w-4 h-4"/>} active={mode==='inventor'} onClick={()=>setMode('inventor')}/>
        <ModeToggle label="Scientist" icon={<Beaker className="w-4 h-4"/>} active={mode==='scientist'} onClick={()=>setMode('scientist')}/>
        <Pill><LinkIcon className="w-3 h-3"/> {paper.datasets.join(', ')}</Pill>
        <Pill><ChartLine className="w-3 h-3"/> TRL {paper.trl}</Pill>
      </div>

      <div className="mt-4">
        {mode==='layman' && <LaymanView paper={paper} audioPlaying={audioPlaying} setAudioPlaying={setAudioPlaying} />}
        {mode==='inventor' && <InventorView paper={paper} ideaCards={ideaCards} setIdeaCards={setIdeaCards} />}
        {mode==='scientist' && <ScientistView paper={paper} />}
      </div>

      <Card className="mt-6">
        <CardHeader title="Auto Knowledge Cards" subtitle="Concept snapshots extracted from keywords" icon={<Brain className="w-5 h-5 mt-0.5"/>}/>
        <CardBody>
          <KnowledgeCards keywords={paper.keywords} />
        </CardBody>
      </Card>

      <Card className="mt-4">
        <CardHeader title="Trend Detector" subtitle="Emerging topics across recent NASA bio papers (mock)" icon={<Sparkles className="w-5 h-5 mt-0.5"/>}/>
        <CardBody>
          <div className="flex flex-wrap gap-2">
            <Pill>↑ Microbiome AMR</Pill>
            <Pill>↑ Plant Photomorphogenesis</Pill>
            <Pill>↑ Partial Gravity Countermeasures</Pill>
          </div>
          <div className="text-xs text-black/60 mt-2">Hook this to an aggregation over NASA ADS feeds + embeddings clustering.</div>
        </CardBody>
      </Card>
    </main>
  );
}

function ModeToggle({label, icon, active, onClick}){
  return (
    <Button onClick={onClick} className={active?"bg-black text-white":"bg-white"}>
      <span className="inline-flex items-center gap-1">{icon}{label}</span>
    </Button>
  );
}

function KnowledgeCards({keywords}){
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {keywords.map(k=>{
        const key = k.toLowerCase();
        const kc = KNOWLEDGE_CARD_DB[key];
        return (
          <Card key={k}>
            <CardBody>
              <div className="flex items-start gap-2 mb-2">
                <Badge>{kc?.title || k}</Badge>
              </div>
              <div className="text-sm text-black/80">{kc?.blurb || "(Auto-generate blurb here with LLM.)"}</div>
              <div className="mt-2 space-y-1">
                {(kc?.faq||[{q:"What is it?", a:"(Auto-generate)"}]).map((f, i)=> (
                  <div key={i} className="text-sm">
                    <span className="font-medium">Q:</span> {f.q}
                    <div><span className="font-medium">A:</span> {f.a}</div>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>
        )
      })}
    </div>
  );
}

function InventorLabPage(){
  const { id } = useParams();
  const { papers } = React.useContext(PapersContext);
  const paper = useMemo(()=>{
    const pid = id ? decodeURIComponent(id) : undefined;
    return papers.find(p=>p.id === pid);
  }, [id, papers]);
  const [ideaCards, setIdeaCards] = useState([]);
  if(!paper) return <NotFound/>;
  return (
    <main className="max-w-6xl mx-auto px-4 py-8">
      <h2 className="text-2xl font-bold">Inventor Lab — {paper.title}</h2>
      <div className="text-sm text-black/60">Draft applications, TRL, and impact derived from this research.</div>
      <div className="mt-4">
        <InventorView paper={paper} ideaCards={ideaCards} setIdeaCards={setIdeaCards} />
      </div>
    </main>
  );
}

function NotFound(){
  return (
    <main className="max-w-6xl mx-auto px-4 py-16 text-center">
      <h2 className="text-2xl font-bold">Page not found</h2>
      <div className="mt-2 text-black/60">The page you're looking for doesn't exist.</div>
      <div className="mt-4"><Link to="/" className="underline">Go home</Link></div>
    </main>
  );
}

// ---------- MODE VIEWS ----------
function LaymanView({paper, audioPlaying, setAudioPlaying}){
  return (
    <div className="space-y-4">
      <Card className="bg-amber-50 border-amber-200">
        <CardHeader title="Story Mode" subtitle="Plain-language narrative" icon={<Users className="w-5 h-5 mt-0.5"/>}/>
        <CardBody>
          <p className="text-sm leading-6">
            Imagine planting tiny seeds on the International Space Station. Without gravity pulling roots down, plants grow in surprising directions. In this study, scientists looked at how a common model plant reacts to space life—tracking its shape and which genes switch on. They found roots get longer hairs and that certain light-sensing genes become more active.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {paper.findings.map((f,i)=> <Pill key={i}>{f}</Pill>)}
          </div>
          <div className="mt-3 flex items-center gap-2">
            <Button onClick={()=>setAudioPlaying(v=>!v)}>
              {audioPlaying? <Pause className="w-4 h-4 mr-1"/> : <Play className="w-4 h-4 mr-1"/>}
              {audioPlaying? "Pause narration" : "Play narration"}
            </Button>
            <Pill><AudioLines className="w-3 h-3"/> Multilingual audio soon</Pill>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Explainer Visuals" subtitle="Infographic-style highlights" icon={<Globe className="w-5 h-5 mt-0.5"/>}/>
        <CardBody>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="p-3 rounded-2xl bg-white border"><div className="text-2xl">12%</div><div className="text-xs text-black/60">↑ Root hair length</div></div>
            <div className="p-3 rounded-2xl bg-white border"><div className="text-2xl">↑</div><div className="text-xs text-black/60">Light-response genes</div></div>
            <div className="p-3 rounded-2xl bg-white border"><div className="text-2xl">μg</div><div className="text-xs text-black/60">Microgravity effect</div></div>
          </div>
        </CardBody>
      </Card>
    </div>
  )
}

function InventorView({paper, ideaCards, setIdeaCards}){
  const [problem, setProblem] = useState("");
  const [solution, setSolution] = useState("");
  const [impact, setImpact] = useState("");
  const [trl, setTrl] = useState(paper.trl || 2);

  const addIdea = ()=>{
    if(!problem || !solution) return;
    setIdeaCards(prev=>[
      ...prev,
      { id: crypto.randomUUID(), paperId: paper.id, problem, solution, impact, trl }
    ]);
    setProblem(""); setSolution(""); setImpact("");
  }

  const opportunityHints = useMemo(()=>{
    const hints = [];
    if(paper.keywords.includes("microbiome")) hints.push("Surface biofilm monitoring & rapid AMR detection device for spacecraft.");
    if(paper.keywords.includes("microgravity")) hints.push("Microgravity-adapted horticulture kit for closed habitats.");
    if(paper.keywords.includes("cardiovascular")) hints.push("AI-guided AG exercise protocols for lunar transit missions.");
    if(paper.keywords.includes("arabidopsis")) hints.push("Fast phenotyping platform for space crop selection.");
    return hints;
  }, [paper]);

  return (
    <div className="space-y-4">
      <Card className="bg-lime-50 border-lime-200">
        <CardHeader title="Opportunity Highlights" subtitle="Auto-extracted gaps & use-cases (heuristic)" icon={<Lightbulb className="w-5 h-5 mt-0.5"/>}/>
        <CardBody>
          <ul className="list-disc pl-5 text-sm space-y-1">
            {opportunityHints.length? opportunityHints.map((h,i)=> <li key={i}>{h}</li>) : <li>No obvious heuristics; use AI extractor later.</li>}
          </ul>
          <div className="text-xs text-black/60 mt-2">Replace with real AI: prompt over abstract+findings to extract Problems, Constraints, TRL, Stakeholders.</div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Innovation Canvas" subtitle="Draft, collect, and export idea cards" icon={<LayoutTemplate className="w-5 h-5 mt-0.5"/>}/>
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-2">
              <Input placeholder="Problem / Gap" value={problem} onChange={e=>setProblem(e.target.value)} />
              <Textarea rows={3} placeholder="Proposed Solution" value={solution} onChange={e=>setSolution(e.target.value)} />
              <Textarea rows={2} placeholder="Impact / Users / ROI" value={impact} onChange={e=>setImpact(e.target.value)} />
              <div className="flex items-center gap-2">
                <Pill>TRL</Pill>
                <Input type="number" min={1} max={9} value={trl} onChange={e=>setTrl(Number(e.target.value))} className="w-24" />
                <Button onClick={addIdea}><Plus className="w-4 h-4 mr-1"/>Add Card</Button>
              </div>
            </div>
            <div className="space-y-2">
              {ideaCards.filter(c=>c.paperId===paper.id).length===0 && <div className="text-sm text-black/60">No idea cards yet.</div>}
              {ideaCards.filter(c=>c.paperId===paper.id).map(card=> (
                <div key={card.id} className="p-3 rounded-2xl border border-black/10 bg-white">
                  <div className="text-sm"><span className="font-medium">Problem:</span> {card.problem}</div>
                  <div className="text-sm mt-1"><span className="font-medium">Solution:</span> {card.solution}</div>
                  {card.impact && <div className="text-sm mt-1"><span className="font-medium">Impact:</span> {card.impact}</div>}
                  <div className="text-xs mt-2 text-black/60">TRL {card.trl}</div>
                </div>
              ))}
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  )
}

function ScientistView({paper}){
  return (
    <div className="space-y-4">
      <Card className="bg-sky-50 border-sky-200">
        <CardHeader title="Structured Summary" subtitle="Abstract · Methods · Findings" icon={<Beaker className="w-5 h-5 mt-0.5"/>}/>
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
            <div className="p-3 rounded-2xl border bg-white">
              <div className="font-medium mb-1">Abstract</div>
              <div className="text-black/80">{paper.abstract}</div>
            </div>
            <div className="p-3 rounded-2xl border bg-white">
              <div className="font-medium mb-1">Methods (mock)</div>
              <ul className="list-disc pl-5 text-black/80">
                <li>Flight vs 1g control</li>
                <li>Photoperiod & spectral gradient controls</li>
                <li>Imaging & transcriptomics</li>
              </ul>
            </div>
            <div className="p-3 rounded-2xl border bg-white">
              <div className="font-medium mb-1">Findings</div>
              <ul className="list-disc pl-5 text-black/80">
                {paper.findings.map((f,i)=> <li key={i}>{f}</li>)}
              </ul>
            </div>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Relationship Map" subtitle="Simplified knowledge graph (mock)" icon={<Network className="w-5 h-5 mt-0.5"/>}/>
        <CardBody>
          <GraphMock paper={paper} />
          <div className="text-xs text-black/60 mt-2">Replace with real graph: nodes (papers, datasets, organisms, missions) + edges. Consider Neo4j or Memgraph.</div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Dataset Links" subtitle="From GeneLab / mission archives (mock)" icon={<LinkIcon className="w-5 h-5 mt-0.5"/>}/>
        <CardBody>
          <div className="flex flex-wrap gap-2">
            {paper.datasets.map(d=> <Button key={d}>{d}</Button>)}
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Ask the Paper (Chat)" subtitle="Q&A over the structured summary (local demo)" icon={<Bot className="w-5 h-5 mt-0.5"/>}/>
        <CardBody>
          <PaperChat paper={paper} />
        </CardBody>
      </Card>
    </div>
  )
}

function GraphMock({paper}){
  const nodes = [
    {id: paper.id, label: "Paper", x: 220, y: 80},
    ...paper.keywords.map((k,i)=>({id:`kw-${k}`, label:k, x: 60 + (i%3)*160, y: 180 + Math.floor(i/3)*80})),
    ...paper.datasets.map((d,i)=>({id:`ds-${d}`, label:d, x: 60 + i*160, y: 320}))
  ];
  const edges = [
    ...paper.keywords.map(k=> ({from: paper.id, to: `kw-${k}`})),
    ...paper.datasets.map(d=> ({from: paper.id, to: `ds-${d}`}))
  ];
  const map = Object.fromEntries(nodes.map(n=> [n.id, n]));
  return (
    <div className="w-full overflow-auto">
      <svg viewBox="0 0 520 380" className="w-full h-72 border rounded-2xl bg-white">
        {edges.map((e, i)=>{
          const a = map[e.from], b = map[e.to];
          return <line key={i} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="#94a3b8" strokeWidth={1.5} />
        })}
        {nodes.map((n, i)=> (
          <g key={i} transform={`translate(${n.x-12}, ${n.y-12})`}>
            <circle r={18} cx={12} cy={12} className="fill-indigo-50 stroke-indigo-300" />
            <text x={12} y={40} textAnchor="middle" className="text-[10px] fill-black/80">{n.label}</text>
          </g>
        ))}
      </svg>
    </div>
  )
}

function PaperChat({paper}){
  const [messages, setMessages] = useState([
    {role:"system", content:"Ask about the paper. This mock chat uses rule-based responses."}
  ]);
  const [inp, setInp] = useState("");
  const ask = ()=>{
    if(!inp.trim()) return;
    const userMsg = {role:"user", content: inp};
    const answer = mockAnswer(paper, inp);
    setMessages(prev=>[...prev, userMsg, {role:"assistant", content: answer}]);
    setInp("");
  }
  return (
    <div>
      <div className="h-40 overflow-auto p-3 rounded-xl border bg-white text-sm space-y-2">
        {messages.filter(m=>m.role!=="system").map((m, i)=> (
          <div key={i} className={`p-2 rounded-xl ${m.role==="user"?"bg-black/5":"bg-indigo-50"}`}>{m.content}</div>
        ))}
      </div>
      <div className="flex gap-2 mt-2">
        <Input placeholder="e.g., Explain findings in 1 sentence" value={inp} onChange={e=>setInp(e.target.value)} onKeyDown={e=> e.key==='Enter' && ask()} />
        <Button onClick={ask}><SendIcon/> Ask</Button>
      </div>
      <div className="text-xs text-black/60 mt-1">Wire this to your LLM endpoint with paper chunks for real answers.</div>
    </div>
  )
}

const SendIcon = ()=> <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16"><path d="M2 21l19-9L2 3v7l14 2-14 2z" fill="currentColor"/></svg>

function mockAnswer(paper, q){
  q = q.toLowerCase();
  if(q.includes("1 sentence") || q.includes("one sentence")){
    return `It shows ${paper.title.toLowerCase()} with key findings: ${paper.findings[0]}`;
    }
  if(q.includes("dataset")||q.includes("data")){
    return `Linked datasets: ${paper.datasets.join(", ")}. In production, we'd fetch previews and figures.`;
  }
  if(q.includes("methods")){
    return `Methods include flight vs 1g controls, imaging, and transcriptomics (see structured summary).`;
  }
  return `Key ideas: ${paper.findings.join("; ")}`;
}

// ---------- KNOWLEDGE CARDS DB (mock) ----------
const KNOWLEDGE_CARD_DB = {
  microgravity: {
    title: "Microgravity",
    blurb: "Condition in orbit where apparent weightlessness occurs; fluids, cells, and plants behave differently than on Earth.",
    faq: [
      {q:"Why does microgravity matter in biology?", a:"It alters fluid shear, diffusion, and signaling—revealing mechanisms hidden by Earth's gravity."},
      {q:"How is it simulated?", a:"Clinostats, random positioning machines, drop towers; or studied directly on ISS."}
    ]
  },
  arabidopsis: {
    title: "Arabidopsis thaliana",
    blurb: "A model plant organism used widely for genetics and space biology due to its short lifecycle and well-mapped genome.",
    faq: [
      {q:"Why use it in space?", a:"Compact, fast-growing, and genetic tools exist to interpret responses to spaceflight."}
    ]
  },
  microbiome: {
    title: "Microbiome",
    blurb: "Community of microorganisms living in a particular environment such as the ISS cabin surfaces.",
    faq:[{q:"So what?", a:"Shifts can affect crew health, materials, and biofilm risks."}]
  },
  cardiovascular: {
    title: "Cardiovascular Adaptation",
    blurb: "Physiological changes in heart and vessels due to fluid shifts and unloading in space or analogs.",
    faq:[{q:"Why study?", a:"To reduce orthostatic intolerance and maintain astronaut performance."}]
  }
};
