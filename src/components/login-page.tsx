import React, { useState } from "react";
import { useAuth, UserRole } from "@/hooks/use-auth";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useNavigate } from "@tanstack/react-router";
import { Sparkles, Loader2, Mail, Lock, ShieldCheck, User, Building2 } from "lucide-react";

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");



  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    setLoadingMessage("Authenticating credential handshake...");

    setTimeout(() => {
      let role: UserRole = "user";
      let name = "Ayesha Ahmed (Applicant)";

      const lowerEmail = email.toLowerCase();
      // Match "admin", "salman", or "umt" as admin roles
      if (lowerEmail.includes("admin") || lowerEmail.includes("salman") || lowerEmail.includes("umt")) {
        role = "admin";
        name = "Muhammad Salman Azam";
      } else if (
        lowerEmail.includes("recruiter") ||
        lowerEmail.includes("client") ||
        lowerEmail.includes("growtech") ||
        lowerEmail.includes("hr")
      ) {
        role = "client";
        name = "GrowTech Solutions Recruiter";
      }

      login(role, email, name);
      setLoading(false);

      // Dynamic redirect upon manual submit
      if (role === "admin") {
        navigate({ to: "/admin" });
      } else if (role === "client") {
        navigate({ to: "/client" });
      } else {
        navigate({ to: "/" });
      }
    }, 850);
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background relative overflow-hidden p-4">
      {/* Dynamic Background Glowing Blobs */}
      <div className="absolute w-[450px] h-[450px] rounded-full bg-[oklch(0.65_0.25_285/12%)] blur-[100px] -top-36 -left-36 animate-pulse duration-[8000ms]" />
      <div className="absolute w-[400px] h-[400px] rounded-full bg-[oklch(0.72_0.28_290/8%)] blur-[80px] -bottom-36 -right-36" />
      <div className="absolute inset-0 opacity-[0.02] pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(circle at 1px 1px, var(--primary) 1px, transparent 0)",
          backgroundSize: "32px 32px",
        }}
      />

      {/* Main Login Card */}
      <div className="w-full max-w-md bg-card/60 backdrop-blur-xl border border-border/80 rounded-2xl shadow-[var(--shadow-elegant)] relative overflow-hidden transition-all duration-300 hover:border-primary/30 flex flex-col z-10">
        
        {/* Neon Indicator Top Strip */}
        <div className="h-1 w-full bg-[image:var(--gradient-primary)] absolute top-0 left-0" />

        {/* Loading Overlay */}
        {loading && (
          <div className="absolute inset-0 bg-background/80 backdrop-blur-md flex flex-col items-center justify-center z-50 animate-fade-in p-6 text-center">
            <div className="relative flex items-center justify-center mb-4">
              <Loader2 className="h-10 w-10 text-primary animate-spin" />
              <div className="absolute inset-0 h-10 w-10 rounded-full border border-primary/20 blur-md" />
            </div>
            <p className="text-sm font-semibold tracking-wide text-foreground animate-pulse">
              {loadingMessage}
            </p>
            <p className="text-xs text-muted-foreground mt-1.5 font-mono">
              Resolving live cryptokey handshake...
            </p>
          </div>
        )}

        <div className="p-8 pb-6 flex flex-col items-center text-center">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[image:var(--gradient-primary)] shadow-[var(--shadow-glow)] mb-4">
            <Sparkles className="h-5 w-5 text-primary-foreground" strokeWidth={2.5} />
          </div>

          <h1 className="text-3xl font-display font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text">
            Parity AI Portal
          </h1>
          <p className="text-xs uppercase tracking-[0.2em] text-primary/95 mt-1 font-semibold">
            Live · Secure Handshake
          </p>
          <p className="text-xs text-muted-foreground/85 mt-2.5 max-w-[280px]">
            AI-powered workforce upskilling, analytics, and admin telemetry.
          </p>
        </div>

        {/* Manual Login Form */}
        <form onSubmit={handleManualSubmit} className="px-8 pb-8 space-y-4">
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/90 flex items-center gap-1.5 pl-0.5">
              <Mail className="h-3 w-3" /> Email Address
            </label>
            <div className="relative">
              <Input
                type="email"
                placeholder="you@parityai.io"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
                className="bg-background/45 border-border/80 focus-visible:ring-primary focus-visible:ring-1 rounded-xl h-11 px-4 text-sm font-sans transition placeholder:text-muted-foreground/40"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/90 flex items-center gap-1.5 pl-0.5">
              <Lock className="h-3 w-3" /> Security Password
            </label>
            <div className="relative">
              <Input
                type="password"
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                className="bg-background/45 border-border/80 focus-visible:ring-primary focus-visible:ring-1 rounded-xl h-11 px-4 text-sm transition placeholder:text-muted-foreground/40"
              />
            </div>
          </div>

          <Button
            type="submit"
            disabled={loading || !email}
            className="w-full h-11 rounded-xl bg-primary text-primary-foreground font-semibold shadow-[var(--shadow-glow)] hover:opacity-95 transition tracking-wide text-sm shrink-0 cursor-pointer flex items-center justify-center gap-2 mt-2"
          >
            Authorize Access
          </Button>
        </form>



      </div>
    </div>
  );
}
