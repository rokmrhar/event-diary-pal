import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import AppShell from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  CalendarDays,
  MapPin,
  Clock,
  Activity,
  Users,
  TrendingUp,
  Plus,
  ArrowRight,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";

type ActivityRow = {
  id: string;
  datum: string;
  aktivnost: string;
  aktivnost_drugo: string | null;
  zacetek: string;
  konec: string;
  kraj: string;
  opis: string;
};

type AttendeeRow = { activity_id: string; person_name: string };

const ACTIVITY_COLORS: Record<string, string> = {
  VAJE: "bg-blue-500",
  "DELOVNI PONEDELJEK": "bg-emerald-500",
  "DELOVNI DAN": "bg-amber-500",
  DRUGO: "bg-purple-500",
};

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("sl-SI", { day: "2-digit", month: "2-digit", year: "numeric" });
const formatTime = (t: string) => (t ? t.slice(0, 5) : "");
const labelFor = (a: ActivityRow) =>
  a.aktivnost === "DRUGO" && a.aktivnost_drugo ? a.aktivnost_drugo : a.aktivnost;

export default function Dashboard() {
  const { user } = useAuth();
  const [activities, setActivities] = useState<ActivityRow[]>([]);
  const [attendees, setAttendees] = useState<AttendeeRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [actRes, attRes] = await Promise.all([
        supabase
          .from("activities")
          .select("id, datum, aktivnost, aktivnost_drugo, zacetek, konec, kraj, opis")
          .order("datum", { ascending: false })
          .order("zacetek", { ascending: false })
          .limit(50),
        supabase.from("activity_attendees").select("activity_id, person_name"),
      ]);
      if (actRes.error) toast({ title: "Napaka", description: actRes.error.message, variant: "destructive" });
      setActivities((actRes.data as ActivityRow[]) ?? []);
      setAttendees((attRes.data as AttendeeRow[]) ?? []);
      setLoading(false);
    })();
  }, [user]);

  const stats = useMemo(() => {
    const total = activities.length;
    const counts: Record<string, number> = {};
    activities.forEach((a) => {
      counts[a.aktivnost] = (counts[a.aktivnost] ?? 0) + 1;
    });
    const now = new Date();
    const monthAgo = new Date(now);
    monthAgo.setDate(now.getDate() - 30);
    const last30 = activities.filter((a) => new Date(a.datum) >= monthAgo).length;
    const uniqueAttendees = new Set(attendees.map((a) => a.person_name)).size;
    return { total, counts, last30, uniqueAttendees };
  }, [activities, attendees]);

  const recent = activities.slice(0, 8);
  const attendeesByActivity = useMemo(() => {
    const map: Record<string, string[]> = {};
    attendees.forEach((a) => {
      (map[a.activity_id] ??= []).push(a.person_name);
    });
    return map;
  }, [attendees]);

  return (
    <AppShell>
      <div className="max-w-7xl mx-auto p-3 sm:p-6 lg:p-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight uppercase">Pregled</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Dobrodošel{user?.email ? `, ${user.email.split("@")[0]}` : ""}.
            </p>
          </div>
          <Button asChild className="bg-brand-red hover:bg-brand-red/90 text-brand-red-foreground">
            <Link to="/aktivnost">
              <Plus className="h-4 w-4 mr-1" /> Nov vnos
            </Link>
          </Button>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <StatCard
            icon={<Activity className="h-5 w-5" />}
            label="Vse aktivnosti"
            value={stats.total}
            accent="bg-brand-red"
          />
          <StatCard
            icon={<TrendingUp className="h-5 w-5" />}
            label="Zadnjih 30 dni"
            value={stats.last30}
            accent="bg-blue-500"
          />
          <StatCard
            icon={<Users className="h-5 w-5" />}
            label="Različni prisotni"
            value={stats.uniqueAttendees}
            accent="bg-emerald-500"
          />
          <StatCard
            icon={<CalendarDays className="h-5 w-5" />}
            label="Tipov aktivnosti"
            value={Object.keys(stats.counts).length}
            accent="bg-amber-500"
          />
        </div>

        {/* Counts per type */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Aktivnosti po tipu</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {Object.keys(stats.counts).length === 0 && (
                <p className="text-sm text-muted-foreground">Ni podatkov.</p>
              )}
              {Object.entries(stats.counts).map(([type, count]) => (
                <Badge
                  key={type}
                  className={`${ACTIVITY_COLORS[type] ?? "bg-muted-foreground"} text-white border-0 px-3 py-1.5 text-sm`}
                >
                  {type} • {count}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent activities */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base">Zadnje aktivnosti</CardTitle>
            <Button asChild variant="ghost" size="sm">
              <Link to="/aktivnost">
                Vsi vnosi <ArrowRight className="h-3 w-3 ml-1" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-sm text-muted-foreground">Nalagam...</p>
            ) : recent.length === 0 ? (
              <div className="text-center py-8">
                <Activity className="h-10 w-10 mx-auto text-muted-foreground/40 mb-2" />
                <p className="text-sm text-muted-foreground">Še ni vnosov.</p>
                <Button asChild className="mt-4 bg-brand-red hover:bg-brand-red/90 text-brand-red-foreground">
                  <Link to="/aktivnost">
                    <Plus className="h-4 w-4 mr-1" /> Dodaj prvi vnos
                  </Link>
                </Button>
              </div>
            ) : (
              <ul className="divide-y divide-border">
                {recent.map((a) => {
                  const color = ACTIVITY_COLORS[a.aktivnost] ?? "bg-muted-foreground";
                  const att = attendeesByActivity[a.id] ?? [];
                  return (
                    <li key={a.id} className="py-3 flex items-start gap-3">
                      <div className={`${color} h-10 w-1 rounded-full shrink-0 mt-1`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <span className="font-semibold text-sm uppercase tracking-wide truncate">
                            {labelFor(a)}
                          </span>
                          <Badge variant="outline" className="text-xs">
                            {att.length} prisotnih
                          </Badge>
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <CalendarDays className="h-3.5 w-3.5" /> {formatDate(a.datum)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5" /> {formatTime(a.zacetek)}–{formatTime(a.konec)}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3.5 w-3.5" /> {a.kraj}
                          </span>
                        </div>
                        {a.opis && (
                          <p className="mt-1 text-sm text-foreground/80 line-clamp-2">{a.opis}</p>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}

function StatCard({
  icon,
  label,
  value,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  accent: string;
}) {
  return (
    <Card>
      <CardContent className="p-4 flex items-center gap-3">
        <div className={`${accent} text-white h-10 w-10 rounded-lg flex items-center justify-center shrink-0`}>
          {icon}
        </div>
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground uppercase tracking-wide truncate">{label}</p>
          <p className="text-2xl font-bold leading-tight">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}