import React, { useState } from "react";
import { Outlet, NavLink, useNavigate, Navigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import Logo from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { LayoutDashboard, MessageSquareQuote, FolderOpen, LayoutGrid, BarChart3, Settings as SettingsIcon, Menu, X, LogOut, Sun, Moon, Plus } from "lucide-react";
import { mediaUrl } from "@/lib/api";

const NAV = [
  { to: "/dashboard", label: "Overview", icon: LayoutDashboard, end: true },
  { to: "/dashboard/testimonials", label: "Testimonials", icon: MessageSquareQuote },
  { to: "/dashboard/collections", label: "Collection Pages", icon: FolderOpen },
  { to: "/dashboard/widgets", label: "Widgets", icon: LayoutGrid },
  { to: "/dashboard/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/dashboard/settings", label: "Settings", icon: SettingsIcon },
];

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const { theme, toggle } = useTheme();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const handleLogout = async () => { await logout(); navigate("/login"); };

  if (user && user.onboarded === false) return <Navigate to="/onboarding" replace />;

  const SidebarContent = () => (
    <>
      <div className="px-5 h-16 flex items-center border-b border-border"><Logo to="/dashboard" /></div>
      <nav className="flex-1 p-3 space-y-1">
        {NAV.map((n) => (
          <NavLink key={n.to} to={n.to} end={n.end} onClick={() => setOpen(false)} data-testid={`nav-${n.label.toLowerCase().replace(/ /g, "-")}`}
            className={({ isActive }) => `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${isActive ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"}`}>
            <n.icon size={18} /> {n.label}
          </NavLink>
        ))}
      </nav>
      <div className="p-3 border-t border-border">
        <Button variant="secondary" className="w-full justify-start gap-2 h-9 text-sm" onClick={toggle} data-testid="theme-toggle">
          {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />} {theme === "dark" ? "Light mode" : "Dark mode"}
        </Button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-background flex">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-64 flex-col border-r border-border fixed inset-y-0">
        <SidebarContent />
      </aside>

      {/* Mobile drawer */}
      {open && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
          <aside className="relative w-64 bg-background flex flex-col border-r border-border"><SidebarContent /></aside>
        </div>
      )}

      <div className="flex-1 lg:ml-64 flex flex-col min-w-0">
        <header className="h-16 border-b border-border flex items-center justify-between px-4 sm:px-6 sticky top-0 bg-background/80 backdrop-blur z-40">
          <button className="lg:hidden" onClick={() => setOpen(true)} data-testid="mobile-nav-btn"><Menu size={22} /></button>
          <div className="hidden lg:block" />
          <div className="flex items-center gap-3">
            <Button size="sm" className="gap-1.5 hidden sm:flex" onClick={() => navigate("/dashboard/collections")} data-testid="collect-cta">
              <Plus size={16} /> Collect a testimonial
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2" data-testid="user-menu">
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={mediaUrl(user?.avatar)} />
                    <AvatarFallback className="text-xs bg-primary text-primary-foreground">{user?.name?.[0]?.toUpperCase()}</AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <div className="px-2 py-1.5"><div className="text-sm font-medium truncate">{user?.name}</div><div className="text-xs text-muted-foreground truncate">{user?.email}</div></div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate("/dashboard/settings")}><SettingsIcon size={15} className="mr-2" /> Settings</DropdownMenuItem>
                <DropdownMenuItem onClick={handleLogout} data-testid="logout-btn"><LogOut size={15} className="mr-2" /> Log out</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto"><Outlet /></main>
      </div>
    </div>
  );
}
