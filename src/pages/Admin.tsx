import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, LogOut } from "lucide-react";
import { ACTIVITY_TYPES, PEOPLE } from "@/lib/people";
import { toast } from "@/hooks/use-toast";

type Row = { person_name: string; aktivnost: string };

export default function Admin() {
  const { user, isAdmin, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const [rows, setRows] = useState<Row[]>([]);
  const [fetching, setFetching] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (loading) return;
    if (!user) {
      navigate("/auth", { replace: true });
      return;
    }
    if (!isAdmin) {
      toast({ title: "Dostop zavrnjen", description: "Stran je le za admine.", variant: "destructive" });
      navigate("/", { replace: true });
    }
  }, [user, isAdmin, loading, navigate]);

  useEffect(() => {
    if (!isAdmin) return;
    const load = async () => {
      setFetching(true);
      const { data, error } = await supabase
        .from("activity_attendees")
        .select("person_name, activities!inner(aktivnost)");
      if (error) {
        toast({ title: "Napaka", description: error.message, variant: "destructive" });
        setFetching(false);
        return;
      }
      const flat: Row[] = (data ?? []).map((r: any) => ({
        person_name: r.person_name,
        aktivnost: r.activities?.aktivnost ?? "DRUGO",
      }));
      setRows(flat);
      setFetching(false);
    };
    load();
  }, [isAdmin]);

  const stats = useMemo(() => {
    const map = new Map<string, Record<string, number> & { total: number }>();
    for (const p of PEOPLE) {
      map.set(p, { total: 0, ...Object.fromEntries(ACTIVITY_TYPES.map((t) => [t, 0])) } as any);
    }
    for (const r of rows) {
      if (!map.has(r.person_name)) {
        map.set(r.person_name, { total: 0, ...Object.fromEntries(ACTIVITY_TYPES.map((t) => [t, 0])) } as any);
      }
      const entry = map.get(r.person_name)!;
      const type = (ACTIVITY_TYPES as readonly string[]).includes(r.aktivnost) ? r.aktivnost : "DRUGO";
      entry[type] = (entry[type] ?? 0) + 1;
      entry.total += 1;
    }
    return Array.from(map.entries())
      .map(([name, counts]) => ({ name, counts }))
      .sort((a, b) => b.counts.total - a.counts.total || a.name.localeCompare(b.name));
  }, [rows]);

  const visible = stats.filter((s) => s.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <main className="min-h-screen bg-background p-4 text-foreground">
      <div className="max-w-5xl mx-auto space-y-4">
        <header className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="icon">
              <Link to="/" aria-label="Nazaj"><ArrowLeft className="h-4 w-4" /></Link>
            </Button>
            <h1 className="text-2xl font-bold tracking-tight">Admin — statistika</h1>
          </div>
          <Button variant="ghost" size="icon" onClick={signOut} aria-label="Odjava">
            <LogOut className="h-4 w-4" />
          </Button>
        </header>

        <div className="bg-card border border-border rounded-2xl shadow-sm p-4 space-y-4">
          <Input
            placeholder="Išči osebo..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-sm"
          />

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Oseba</TableHead>
                  {ACTIVITY_TYPES.map((t) => (
                    <TableHead key={t} className="text-center">{t}</TableHead>
                  ))}
                  <TableHead className="text-right">Skupaj</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {fetching ? (
                  <TableRow>
                    <TableCell colSpan={ACTIVITY_TYPES.length + 2} className="text-center text-muted-foreground py-8">
                      Nalagam...
                    </TableCell>
                  </TableRow>
                ) : visible.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={ACTIVITY_TYPES.length + 2} className="text-center text-muted-foreground py-8">
                      Ni rezultatov
                    </TableCell>
                  </TableRow>
                ) : (
                  visible.map(({ name, counts }) => (
                    <TableRow key={name}>
                      <TableCell className="font-medium">{name}</TableCell>
                      {ACTIVITY_TYPES.map((t) => (
                        <TableCell key={t} className="text-center tabular-nums">
                          {counts[t] ?? 0}
                        </TableCell>
                      ))}
                      <TableCell className="text-right font-semibold tabular-nums">
                        {counts.total}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </main>
  );
}