import { Link, useRouterState } from "@tanstack/react-router";
import { User, BarChart3, ShieldCheck, Sparkles } from "lucide-react";
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

const items = [
  { title: "User Workspace", url: "/", icon: User },
  { title: "Client Analytics", url: "/client", icon: BarChart3 },
  { title: "Admin Console", url: "/admin", icon: ShieldCheck },
];

export function AppSidebar() {
  const currentPath = useRouterState({ select: (s) => s.location.pathname });

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center gap-2.5 px-2 py-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[image:var(--gradient-primary)] shadow-[var(--shadow-glow)]">
            <Sparkles className="h-4.5 w-4.5 text-primary-foreground" strokeWidth={2.5} />
          </div>
          <div className="flex flex-col group-data-[collapsible=icon]:hidden">
            <span className="font-display text-base font-semibold tracking-tight">EquiTech</span>
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
              {items.map((item) => {
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

      <SidebarFooter className="border-t border-sidebar-border">
        <div className="flex items-center gap-2.5 px-2 py-2">
          <div className="h-8 w-8 rounded-full bg-accent border border-border flex items-center justify-center text-xs font-medium text-primary">
            JD
          </div>
          <div className="flex flex-col group-data-[collapsible=icon]:hidden">
            <span className="text-xs font-medium">Jordan Doe</span>
            <span className="text-[10px] text-muted-foreground">jordan@equitech.io</span>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
