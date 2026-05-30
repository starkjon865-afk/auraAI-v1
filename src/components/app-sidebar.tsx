import { Link, useRouterState } from "@tanstack/react-router";
import { User, BarChart3, ShieldCheck, Sparkles, LogOut } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { useAuth } from "@/hooks/use-auth";

const items = [
  { title: "User Workspace", url: "/", icon: User },
  { title: "Client Analytics", url: "/client", icon: BarChart3 },
  { title: "Admin Console", url: "/admin", icon: ShieldCheck },
];

export function AppSidebar() {
  const currentPath = useRouterState({ select: (s) => s.location.pathname });
  const { userRole, logout } = useAuth();

  // Dynamically map active user profile info based on the authenticated userRole
  const name =
    userRole === "admin"
      ? "Muhammad Salman Azam"
      : userRole === "client"
        ? "GrowTech Solutions Recruiter"
        : userRole === "user"
          ? "Ayesha Ahmed (Applicant)"
          : "Guest User";

  const email =
    userRole === "admin"
      ? "salman@umt.edu.pk"
      : userRole === "client"
        ? "hr@growtech.pk"
        : userRole === "user"
          ? "ayesha.design@gmail.com"
          : "guest@parityai.io";

  const initials =
    userRole === "admin"
      ? "SA"
      : userRole === "client"
        ? "GT"
        : userRole === "user"
          ? "AA"
          : "GU";

  // Filter workspace tabs based on active role
  const filteredItems = items.filter((item) => {
    if (userRole === "user") {
      return item.url === "/";
    }
    if (userRole === "client") {
      return item.url === "/client";
    }
    // Admin can see and access all zones
    return true;
  });

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center gap-2.5 px-2 py-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[image:var(--gradient-primary)] shadow-[var(--shadow-glow)]">
            <Sparkles className="h-4.5 w-4.5 text-primary-foreground" strokeWidth={2.5} />
          </div>
          <div className="flex flex-col group-data-[collapsible=icon]:hidden">
            <span className="font-display text-base font-semibold tracking-tight">Parity AI</span>
            <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              Equity Platform
            </span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground/70">
            Workspace
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {filteredItems.map((item) => {
                const active = currentPath === item.url;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={active}
                      tooltip={item.title}
                      className="data-[active=true]:bg-accent data-[active=true]:text-primary data-[active=true]:shadow-[inset_2px_0_0_0_var(--primary)]"
                    >
                      <Link to={item.url} className="flex items-center gap-3">
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border gap-2 p-2">
        <div className="flex items-center gap-2.5 px-2 py-2">
          <div className="h-8 w-8 rounded-full bg-accent border border-border flex items-center justify-center text-xs font-semibold text-primary shrink-0 shadow-[inset_0_0_8px_rgba(255,255,255,0.05)]">
            {initials}
          </div>
          <div className="flex flex-col group-data-[collapsible=icon]:hidden min-w-0">
            <span className="text-xs font-medium truncate">{name}</span>
            <span className="text-[10px] text-muted-foreground truncate">{email}</span>
          </div>
        </div>
        
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-3 py-2 text-xs font-semibold rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 active:bg-rose-500/15 border border-transparent hover:border-rose-500/15 transition cursor-pointer"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          <span className="group-data-[collapsible=icon]:hidden">Logout Session</span>
        </button>
      </SidebarFooter>
    </Sidebar>
  );
}

