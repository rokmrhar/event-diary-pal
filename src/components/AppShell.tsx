import { ReactNode, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import * as Icons from "lucide-react";
import {
  Menu,
  Home,
  Settings,
  Info,
  Power,
  UserCircle2,
  Clock,
  Circle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useNavItems } from "@/hooks/useNavItems";
import { useModulePermissions } from "@/hooks/useModulePermissions";

interface AppShellProps {
  children: ReactNode;
}

function getIcon(name: string | null) {
  if (!name) return Circle;
  const lib = Icons as unknown as Record<string, Icons.LucideIcon>;
  return lib[name] ?? Circle;
}

export default function AppShell({ children }: AppShellProps) {
  const { user, isAdmin, signOut } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [now, setNow] = useState(() => new Date());
  const { items: navItems } = useNavItems();
  const { canView, loading: permsLoading } = useModulePermissions();

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const dd = String(now.getDate()).padStart(2, "0");
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const yyyy = now.getFullYear();
  const dateStr = `${dd}.${mm}.${yyyy}`;
  const hh = String(now.getHours()).padStart(2, "0");
  const mi = String(now.getMinutes()).padStart(2, "0");
  const ss = String(now.getSeconds()).padStart(2, "0");
  const timeStr = `${hh}:${mi}:${ss}`;

  const visibleItems = navItems.filter((it) => {
    if (!it.visible) return false;
    if (it.kind === "separator") return true;
    if (it.module_key && !permsLoading && !canView(it.module_key)) return false;
    return true;
  });

  return (
    <div className="h-screen flex bg-background overflow-hidden">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-brand-navy text-brand-navy-foreground flex flex-col transition-transform duration-200 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {/* Sidebar top: hamburger + home + quick icons */}
        <div className="flex items-center gap-2 px-3 py-3 border-b border-white/10">
          <button
            onClick={() => setSidebarOpen(false)}
            className="p-2 rounded hover:bg-white/10"
            aria-label="Zapri meni"
          >
            <Menu className="h-5 w-5" />
          </button>
          <Link to="/" className="p-2 rounded hover:bg-white/10" aria-label="Domov">
            <Home className="h-5 w-5" />
          </Link>
          <div className="flex items-center gap-1 ml-1">
            <a href="https://web.emergencyassist.net" target="_blank" rel="noopener noreferrer" aria-label="ASK Sistem" title="ASK Sistem" className="h-10 w-10 rounded-full bg-white flex items-center justify-center overflow-hidden transition-all duration-200 hover:bg-white/90 hover:scale-110 hover:shadow-md active:scale-95">
              <img src="/ask.png" alt="ASK" className="h-full w-full object-cover" />
            </a>
            <a href="https://apl.gasilec.net/vulkan/login" target="_blank" rel="noopener noreferrer" aria-label="Vulkan" title="Vulkan" className="h-10 w-10 rounded-full bg-white flex items-center justify-center overflow-hidden transition-all duration-200 hover:bg-white/90 hover:scale-110 hover:shadow-md active:scale-95">
              <img src="/vulkan.png" alt="Vulkan" className="h-full w-full object-cover" />
            </a>
            <a href="https://spin3.sos112.si/login" target="_blank" rel="noopener noreferrer" aria-label="SPIN" title="spin" className="h-10 w-10 rounded-full bg-white flex items-center justify-center overflow-hidden transition-all duration-200 hover:bg-white/90 hover:scale-110 hover:shadow-md active:scale-95">
              <img src="/spin.png" alt="spin" className="h-full w-full object-cover" />
            </a>
          </div>
        </div>

        {/* Logo placeholder */}
        <div className="flex items-center justify-center py-6 border-b border-white/10">
          <div className="h-36 w-36 rounded-full bg-brand-red flex items-center justify-center shadow-md overflow-hidden">
          <img src="/operativa_logo_vektor.png" alt="Logo" className="h-full w-full object-cover" />
          </div>
        </div>

        {/* Title */}
        <div className="px-4 pt-5 pb-3 flex justify-center">
          <h2 className="text-sm font-bold tracking-wide text-center"> PGD ŠEMPETER PRI GORICI </h2>
        </div>

        {/* Nav items (loaded from DB, editable in admin) */}
        <nav className="flex-1 overflow-y-auto px-2 py-1 space-y-0.5 text-[11px] font-semibold">
          {visibleItems.map((item) => {
            if (item.kind === "separator") {
              return (
                <div
                  key={item.id}
                  className="px-2 py-2 mt-1 flex items-center gap-2 text-xs uppercase text-white/50"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-white/40" />
                  {item.label}
                </div>
              );
            }
            const Icon = getIcon(item.icon);
            const cls =
              "w-full flex items-center gap-3 px-3 py-2 rounded hover:bg-white/10 text-left tracking-wide";
            const inner = (
              <>
                <Icon className="h-4 w-4 text-brand-red shrink-0" />
                <span className="truncate">{item.label}</span>
              </>
            );
            if (!item.url) {
              return (
                <button key={item.id} className={cls}>
                  {inner}
                </button>
              );
            }
            if (item.external) {
              return (
                <a
                  key={item.id}
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cls}
                  onClick={() => setSidebarOpen(false)}
                >
                  {inner}
                </a>
              );
            }
            return (
              <Link
                key={item.id}
                to={item.url}
                className={cls}
                onClick={() => setSidebarOpen(false)}
              >
                {inner}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="px-4 py-3 text-[10px] text-white/40 border-t border-white/10 italic">
          Izdelava: Rok Mrhar, 2026
        </div>
      </aside>

      {/* Backdrop for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main column */}
      <div className="flex-1 flex flex-col min-w-0 lg:ml-64 h-screen overflow-hidden">
        {/* Top bar */}
       <header className="sticky top-0 bg-brand-navy text-brand-navy-foreground border-b border-white/10 z-20 shrink-0">
          <div className="flex items-center justify-between gap-3 px-3 sm:px-6 py-3">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 rounded hover:bg-white/10"
                aria-label="Odpri meni"
              >
                <Menu className="h-5 w-5" />
              </button>
              <div className="hidden sm:flex items-center gap-2 bg-white/10 rounded-full px-4 py-1.5 text-sm">
                <Clock className="h-4 w-4 text-white/70" />
                <span className="font-medium tabular-nums">{dateStr}</span>
                <span className="text-white/40">•</span>
                <span className="font-medium tabular-nums">{timeStr}</span>
              </div>
            </div>

            <div className="flex items-center gap-1 sm:gap-2">
              <div className="hidden sm:flex items-center gap-2 bg-white/10 rounded-full pl-3 pr-4 py-1.5 text-sm">
                <UserCircle2 className="h-5 w-5 text-brand-red" />
                <span className="font-medium">
                  {user?.email?.split("@")[0] ?? "Gost"}
                  {isAdmin && " - Admin"}
                </span>
              </div>
              {isAdmin && (
                <Button asChild size="icon" variant="ghost" className="text-brand-navy-foreground hover:bg-white/10 hover:text-brand-navy-foreground" title="Admin">
                  <Link to="/admin"><Settings className="h-4 w-4" /></Link>
                </Button>
              )}
              <IconBtn label="Info"><Info className="h-4 w-4" /></IconBtn>
              {user ? (
                <button
                  onClick={signOut}
                  className="p-2 rounded hover:bg-white/10"
                  aria-label="Odjava"
                >
                  <Power className="h-4 w-4" />
                </button>
              ) : (
                <Button asChild size="sm" className="bg-brand-red hover:bg-brand-red/90 text-brand-red-foreground">
                  <Link to="/auth">Prijava</Link>
                </Button>
              )}
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}

function IconBtn({ children, label }: { children: ReactNode; label: string }) {
  return (
    <button
      className="p-2 rounded hover:bg-white/10 text-brand-navy-foreground"
      aria-label={label}
      title={label}
    >
      {children}
    </button>
  );
}
