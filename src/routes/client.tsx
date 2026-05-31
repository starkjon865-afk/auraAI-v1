import { createFileRoute } from "@tanstack/react-router";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TrendingUp, TrendingDown, Users, Building2, Sparkles, Loader2, Briefcase, MapPin, AlertTriangle, Mail, Github, ExternalLink, Calendar, FileText, Phone, Award } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ChartClient } from "@/components/chart-client";
import { useState, useEffect } from "react";
import { createServerFn } from "@tanstack/react-start";
import React from "react";
import { useAuth } from "@/hooks/use-auth";
import { RouteGuard } from "@/components/route-guard";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const Route = createFileRoute("/client")({
  component: ClientView,
  head: () => ({
    meta: [{ title: "Client Analytics · Parity AI" }],
  }),
});


// Vinxi backend Server Function to fetch candidate shortlist matching from NVIDIA API
const shortlistCandidatesServer = createServerFn({ method: "POST" })
  .inputValidator((d: { jobDescription: string; candidates: string[] }) => d)
  .handler(async ({ data }) => {
    const apiKey = import.meta.env.VITE_API_KEY || import.meta.env.API_KEY || process.env.API_KEY;
    if (!apiKey) {
      throw new Error("NVIDIA API key not found. Please set VITE_API_KEY or API_KEY in your .env file or Vercel dashboard.");
    }

    const systemPrompt = {
      role: "system",
      content: "You are an AI Recruitment Assistant for an SDG-5 tech equity platform. Analyze the employer's job description, cross-reference it with our anonymous candidate database, and return a clean, styled markdown list shortlisting the best matches. Explain briefly why their skills fit the job requirements perfectly, emphasizing remote capability."
    };

    const userPrompt = `Employer Job Description:\n${data.jobDescription}\n\nAnonymous Candidate Database:\n${data.candidates.map((c, i) => `Candidate #${i + 1}: ${c}`).join("\n")}`;

    const response = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "nvidia/llama-3.3-nemotron-super-49b-v1.5",
        messages: [
          systemPrompt,
          { role: "user", content: userPrompt }
        ]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`NVIDIA API error (${response.status}): ${errorText}`);
    }

    const json = await response.json();
    return json.choices?.[0]?.message?.content || "";
  });

// Custom lightweight React Markdown parser to render clean structured typography
function parseMarkdown(text: string) {
  if (!text) return null;

  const lines = text.split("\n");
  let inList = false;
  let listItems: React.ReactNode[] = [];
  const elements: React.ReactNode[] = [];

  const parseInline = (str: string) => {
    // Inline code parsing: `code`
    const parts = str.split(/`([^`]+)`/g);
    return parts.map((part, idx) => {
      if (idx % 2 === 1) {
        return (
          <code key={idx} className="bg-muted px-1.5 py-0.5 rounded text-xs text-primary border border-border font-mono font-medium">
            {part}
          </code>
        );
      }
      // Bold parsing: **bold**
      const boldParts = part.split(/\*\*([^*]+)\*\*/g);
      return boldParts.map((bPart, bIdx) => {
        if (bIdx % 2 === 1) {
          return <strong key={bIdx} className="font-semibold text-foreground">{bPart}</strong>;
        }
        return bPart;
      });
    });
  };

  lines.forEach((line, lineIdx) => {
    const trimmed = line.trim();

    if (!trimmed) {
      if (inList) {
        elements.push(
          <ul key={`list-${lineIdx}`} className="list-disc pl-5 my-4 space-y-2 text-muted-foreground/90">
            {listItems}
          </ul>
        );
        listItems = [];
        inList = false;
      }
      return;
    }

    if (trimmed.startsWith("# ")) {
      if (inList) {
        elements.push(<ul key={`list-${lineIdx}`} className="list-disc pl-5 my-4 space-y-2">{listItems}</ul>);
        listItems = [];
        inList = false;
      }
      elements.push(
        <h1 key={lineIdx} className="text-2xl font-bold text-foreground mt-6 mb-4 border-b border-border pb-2 tracking-tight">
          {parseInline(trimmed.slice(2))}
        </h1>
      );
    }
    else if (trimmed.startsWith("## ")) {
      if (inList) {
        elements.push(<ul key={`list-${lineIdx}`} className="list-disc pl-5 my-4 space-y-2">{listItems}</ul>);
        listItems = [];
        inList = false;
      }
      elements.push(
        <h2 key={lineIdx} className="text-xl font-bold text-foreground mt-5 mb-3 tracking-tight">
          {parseInline(trimmed.slice(3))}
        </h2>
      );
    }
    else if (trimmed.startsWith("### ")) {
      if (inList) {
        elements.push(<ul key={`list-${lineIdx}`} className="list-disc pl-5 my-4 space-y-2">{listItems}</ul>);
        listItems = [];
        inList = false;
      }
      elements.push(
        <h3 key={lineIdx} className="text-lg font-bold text-foreground mt-4 mb-2 tracking-tight">
          {parseInline(trimmed.slice(4))}
        </h3>
      );
    }
    else if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
      inList = true;
      listItems.push(
        <li key={lineIdx} className="leading-relaxed text-muted-foreground/90">
          {parseInline(trimmed.slice(2))}
        </li>
      );
    }
    else if (/^\d+\.\s/.test(trimmed)) {
      if (inList) {
        elements.push(<ul key={`list-${lineIdx}`} className="list-disc pl-5 my-4 space-y-2">{listItems}</ul>);
        listItems = [];
        inList = false;
      }
      const content = trimmed.replace(/^\d+\.\s/, "");
      elements.push(
        <div key={lineIdx} className="pl-4 border-l-2 border-primary/40 my-3 py-1">
          <p className="text-sm font-medium text-foreground">{parseInline(content)}</p>
        </div>
      );
    }
    else {
      if (inList) {
        elements.push(<ul key={`list-${lineIdx}`} className="list-disc pl-5 my-4 space-y-2">{listItems}</ul>);
        listItems = [];
        inList = false;
      }
      elements.push(
        <p key={lineIdx} className="my-3 leading-relaxed text-muted-foreground/90">
          {parseInline(trimmed)}
        </p>
      );
    }
  });

  if (inList) {
    elements.push(
      <ul key={`list-end`} className="list-disc pl-5 my-4 space-y-2 text-muted-foreground/90">
        {listItems}
      </ul>
    );
  }

  return elements;
}

const candidateDatabase = [
  {
    id: "Candidate #01 - Lahore",
    location: "Lahore, Pakistan",
    remote: "100% Remote only",
    skills: ["Python", "Data Cleaning", "Tableau", "SQL"],
    targetRole: "Looking for entry-level Data Analyst roles.",
    bio: "Based in Lahore. 100% Remote only. Skills: Python, Data Cleaning, Tableau, SQL. Looking for entry-level Data Analyst roles.",
    email: "ayesha.design@gmail.com",
    portfolio: "github.com/stealth-data-pk",
    phone: "+92 300 ••••781",
    realName: "Ayesha Ahmed"
  },
  {
    id: "Candidate #02 - Karachi",
    location: "Karachi, Pakistan",
    remote: "100% Remote only",
    skills: ["Figma", "UI/UX Design", "Wireframing", "Tailwind CSS"],
    targetRole: "Looking for junior design roles.",
    bio: "Based in Karachi. 100% Remote only. Skills: Figma, UI/UX Design, Wireframing, Tailwind CSS. Looking for junior design roles.",
    email: "candidate02.talent@parity.pk",
    portfolio: "behance.net/stealth-design-pk",
    phone: "+92 321 ••••942",
    realName: "Zainab Khan"
  },
  {
    id: "Candidate #03 - Islamabad",
    location: "Islamabad, Pakistan",
    remote: "100% Remote only",
    skills: ["React", "JavaScript", "HTML/CSS", "Git"],
    targetRole: "Looking for Frontend Developer positions.",
    bio: "Based in Islamabad. 100% Remote only. Skills: React, JavaScript, HTML/CSS, Git. Looking for Frontend Developer positions.",
    email: "candidate03.talent@parity.pk",
    portfolio: "github.com/stealth-frontend-pk",
    phone: "+92 333 ••••115",
    realName: "Fatima Bibi"
  }
];

const sectorData = [
  { sector: "AI / ML", proficient: 142, learning: 318 },
  { sector: "Cloud", proficient: 286, learning: 214 },
  { sector: "DevOps", proficient: 198, learning: 162 },
  { sector: "Security", proficient: 94, learning: 287 },
  { sector: "Data", proficient: 221, learning: 198 },
  { sector: "Mobile", proficient: 112, learning: 86 },
];

const trendData = [
  { month: "Jan", placements: 62 },
  { month: "Feb", placements: 65 },
  { month: "Mar", placements: 64 },
  { month: "Apr", placements: 71 },
  { month: "May", placements: 74 },
  { month: "Jun", placements: 78 },
  { month: "Jul", placements: 82 },
];

const distribution = [
  { name: "100% Remote Full-Time", value: 34 },
  { name: "Freelance / Contract", value: 31 },
  { name: "Part-Time Flexible", value: 18 },
  { name: "In Training / Upskilling", value: 17 },
];

const COLORS = [
  "oklch(0.65 0.25 285)",
  "oklch(0.72 0.18 200)",
  "oklch(0.78 0.18 150)",
  "oklch(0.78 0.18 60)",
];

const teams = [
  { team: "Punjab (Urban)", headcount: 84, top: "Data Analytics", gap: "Global Client Communication", score: 86, trend: "up" },
  { team: "Sindh (Urban)", headcount: 46, top: "UI/UX Design", gap: "Advanced Portfolio Assets", score: 79, trend: "up" },
  { team: "KPK Region", headcount: 32, top: "Python & AI Operations", gap: "Unstable Power Grid / Electricity", score: 91, trend: "up" },
  { team: "Balochistan Region", headcount: 21, top: "Technical Writing", gap: "High-Speed Internet Access", score: 68, trend: "down" },
  { team: "Rural / Semi-Urban Communities", headcount: 28, top: "Web Development", gap: "Family / Mobility Restrictions", score: 72, trend: "down" },
];

function ClientView() {
  const { userRole } = useAuth();
  const [selectedCandidate, setSelectedCandidate] = useState<any | null>(null);
  const [timeframe, setTimeframe] = useState<'7D' | '30D' | 'QTD' | 'YTD'>('30D');
  const [barData, setBarData] = useState(sectorData);

  // AI Talent Shortlisting Simulator State
  const [jobDescription, setJobDescription] = useState(
    "We are looking for a remote data enthusiast who can handle SQL databases and build clean visual dashboards using Tableau..."
  );
  const [shortlistResult, setShortlistResult] = useState<string | null>(null);
  const [isMatching, setIsMatching] = useState(false);
  const [matchError, setMatchError] = useState<string | null>(null);

  useEffect(() => {
    fetch("https://api.worldbank.org/v2/country/pk/indicator/SL.TLF.CACT.FE.ZS?format=json")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 1 && Array.isArray(data[1])) {
          const records = data[1]
            .filter((item: any) => item.value !== null);

          const latestValue = records[0]?.value || 24.05;

          if (timeframe === '7D' || timeframe === '30D') {
            const sectors = ["AI / ML", "Cloud", "DevOps", "Security", "Data", "Mobile"];
            
            const variance7D = [7.2, -4.5, 3.1, -6.2, 5.8, -2.9];
            const variance30D = [3.8, -5.9, 1.4, -3.1, 4.2, -1.1];
            
            const variance = timeframe === '7D' ? variance7D : variance30D;

            const mapped = sectors.map((sec, idx) => {
              const val = latestValue + variance[idx];
              return {
                sector: sec,
                proficient: Number(val.toFixed(2)),
                learning: Number((val * 0.85).toFixed(2)),
              };
            });
            setBarData(mapped);
          } else {
            const yearsCount = timeframe === 'QTD' ? 6 : 12;
            const slicedRecords = records
              .slice(0, yearsCount)
              .reverse();

            const mapped = slicedRecords.map((item: any) => ({
              sector: item.date,
              proficient: Number(item.value.toFixed(2)),
              learning: Number((item.value * 0.85).toFixed(2)),
            }));
            setBarData(mapped);
          }
        }
      })
      .catch((err) => {
        console.error("Failed to fetch live World Bank API data:", err);
      });
  }, [timeframe]);

  const handleTalentMatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!jobDescription.trim() || isMatching) return;

    setIsMatching(true);
    setMatchError(null);
    setShortlistResult(null);

    try {
      const candidatesBio = candidateDatabase.map(c => c.bio);
      const result = await shortlistCandidatesServer({
        data: {
          jobDescription: jobDescription.trim(),
          candidates: candidatesBio
        }
      });

      setShortlistResult(result);
    } catch (err) {
      console.error(err);
      setMatchError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsMatching(false);
    }
  };

  return (
    <RouteGuard allowedRoles={["client", "admin"]} currentRole={userRole}>
      <div className="p-6 lg:p-10 max-w-[1500px] mx-auto">
      <header className="mb-8 flex items-end justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-primary mb-2">
            <Building2 className="h-3.5 w-3.5" />
            Client Analytics
          </div>
          <h1 className="text-3xl lg:text-4xl font-semibold">Talent Supply & Placement Intelligence</h1>
          <p className="mt-2 text-muted-foreground">
            National Network · 2,184 active female applicants synced live
          </p>
        </div>
        <div className="flex gap-2">
          {(["7D", "30D", "QTD", "YTD"] as const).map((p) => (
            <button
              key={p}
              onClick={() => setTimeframe(p)}
              className={`px-3 py-1.5 text-xs rounded-md border cursor-pointer transition ${
                timeframe === p
                  ? "border-primary bg-accent text-primary"
                  : "border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </header>

      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: "ECONOMIC AUTONOMY INDEX", value: "82.5", delta: "+4.2% this quarter", up: true },
          { label: "ACTIVE REGISTRATIONS", value: "2,184", delta: "+128 this week", up: true },
          { label: "AVG. SPEED TO PLACEMENT", value: "6.4 weeks", delta: "-1.1 weeks shorter training cycle", up: true },
          { label: "ACTIVE SYSTEM BOOTCAMPS", value: "14", delta: "+3 localized streams added", up: true },
        ].map((k) => (
          <div
            key={k.label}
            className="rounded-xl border border-border bg-card p-5 relative overflow-hidden"
          >
            <div className="text-[11px] uppercase tracking-[0.15em] text-muted-foreground">
              {k.label}
            </div>
            <div className="mt-2 flex items-end justify-between">
              <div className="text-3xl font-display font-semibold">{k.value}</div>
              <div
                className={`flex items-center gap-1 text-xs ${
                  k.up ? "text-emerald-400" : "text-rose-400"
                }`}
              >
                {k.up ? (
                  <TrendingUp className="h-3.5 w-3.5" />
                ) : (
                  <TrendingDown className="h-3.5 w-3.5" />
                )}
                {k.delta}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Bar chart */}
        <div className="lg:col-span-2 rounded-xl border border-border bg-card p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold">Skill distribution by sector</h2>
              <p className="text-xs text-muted-foreground">Proficient vs. actively learning</p>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-primary" /> Proficient
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-chart-2" /> Learning
              </span>
            </div>
          </div>
          <ChartClient height={280}>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.3 0.02 285 / 40%)" vertical={false} />
                <XAxis dataKey="sector" stroke="oklch(0.65 0.02 280)" fontSize={11} />
                <YAxis stroke="oklch(0.65 0.02 280)" fontSize={11} />
                <Tooltip
                  contentStyle={{
                    background: "oklch(0.18 0.018 280)",
                    border: "1px solid oklch(0.3 0.05 285)",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
                <Bar dataKey="proficient" fill="oklch(0.65 0.25 285)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="learning" fill="oklch(0.72 0.18 200)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartClient>
        </div>

        {/* Pie chart */}
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="text-lg font-semibold">Talent Availability Type</h2>
          <p className="text-xs text-muted-foreground mb-2">Across all sectors · % of talent pool</p>
          <ChartClient height={220}>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={distribution}
                  dataKey="value"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={3}
                  stroke="oklch(0.14 0.015 280)"
                  strokeWidth={2}
                >
                  {distribution.map((_, i) => (
                    <Cell key={i} fill={COLORS[i]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: "oklch(0.18 0.018 280)",
                    border: "1px solid oklch(0.3 0.05 285)",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </ChartClient>
          <div className="grid grid-cols-2 gap-2 mt-2">
            {distribution.map((d, i) => (
              <div key={d.name} className="flex items-center gap-2 text-xs">
                <span className="h-2 w-2 rounded-full" style={{ background: COLORS[i] }} />
                <span className="text-muted-foreground">{d.name}</span>
                <span className="ml-auto font-medium">{d.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Trend + Table */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="text-lg font-semibold">Successful Monthly Placements</h2>
          <p className="text-xs text-muted-foreground mb-4">Growing number of remote career placements in Pakistan</p>
          <ChartClient height={220}>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.3 0.02 285 / 40%)" vertical={false} />
                <XAxis dataKey="month" stroke="oklch(0.65 0.02 280)" fontSize={11} />
                <YAxis stroke="oklch(0.65 0.02 280)" fontSize={11} domain={[50, 100]} />
                <Tooltip
                  contentStyle={{
                    background: "oklch(0.18 0.018 280)",
                    border: "1px solid oklch(0.3 0.05 285)",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="placements"
                  stroke="oklch(0.72 0.28 290)"
                  strokeWidth={2.5}
                  dot={{ fill: "oklch(0.72 0.28 290)", r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartClient>
        </div>

        <div className="lg:col-span-2 rounded-xl border border-border bg-card overflow-hidden">
          <div className="p-6 pb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">Regional Talent & Support Analysis</h2>
              <p className="text-xs text-muted-foreground">Socio-cultural constraints and skill tracking per region</p>
            </div>
            <Badge variant="outline" className="border-primary/50 text-primary text-[10px] uppercase tracking-wider">
              <Users className="h-3 w-3 mr-1" /> 5 regions
            </Badge>
          </div>
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead>Region</TableHead>
                <TableHead className="text-right">Headcount</TableHead>
                <TableHead>Top skill</TableHead>
                <TableHead>Key gap</TableHead>
                <TableHead className="text-right">Score</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {teams.map((t) => (
                <TableRow key={t.team} className="border-border">
                  <TableCell className="font-medium">{t.team}</TableCell>
                  <TableCell className="text-right text-muted-foreground">{t.headcount}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="border-primary/40 text-primary">
                      {t.top}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{t.gap}</TableCell>
                  <TableCell className="text-right">
                    <span
                      className={`inline-flex items-center gap-1 font-medium ${
                        t.trend === "up" ? "text-emerald-400" : "text-rose-400"
                      }`}
                    >
                      {t.score}
                      {t.trend === "up" ? (
                        <TrendingUp className="h-3 w-3" />
                      ) : (
                        <TrendingDown className="h-3 w-3" />
                      )}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* SDG-5 AI Talent Shortlisting Simulator */}
      <div className="rounded-xl border border-border bg-card p-6">
        <header className="mb-6">
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-primary mb-2">
            <Sparkles className="h-3.5 w-3.5" />
            Talent Matching System
          </div>
          <h2 className="text-2xl font-semibold">SDG-5 AI Talent Shortlisting Simulator</h2>
          <p className="mt-1 text-muted-foreground text-sm max-w-3xl">
            Instantly cross-reference job requirements with pre-vetted, anonymous female candidates from the Pakistan region under 100% remote-flexible criteria.
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Candidates Database Column */}
          <div className="lg:col-span-2 space-y-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5" /> Anonymous Talent Pool (Pakistan)
            </h3>
            <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-primary/10">
              {candidateDatabase.map((cand) => (
                <div
                  key={cand.id}
                  onClick={() => setSelectedCandidate(cand)}
                  className="rounded-xl border border-border bg-background/40 hover:bg-background/60 p-4 transition-all duration-200 shadow-md relative overflow-hidden group hover:border-primary/30 cursor-pointer active:scale-[0.99] hover:shadow-[0_0_20px_-8px_oklch(0.65_0.25_285/30%)]"
                >
                  <div className="absolute -right-6 -bottom-6 opacity-[0.03] text-primary group-hover:scale-110 transition-transform">
                    <Briefcase className="h-24 w-24" />
                  </div>
                  
                  <div className="flex items-start justify-between mb-3 flex-wrap gap-2">
                    <span className="font-semibold text-foreground text-sm font-mono tracking-tight">
                      {cand.id}
                    </span>
                    <Badge variant="outline" className="border-primary/40 text-primary text-[10px] bg-primary/5">
                      {cand.remote}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-3">
                    <MapPin className="h-3 w-3 text-primary" />
                    <span>{cand.location}</span>
                  </div>

                  <div className="text-xs text-foreground/90 font-medium mb-3 leading-relaxed">
                    {cand.targetRole}
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {cand.skills.map((skill) => (
                      <span
                        key={skill}
                        className="px-2 py-0.5 rounded bg-muted/95 border border-border text-[10px] text-muted-foreground font-medium font-sans"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Job Input & Matching Column */}
          <div className="lg:col-span-3 space-y-4 flex flex-col">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
              <Briefcase className="h-3.5 w-3.5" /> Interactive Job Matcher
            </h3>

            <form onSubmit={handleTalentMatch} className="space-y-4">
              <div className="flex flex-col">
                <label className="text-xs text-muted-foreground font-medium mb-1.5">
                  Paste Employer Job Description
                </label>
                <textarea
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  placeholder="Paste a job description here..."
                  disabled={isMatching}
                  className="w-full h-32 bg-background/50 border border-border/80 focus:border-primary/80 focus:ring-1 focus:ring-primary/40 rounded-xl p-4 font-sans text-sm outline-none transition disabled:opacity-50 resize-y leading-relaxed text-foreground placeholder:text-muted-foreground/45"
                />
              </div>

              <button
                type="submit"
                disabled={!jobDescription.trim() || isMatching}
                className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-medium shadow-[var(--shadow-glow)] hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2 tracking-wide text-sm shrink-0"
              >
                {isMatching ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Matching candidate profiles...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Run AI Talent Match
                  </>
                )}
              </button>
            </form>

            {/* Matching Result Display */}
            <div className="flex-1 flex flex-col min-h-[300px]">
              {isMatching && (
                <div className="flex-1 flex flex-col items-center justify-center gap-3 border border-border/40 rounded-xl bg-background/10 backdrop-blur-sm p-8 animate-pulse text-center">
                  <div className="relative flex items-center justify-center">
                    <Loader2 className="h-8 w-8 text-primary animate-spin" />
                    <div className="absolute inset-0 h-8 w-8 rounded-full border border-primary/20 blur-md" />
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium tracking-wide">
                    <span className="h-2 w-2 rounded-full bg-primary animate-bounce [animation-delay:-0.3s]" />
                    <span className="h-2 w-2 rounded-full bg-primary animate-bounce [animation-delay:-0.15s]" />
                    <span className="h-2 w-2 rounded-full bg-primary animate-bounce" />
                    <span>NVIDIA Llama is matching profiles...</span>
                  </div>
                </div>
              )}

              {matchError && (
                <div className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-4 text-center">
                  <AlertTriangle className="h-8 w-8 text-rose-400 mx-auto mb-2 animate-bounce" />
                  <h4 className="text-sm font-semibold text-rose-200">Talent Match Failure</h4>
                  <p className="text-xs text-rose-300/80 mt-1 max-w-md mx-auto">{matchError}</p>
                </div>
              )}

              {shortlistResult && !isMatching && (
                <div className="rounded-xl border border-border/50 bg-card p-5 shadow-lg overflow-y-auto max-h-[600px] border-primary/30 relative">
                  <div className="absolute top-4 right-4 flex items-center gap-1 text-[10px] uppercase tracking-wider text-emerald-400 font-mono font-medium">
                    <Badge variant="outline" className="border-emerald-500/30 text-emerald-400 bg-emerald-500/5">
                      Shortlist Generated
                    </Badge>
                  </div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">
                    NVIDIA shortlisting report
                  </h4>
                  <div className="prose prose-invert max-w-none text-sm text-foreground/90 leading-relaxed font-sans">
                    {parseMarkdown(shortlistResult)}
                  </div>
                </div>
              )}

              {!shortlistResult && !isMatching && !matchError && (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-8 border border-dashed border-border/40 rounded-xl bg-background/5 text-muted-foreground">
                  <Sparkles className="h-8 w-8 text-muted-foreground/30 mb-2" />
                  <p className="text-sm font-medium">No active matching results</p>
                  <p className="text-xs text-muted-foreground/60 max-w-xs mt-1">
                    Paste a job description above and run the AI talent match to shortlist the pre-vetted remote candidates.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Sleek Contact Modal */}
      <Dialog open={selectedCandidate !== null} onOpenChange={(open) => { if (!open) setSelectedCandidate(null); }}>
        <DialogContent className="max-w-md bg-card/95 backdrop-blur-xl border border-border/80 rounded-2xl shadow-[var(--shadow-elegant)] p-6 text-foreground z-50">
          {selectedCandidate && (
            <>
              <div className="absolute top-0 left-0 h-1 w-full bg-[image:var(--gradient-primary)]" />
              
              <DialogHeader className="space-y-1 mb-4 text-left">
                <span className="text-[10px] font-bold text-primary uppercase tracking-[0.2em] font-mono">
                  Secure Talent Pipeline
                </span>
                <DialogTitle className="text-xl font-display font-bold text-foreground">
                  Secure Profile: {selectedCandidate.id}
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  Masked Candidate Profile · Verified by Parity AI SDG-5 Protocol
                </DialogDescription>
              </DialogHeader>

              {/* Bio / Description */}
              <div className="space-y-4 text-sm">
                <div className="rounded-xl bg-background/40 border border-border/40 p-4 leading-relaxed text-muted-foreground/90">
                  <span className="text-xs font-semibold text-foreground uppercase tracking-wider block mb-1">
                    Candidate Statement
                  </span>
                  {selectedCandidate.bio}
                </div>

                {/* Verified Skills & Badges */}
                <div>
                  <span className="text-xs font-semibold text-foreground uppercase tracking-wider block mb-2 flex items-center gap-1.5">
                    <Award className="h-4.5 w-4.5 text-primary" />
                    Verified Skills & Badges
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedCandidate.skills.map((skill) => (
                      <span
                        key={skill}
                        className="px-2.5 py-1 rounded bg-primary/10 border border-primary/20 text-xs text-primary font-medium flex items-center gap-1 shadow-[0_0_10px_-3px_var(--primary)]"
                      >
                        <Sparkles className="h-3 w-3 animate-pulse" />
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Secure Contact Information */}
                <div className="rounded-xl border border-border bg-background/30 p-4 space-y-3">
                  <span className="text-xs font-semibold text-foreground uppercase tracking-wider block mb-1">
                    Secure Contact Information
                  </span>
                  
                  {/* Email */}
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
                      <Mail className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-[10px] uppercase tracking-wider text-muted-foreground/75 font-semibold">Anonymized Email</div>
                      <a href={`mailto:${selectedCandidate.email}`} className="text-sm font-mono font-medium hover:text-primary transition truncate block">
                        {selectedCandidate.email}
                      </a>
                    </div>
                  </div>

                  {/* Portfolio */}
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
                      <Github className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-[10px] uppercase tracking-wider text-muted-foreground/75 font-semibold">Stealth Portfolio</div>
                      <a href={`https://${selectedCandidate.portfolio}`} target="_blank" rel="noopener noreferrer" className="text-sm font-mono font-medium hover:text-primary transition flex items-center gap-1 truncate block">
                        {selectedCandidate.portfolio}
                        <ExternalLink className="h-3 w-3 shrink-0 opacity-75" />
                      </a>
                    </div>
                  </div>

                  {/* Phone */}
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
                      <Phone className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-[10px] uppercase tracking-wider text-muted-foreground/75 font-semibold">Masked Contact</div>
                      <div className="text-sm font-mono font-medium">
                        {selectedCandidate.phone}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer Actions */}
              <div className="flex flex-col sm:flex-row gap-2 mt-6">
                <Button
                  onClick={() => {
                    toast.success(`Secure interview invite dispatched to ${selectedCandidate.realName || "Candidate"}!`);
                    setSelectedCandidate(null);
                  }}
                  className="flex-grow h-11 rounded-xl bg-primary text-primary-foreground font-semibold shadow-[var(--shadow-glow)] hover:opacity-95 transition cursor-pointer flex items-center justify-center gap-2 text-sm border-0"
                >
                  <Calendar className="h-4 w-4" />
                  Send Interview Invite
                </Button>
                
                <Button
                  onClick={() => {
                    toast.success(`Stealth resume downloaded for ${selectedCandidate.id}.`);
                  }}
                  variant="outline"
                  className="h-11 border-border/80 hover:bg-accent rounded-xl px-4 text-sm font-medium transition cursor-pointer flex items-center justify-center gap-2"
                >
                  <FileText className="h-4 w-4" />
                  Stealth Resume
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  </RouteGuard>
);
}
