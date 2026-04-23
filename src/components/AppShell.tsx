import { ReactNode, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Menu,
  Home,
  AlertCircle,
  ClipboardList,
  Archive,
  Truck,
  Wrench,
  PencilLine,
  Stethoscope,
  Flame,
  ShieldCheck,
  BarChart3,
  Biohazard,
  Bell,
  MessageSquare,
  Moon,
  Settings,
  Info,
  Power,
  UserCircle2,
  Clock,
  LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

interface AppShellProps {
  children: ReactNode;
}

type SidebarItem = { icon: LucideIcon; label: string; to?: string };

const sidebarItems: SidebarItem[] = [
  { icon: AlertCircle, label: "DOGODEK VEČJEGA OBSEGA" },
  { icon: ClipboardList, label: "POROČILO O INTERVENCIJI", to: "/intervencija" },
  { icon: Archive, label: "ARHIV INTERVENCIJ", to: "/arhiv-intervencij" },
  { icon: Truck, label: "POTNI NALOG" },
  { icon: Wrench, label: "PREGLED SERVISOV" },
  { icon: PencilLine, label: "VNOS AKTIVNOSTI", to: "/aktivnost" },
  { icon: Stethoscope, label: "ZDRAVNIŠKI PREGLEDI" },
  { icon: Flame, label: "POŽARNE STRAŽE" },
  { icon: ShieldCheck, label: "EVIDENCA IDA" },
  { icon: BarChart3, label: "STATISTIKA" },
  { icon: Biohazard, label: "EVIDENCA PRALNI STROJ" },
];

export default function AppShell({ children }: AppShellProps) {
  const { user, isAdmin, signOut } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const dateStr = now.toLocaleDateString("sl-SI");
  const timeStr = now.toLocaleTimeString("sl-SI", { hour: "2-digit", minute: "2-digit", second: "2-digit" });

  return (
    <div className="min-h-screen flex bg-background">
      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-40 w-64 bg-brand-navy text-brand-navy-foreground flex flex-col transition-transform duration-200 ${
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
            <a href="https://web.emergencyassist.net" target="_blank" rel="noopener noreferrer" aria-label="ASK Sistem" title="ASK Sistem" className="h-8 w-8 rounded-full bg-white/10 flex items-center justify-center overflow-hidden transition-all duration-200 hover:bg-white/20 hover:scale-110 hover:shadow-md active:scale-95">
              <img src="/ask.png" alt="ASK" className="h-full w-full object-cover p-1" />
            </a>
            <a href="https://apl.gasilec.net/vulkan/login" target="_blank" rel="noopener noreferrer" aria-label="Vulkan" title="Vulkan" className="h-8 w-8 rounded-full bg-white/10 flex items-center justify-center overflow-hidden transition-all duration-200 hover:bg-white/20 hover:scale-110 hover:shadow-md active:scale-95">
              <img src="/vulkan.png" alt="Vulkan" className="h-full w-full object-cover p-1" />
            </a>
            <a href="https://spin3.sos112.si/login" target="_blank" rel="noopener noreferrer" aria-label="SPIN" title="spin" className="h-8 w-8 rounded-full bg-white/10 flex items-center justify-center overflow-hidden transition-all duration-200 hover:bg-white/20 hover:scale-110 hover:shadow-md active:scale-95">
              <img src="/spin.png" alt="spin" className="h-full w-full object-cover p-1" />
            </a>
          </div>
        </div>

        {/* Logo placeholder */}
        <div className="flex items-center justify-center py-6 border-b border-white/10">
          <div className="h-16 w-16 rounded-full bg-brand-red flex items-center justify-center shadow-md overflow-hidden">
          <img src="/operativa_logo_vektor.png" alt="Logo" className="h-full w-full object-cover" />
          </div>
        </div>

        {/* Title */}
        <div className="px-4 pt-5 pb-3">
          <h2 className="text-sm font-bold tracking-wide">PGD ŠEMPETER PRI GORICI</h2>
        </div>

        {/* Section label */}
        <div className="px-4 py-2 flex items-center gap-2 text-xs uppercase text-white/50">
          <span className="h-1.5 w-1.5 rounded-full bg-white/40" />
          Operativa
        </div>

        {/* Nav items */}
        <nav className="flex-1 overflow-y-auto px-2 py-1 space-y-0.5 text-[11px] font-semibold">
          {sidebarItems.map((item) => {
            const inner = (
              <>
                <item.icon className="h-4 w-4 text-brand-red shrink-0" />
                <span className="truncate">{item.label}</span>
              </>
            );
            const cls =
              "w-full flex items-center gap-3 px-3 py-2 rounded hover:bg-white/10 text-left tracking-wide";
            return item.to ? (
              <Link key={item.label} to={item.to} className={cls} onClick={() => setSidebarOpen(false)}>
                {inner}
              </Link>
            ) : (
              <button key={item.label} className={cls}>
                {inner}
              </button>
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
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="bg-brand-navy text-brand-navy-foreground border-b border-white/10 sticky top-0 z-20">
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
              <IconBtn label="Obvestila"><Bell className="h-4 w-4" /></IconBtn>
              <IconBtn label="Sporočila"><MessageSquare className="h-4 w-4" /></IconBtn>
              <IconBtn label="Tema"><Moon className="h-4 w-4" /></IconBtn>
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
        <div className="flex-1">{children}</div>
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
