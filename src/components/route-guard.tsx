import React from "react";
import { Link } from "@tanstack/react-router";
import { ShieldAlert, ArrowLeft, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { UserRole } from "@/hooks/use-auth";

interface RouteGuardProps {
  allowedRoles: UserRole[];
  currentRole: UserRole;
  children: React.ReactNode;
}

export function RouteGuard({ allowedRoles, currentRole, children }: RouteGuardProps) {
  if (!allowedRoles.includes(currentRole)) {
    const dashboardLink = currentRole === "client" ? "/client" : "/";
    const dashboardLabel = currentRole === "client" ? "Client Analytics" : "User Workspace";

    return (
      <div className="min-h-[75vh] w-full flex items-center justify-center p-4 lg:p-10 animate-fade-in">
        {/* Card wrapper */}
        <div className="w-full max-w-md bg-card/50 backdrop-blur-md border border-destructive/25 rounded-2xl p-8 shadow-[var(--shadow-elegant)] relative overflow-hidden transition-all duration-300 hover:border-destructive/40 text-center">
          
          {/* Subtle neon gradient background sphere */}
          <div className="absolute -top-12 -right-12 h-36 w-36 rounded-full bg-destructive/8 blur-3xl pointer-events-none" />

          {/* Icon */}
          <div className="h-14 w-14 rounded-full bg-destructive/10 border border-destructive/20 flex items-center justify-center mx-auto mb-5 text-destructive relative shadow-[inset_0_0_12px_rgba(239,68,68,0.1)]">
            <ShieldAlert className="h-7 w-7 animate-pulse" />
          </div>

          {/* Header */}
          <h2 className="text-2xl font-display font-bold tracking-tight text-foreground">
            Access Restricted
          </h2>
          <p className="mt-1 text-[10px] uppercase tracking-[0.2em] text-rose-400 font-semibold font-mono flex items-center justify-center gap-1.5">
            <Lock className="h-3 w-3" /> Security Guardrail
          </p>

          {/* Body content */}
          <p className="mt-4 text-muted-foreground text-sm leading-relaxed max-w-sm mx-auto">
            Your current platform authorization level (<span className="font-mono font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded border border-primary/20">{currentRole}</span>) is insufficient to access this secure zone.
          </p>

          {/* Action button */}
          <div className="mt-8">
            <Button
              asChild
              variant="outline"
              className="w-full border-border/80 hover:bg-accent text-sm rounded-xl h-11 transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <Link to={dashboardLink}>
                <ArrowLeft className="h-4 w-4" />
                Return to {dashboardLabel}
              </Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
