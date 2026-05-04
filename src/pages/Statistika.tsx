import { useEffect, useMemo, useState } from "react";
import AppShell from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  CartesianGrid,
} from "recharts";
import { toast } from "@/hooks/use-toast";
import { BarChart3, Activity, AlertCircle, Users } from "lucide-react";
import PageHeader from "@/components/PageHeader";

type IntRow = { id: string; datum: string; skupina: string; obcina: string; vodja: string };
type ActRow = { id: string; datum: string; aktivnost: string };
type IntAtt = { intervention_id: string; person_name: string };
type ActAtt = { activity_id: string; person_name: string };

const COLORS = ["#dc2626", "#2563eb", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899", "#06b6d4"];

const monthKey = (iso: string) => iso.slice(0, 7); // YYYY-MM
const monthLabel = (k: string) => {
  const [y, m] = k.split("-");
  return `${m}/${y.slice(2)}`;
};

export default function Statistika() {
  const { user } = useAuth();
  const [interventions, setInterventions] = useState<IntRow[]>([]);
  const [activities, setActivities] = useState<ActRow[]>([]);
  const [intAtt, setIntAtt] = useState<IntAtt[]>([]);
  const [actAtt, setActAtt] = useState<ActAtt[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [iRes, aRes, iaRes, aaRes] = await Promise.all([
        supabase.from("interventions").select("id, datum, skupina, obcina, vodja").order("datum", { ascending: true }),
        supabase.from("activities").select("id, datum, aktivnost").order("datum", { ascending: true }),
        supabase.from("intervention_attendees").select("intervention_id, person_name"),
        supabase.from("activity_attendees").select("activity_id, person_name"),
      ]);
      if (iRes.error) toast({ title: "Napaka", description: iRes.error.message, variant: "destructive" });
      setInterventions((iRes.data as IntRow[]) ?? []);
      setActivities((aRes.data as ActRow[]) ?? []);
      setIntAtt((iaRes.data as IntAtt[]) ?? []);
      setActAtt((aaRes.data as ActAtt[]) ?? []);
      setLoading(false);
    })();
  }, [user]);

  // Interventions by month
  const intByMonth = useMemo(() => {
    const map: Record<string, number> = {};
    interventions.forEach((i) => {
      const k = monthKey(i.datum);
      map[k] = (map[k] ?? 0) + 1;
    });
    return Object.keys(map).sort().map((k) => ({ month: monthLabel(k), count: map[k] }));
  }, [interventions]);

  // Interventions by group
  const intBySkupina = useMemo(() => {
    const map: Record<string, number> = {};
    interventions.forEach((i) => {
      const k = i.skupina || "VSA";
      map[k] = (map[k] ?? 0) + 1;
    });
    return Object.entries(map).map(([name, value]) => ({ name: `Skupina ${name}`, value }));
  }, [interventions]);

  // Activities by month
  const actByMonth = useMemo(() => {
    const map: Record<string, number> = {};
    activities.forEach((a) => {
      const k = monthKey(a.datum);
      map[k] = (map[k] ?? 0) + 1;
    });
    return Object.keys(map).sort().map((k) => ({ month: monthLabel(k), count: map[k] }));
  }, [activities]);

  // Activities by type
  const actByType = useMemo(() => {
    const map: Record<string, number> = {};
    activities.forEach((a) => {
      map[a.aktivnost] = (map[a.aktivnost] ?? 0) + 1;
    });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [activities]);

  // Top members
  const topMembers = useMemo(() => {
    const map: Record<string, number> = {};
    intAtt.forEach((a) => { map[a.person_name] = (map[a.person_name] ?? 0) + 1; });
    actAtt.forEach((a) => { map[a.person_name] = (map[a.person_name] ?? 0) + 1; });
    return Object.entries(map)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);
  }, [intAtt, actAtt]);

  return (
    <AppShell>
      <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
        <PageHeader title="Statistika" icon={BarChart3} description="Pregled intervencij, aktivnosti in udeležbe članov." />

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <SmallStat icon={<AlertCircle className="h-5 w-5" />} label="Intervencije" value={interventions.length} accent="bg-brand-red" />
          <SmallStat icon={<Activity className="h-5 w-5" />} label="Aktivnosti" value={activities.length} accent="bg-blue-500" />
          <SmallStat icon={<Users className="h-5 w-5" />} label="Različni člani (int.)" value={new Set(intAtt.map((a) => a.person_name)).size} accent="bg-emerald-500" />
          <SmallStat icon={<Users className="h-5 w-5" />} label="Različni člani (akt.)" value={new Set(actAtt.map((a) => a.person_name)).size} accent="bg-amber-500" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Intervencije po mesecih</CardTitle></CardHeader>
            <CardContent>
              {loading ? <p className="text-sm text-muted-foreground">Nalagam...</p> : intByMonth.length === 0 ? <p className="text-sm text-muted-foreground">Ni podatkov.</p> : (
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={intByMonth}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#dc2626" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Intervencije po skupinah</CardTitle></CardHeader>
            <CardContent>
              {intBySkupina.length === 0 ? <p className="text-sm text-muted-foreground">Ni podatkov.</p> : (
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie data={intBySkupina} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label>
                      {intBySkupina.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Aktivnosti po mesecih</CardTitle></CardHeader>
            <CardContent>
              {actByMonth.length === 0 ? <p className="text-sm text-muted-foreground">Ni podatkov.</p> : (
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={actByMonth}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#2563eb" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Aktivnosti po tipih</CardTitle></CardHeader>
            <CardContent>
              {actByType.length === 0 ? <p className="text-sm text-muted-foreground">Ni podatkov.</p> : (
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie data={actByType} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label>
                      {actByType.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader><CardTitle className="text-base">Najbolj aktivni člani (top 10)</CardTitle></CardHeader>
            <CardContent>
              {topMembers.length === 0 ? <p className="text-sm text-muted-foreground">Ni podatkov.</p> : (
                <ResponsiveContainer width="100%" height={Math.max(260, topMembers.length * 32)}>
                  <BarChart data={topMembers} layout="vertical" margin={{ left: 24 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12 }} />
                    <YAxis type="category" dataKey="name" width={160} tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="value" fill="#10b981" radius={[0, 6, 6, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}

function SmallStat({ icon, label, value, accent }: { icon: React.ReactNode; label: string; value: number; accent: string }) {
  return (
    <Card>
      <CardContent className="p-4 flex items-center gap-3">
        <div className={`${accent} text-white h-10 w-10 rounded-lg flex items-center justify-center shrink-0`}>{icon}</div>
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground uppercase tracking-wide truncate">{label}</p>
          <p className="text-2xl font-bold leading-tight">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}