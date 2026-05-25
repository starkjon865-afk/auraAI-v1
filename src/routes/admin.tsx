import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { createServerFn } from "@tanstack/react-start";
import fs from "node:fs";
import path from "node:path";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Activity,
  Cpu,
  Server,
  Users,
  Zap,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  TrendingUp,
  DollarSign,
  Briefcase
} from "lucide-react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ChartClient } from "@/components/chart-client";

export const Route = createFileRoute("/admin")({
  component: AdminView,
  head: () => ({
    meta: [{ title: "Admin Console · EquiTech" }],
  }),
});

interface JobRow {
  job_id: string;
  job_title: string;
  salary_usd: string;
  salary_currency: string;
  experience_level: string;
  employment_type: string;
  company_location: string;
  company_size: string;
  employee_residence: string;
  remote_ratio: string;
  required_skills: string;
  education_required: string;
  years_experience: string;
  industry: string;
  posting_date: string;
  application_deadline: string;
  job_description_length: string;
  benefits_score: string;
  company_name: string;
}

interface PriorityField {
  title: string;
  avgSalary: number;
  count: number;
}

function parseCSV(csvText: string): JobRow[] {
  const lines = csvText.split(/\r?\n/);
  if (lines.length === 0) return [];
  
  const headers = lines[0].split(",").map(h => h.trim());
  const data: JobRow[] = [];
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    const values: string[] = [];
    let insideQuote = false;
    let currentValue = "";
    
    for (let j = 0; j < line.length; j++) {
      const char = line[j];
      if (char === '"') {
        insideQuote = !insideQuote;
      } else if (char === ',' && !insideQuote) {
        values.push(currentValue.trim());
        currentValue = "";
      } else {
        currentValue += char;
      }
    }
    values.push(currentValue.trim());
    
    if (values.length === headers.length) {
      const row = {} as JobRow;
      for (let k = 0; k < headers.length; k++) {
        row[headers[k] as keyof JobRow] = values[k];
      }
      data.push(row);
    }
  }
  return data;
}

const loadAdminMetricsServer = createServerFn({ method: "GET" })
  .handler(async () => {
    try {
      const csvPath = path.resolve(process.cwd(), "public", "ai_job_market_2025.csv");
      if (!fs.existsSync(csvPath)) {
        throw new Error(`CSV dataset not found at expected path: ${csvPath}`);
      }
      
      const csvText = fs.readFileSync(csvPath, "utf8");
      const rows = parseCSV(csvText);

      let remoteCount = 0;
      let entrySalarySum = 0;
      let entrySalaryCount = 0;

      const groups: Record<string, { sum: number; count: number }> = {};

      for (const row of rows) {
        const remoteRatio = Number(row.remote_ratio);
        const salary = Number(row.salary_usd);

        if (remoteRatio === 100) {
          remoteCount++;
        }

        if (row.experience_level === "EN" && remoteRatio === 100) {
          entrySalarySum += salary;
          entrySalaryCount++;
        }

        // Top Remote Freelance Domains (employment_type FL or remote_ratio 100)
        if (row.employment_type === "FL" || remoteRatio === 100) {
          const title = row.job_title;
          if (!groups[title]) {
            groups[title] = { sum: 0, count: 0 };
          }
          groups[title].sum += salary;
          groups[title].count++;
        }
      }

      const avgEntrySalary = entrySalaryCount > 0 ? Math.round(entrySalarySum / entrySalaryCount) : 0;

      const groupedList = Object.keys(groups).map(title => ({
        title,
        avgSalary: Math.round(groups[title].sum / groups[title].count),
        count: groups[title].count
      }));

      // Sort descending by average salary
      groupedList.sort((a, b) => b.avgSalary - a.avgSalary);

      return {
        highValueRemoteRoles: remoteCount,
        averageEntryRemoteSalary: avgEntrySalary,
        totalListings: rows.length,
        priorityFields: groupedList.slice(0, 3)
      };
    } catch (err) {
      console.error("Error in loadAdminMetricsServer:", err);
      throw new Error(err instanceof Error ? err.message : String(err));
    }
  });

const tokenData = Array.from({ length: 24 }, (_, i) => ({
  hour: `${i}:00`,
  tokens: Math.round(180 + Math.sin(i / 3) * 80 + Math.random() * 60),
}));

function AdminView() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<{
    highValueRemoteRoles: number;
    averageEntryRemoteSalary: number;
    totalListings: number;
    priorityFields: PriorityField[];
  }>({
    highValueRemoteRoles: 0,
    averageEntryRemoteSalary: 0,
    totalListings: 0,
    priorityFields: []
  });

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const data = await loadAdminMetricsServer();
        setMetrics(data);
      } catch (err) {
        console.error(err);
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-4">
        <div className="relative flex items-center justify-center">
          <Loader2 className="h-10 w-10 text-primary animate-spin" />
          <div className="absolute inset-0 h-10 w-10 rounded-full border border-primary/20 blur-md" />
        </div>
        <p className="text-muted-foreground text-sm animate-pulse tracking-wide font-medium">
          Parsing SDG-5 Equity Insights...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 lg:p-10 max-w-4xl mx-auto flex flex-col items-center justify-center min-h-[50vh] text-center">
        <AlertTriangle className="h-12 w-12 text-destructive mb-4 animate-bounce" />
        <h2 className="text-xl font-bold mb-2">Error Loading Dataset</h2>
        <p className="text-muted-foreground mb-4 max-w-md">{error}</p>
        <Badge variant="destructive">Verification Failed</Badge>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-10 max-w-7xl mx-auto">
      <header className="mb-8">
        <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-primary mb-2">
          <ShieldCheck className="h-3.5 w-3.5" />
          Admin Console
        </div>
        <h1 className="text-3xl lg:text-4xl font-semibold">Command center.</h1>
        <p className="mt-2 text-muted-foreground">
          Real-time operational view across consumption, infrastructure, and parsed market telemetry.
        </p>
      </header>

      {/* Metric cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-6">
        <MetricCard
          icon={Briefcase}
          label="Total Accessible Remote Positions"
          value={metrics.highValueRemoteRoles.toLocaleString()}
          sub={`out of ${metrics.totalListings.toLocaleString()} total roles parsed`}
          delta={`${((metrics.highValueRemoteRoles / metrics.totalListings) * 100).toFixed(1)}% of pool`}
          progress={(metrics.highValueRemoteRoles / metrics.totalListings) * 100}
          accent
        />
        <MetricCard
          icon={DollarSign}
          label="Average Starting Remote Income"
          value={`$${metrics.averageEntryRemoteSalary.toLocaleString()}`}
          sub="average starting salary for EN remote roles"
          delta="USD / yr"
          progress={Math.min(100, (metrics.averageEntryRemoteSalary / 100000) * 100)}
        />
        <MetricCard
          icon={Cpu}
          label="Analytic Dataset Scope"
          value={metrics.totalListings.toLocaleString()}
          sub="job listings successfully analyzed"
          delta="100% active"
          progress={100}
        />
      </div>

      {/* SDG-5 Priority Market Fields Table */}
      <div className="rounded-xl border border-border bg-card p-6 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
          <div>
            <h2 className="text-lg font-semibold text-foreground">SDG-5 Priority Market Fields</h2>
            <p className="text-xs text-muted-foreground">
              Top highest-paying fields offering optimal financial independence and accessibility for home-restricted applicants
            </p>
          </div>
          <Badge variant="outline" className="border-primary/50 text-primary text-[10px] uppercase tracking-wider w-fit">
            <TrendingUp className="h-3 w-3 mr-1" /> Best Value
          </Badge>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[600px]">
            <thead>
              <tr className="border-b border-border/60 text-xs font-semibold uppercase tracking-wider text-muted-foreground/80">
                <th className="py-3 px-4">Priority Ranking</th>
                <th className="py-3 px-4">Career Domain Field</th>
                <th className="py-3 px-4 text-right">Average Remote Salary</th>
                <th className="py-3 px-4 text-right">Available Positions</th>
                <th className="py-3 px-4 text-center">Accessibility Rating</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40 text-sm">
              {metrics.priorityFields.map((field, idx) => (
                <tr key={field.title} className="hover:bg-muted/30 transition-colors">
                  <td className="py-4 px-4 font-mono font-bold text-primary">
                    #0{idx + 1}
                  </td>
                  <td className="py-4 px-4 font-medium text-foreground">
                    {field.title}
                  </td>
                  <td className="py-4 px-4 text-right font-mono font-semibold text-emerald-400">
                    ${field.avgSalary.toLocaleString()} <span className="text-[10px] text-muted-foreground">USD</span>
                  </td>
                  <td className="py-4 px-4 text-right font-mono text-muted-foreground">
                    {field.count} <span className="text-[10px]">jobs</span>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center justify-center">
                      <div className="h-2 w-24 rounded-full bg-secondary overflow-hidden">
                        <div 
                          className="h-full bg-[image:var(--gradient-primary)]" 
                          style={{ width: `${Math.min(100, (field.count / 400) * 100)}%` }}
                        />
                      </div>
                      <span className="text-xs font-mono ml-2 text-muted-foreground">
                        {Math.min(10, Math.round((field.count / 400) * 10))}/10
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Token chart */}
      <div className="rounded-xl border border-border bg-card p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold">User Portal Traffic Velocity</h2>
            <p className="text-xs text-muted-foreground">Active concurrent sessions across applicant coaching terminals</p>
          </div>
          <Badge variant="outline" className="border-primary/50 text-primary text-[10px] uppercase tracking-wider">
            <Activity className="h-3 w-3 mr-1" /> Live
          </Badge>
        </div>
        <ChartClient height={240}>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={tokenData}>
              <defs>
                <linearGradient id="tokenGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="oklch(0.72 0.28 290)" stopOpacity={0.5} />
                  <stop offset="100%" stopColor="oklch(0.72 0.28 290)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="hour" stroke="oklch(0.65 0.02 280)" fontSize={10} interval={2} />
              <YAxis stroke="oklch(0.65 0.02 280)" fontSize={10} />
              <Tooltip
                contentStyle={{
                  background: "oklch(0.18 0.018 280)",
                  border: "1px solid oklch(0.3 0.05 285)",
                  borderRadius: 8,
                  fontSize: 12,
                }}
              />
              <Area
                type="monotone"
                dataKey="tokens"
                stroke="oklch(0.72 0.28 290)"
                strokeWidth={2}
                fill="url(#tokenGrad)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartClient>
      </div>

      {/* Services + recent activity */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 rounded-xl border border-border bg-card p-6">
          <h2 className="text-lg font-semibold mb-1">Platform Core Infrastructure Status</h2>
          <p className="text-xs text-muted-foreground mb-5">Gateway operational metrics and model inference pipelines</p>
          <div className="space-y-3">
            {[
              { name: "NVIDIA Llama Cluster Gateway", region: "Global", latency: "42ms", status: "ok" },
              { name: "Kaggle Dataset Engine", region: "Local File Parser", latency: "12ms", status: "ok" },
              { name: "User State Memory Pool", region: "Session Cache", latency: "24ms", status: "ok" },
              { name: "Local Digitized Wallet API", region: "Sadapay/Nayapay Link", latency: "612ms", status: "warn" },
              { name: "Employer Job Matching Router", region: "Inference Pipeline", latency: "28ms", status: "ok" },
            ].map((s) => (
              <div
                key={s.name}
                className="flex items-center justify-between rounded-lg border border-border bg-background/40 px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  {s.status === "ok" ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 text-amber-400" />
                  )}
                  <div>
                    <div className="text-sm font-medium">{s.name}</div>
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                      {s.region}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-mono">{s.latency}</div>
                  <div className={`text-[10px] uppercase tracking-wider ${
                    s.status === "ok" ? "text-emerald-400" : "text-amber-400"
                  }`}>
                    {s.status === "ok" ? "Operational" : "Degraded"}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-2 rounded-xl border border-border bg-card p-6">
          <h2 className="text-lg font-semibold mb-1">Latest Platform Registrations</h2>
          <p className="text-xs text-muted-foreground mb-5">Recent user profiles added to the national database</p>
          <div className="space-y-3">
            {[
              { name: "Ayesha Ahmed", org: "Rawalpindi · Aspiring UI/UX Designer", time: "2m" },
              { name: "Zainab Khan", org: "Multan · Entry Data Analyst", time: "11m" },
              { name: "Fatima Bibi", org: "Peshawar · AI Content Strategist", time: "27m" },
              { name: "Sana Malik", org: "Faisalabad · Frontend Trainee", time: "44m" },
              { name: "Hira Iqbal", org: "Sargodha · Python Developer", time: "1h" },
            ].map((u) => (
              <div key={u.name} className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-accent border border-primary/30 flex items-center justify-center text-xs font-medium text-primary">
                  {u.name.split(" ").map((n) => n[0]).join("")}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{u.name}</div>
                  <div className="text-[11px] text-muted-foreground truncate">{u.org}</div>
                </div>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  {u.time} ago
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
  sub,
  delta,
  progress,
  accent,
  status,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  sub: string;
  delta: string;
  progress: number;
  accent?: boolean;
  status?: "ok" | "warn";
}) {
  return (
    <div
      className={`rounded-xl border bg-card p-6 relative overflow-hidden transition ${
        accent ? "border-primary/40 shadow-[var(--shadow-glow)]" : "border-border"
      }`}
    >
      {accent && (
        <div className="absolute -top-10 -right-10 h-32 w-32 rounded-full bg-primary/20 blur-3xl pointer-events-none" />
      )}
      <div className="relative">
        <div className="flex items-start justify-between mb-4">
          <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${
            accent
              ? "bg-[image:var(--gradient-primary)] text-primary-foreground"
              : "bg-accent text-primary border border-primary/20"
          }`}>
            <Icon className="h-5 w-5" />
          </div>
          <div className={`text-xs px-2 py-0.5 rounded-full border ${
            status === "ok"
              ? "border-emerald-500/30 text-emerald-400 bg-emerald-500/5"
              : "border-primary/30 text-primary bg-primary/5"
          }`}>
            {delta}
          </div>
        </div>
        <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground mb-1">
          {label}
        </div>
        <div className="text-3xl font-display font-semibold mb-1">{value}</div>
        <div className="text-xs text-muted-foreground mb-4">{sub}</div>
        <Progress value={progress} className="h-1.5 bg-secondary [&>*]:bg-[image:var(--gradient-primary)]" />
      </div>
    </div>
  );
}
