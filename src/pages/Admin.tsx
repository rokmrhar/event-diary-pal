import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ArrowLeft, LogOut, Calendar, Clock, MapPin, FileText, UserPlus, Trash2 } from "lucide-react";
import { ACTIVITY_TYPES } from "@/lib/people";
import { useMembers } from "@/hooks/useMembers";
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
type AttendeeRow = { person_name: string; activity_id: string };

export default function Admin() {
  const { user, isAdmin, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const { members, refresh: refreshMembers } = useMembers();
  const [activities, setActivities] = useState<ActivityRow[]>([]);
  const [attendees, setAttendees] = useState<AttendeeRow[]>([]);
  const [fetching, setFetching] = useState(true);
  const [search, setSearch] = useState("");
  const [newMember, setNewMember] = useState("");
  const [addingMember, setAddingMember] = useState(false);

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
      const [act, att] = await Promise.all([
        supabase
          .from("activities")
          .select("id, datum, aktivnost, aktivnost_drugo, zacetek, konec, kraj, opis")
          .order("datum", { ascending: false }),
        supabase.from("activity_attendees").select("person_name, activity_id"),
      ]);
      if (act.error || att.error) {
        toast({
          title: "Napaka",
          description: act.error?.message ?? att.error?.message ?? "",
          variant: "destructive",
        });
        setFetching(false);
        return;
      }
      setActivities((act.data ?? []) as ActivityRow[]);
      setAttendees((att.data ?? []) as AttendeeRow[]);
      setFetching(false);
    };
    load();
  }, [isAdmin]);

  const activitiesById = useMemo(() => {
    const m = new Map<string, ActivityRow>();
    activities.forEach((a) => m.set(a.id, a));
    return m;
  }, [activities]);

  // person -> ActivityRow[]
  const perPerson = useMemo(() => {
    const m = new Map<string, ActivityRow[]>();
    members.forEach((p) => m.set(p.name, []));
    for (const at of attendees) {
      const a = activitiesById.get(at.activity_id);
      if (!a) continue;
      if (!m.has(at.person_name)) m.set(at.person_name, []);
      m.get(at.person_name)!.push(a);
    }
    // sort each person's activities by date desc
    m.forEach((arr) => arr.sort((x, y) => y.datum.localeCompare(x.datum)));
    return m;
  }, [attendees, activitiesById, members]);

  const stats = useMemo(() => {
    return Array.from(perPerson.entries())
      .map(([name, list]) => {
        const counts: Record<string, number> & { total: number } = {
          total: list.length,
          ...(Object.fromEntries(ACTIVITY_TYPES.map((t) => [t, 0])) as Record<string, number>),
        };
        for (const a of list) {
          const t = (ACTIVITY_TYPES as readonly string[]).includes(a.aktivnost) ? a.aktivnost : "DRUGO";
          counts[t] = (counts[t] ?? 0) + 1;
        }
        return { name, list, counts };
      })
      .sort((a, b) => b.counts.total - a.counts.total || a.name.localeCompare(b.name));
  }, [perPerson]);

  const visible = stats.filter((s) => s.name.toLowerCase().includes(search.toLowerCase()));

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = newMember.trim();
    if (!name) return;
    setAddingMember(true);
    const { error } = await supabase.from("members").insert({ name });
    setAddingMember(false);
    if (error) {
      toast({
        title: "Napaka",
        description: error.code === "23505" ? "Član s tem imenom že obstaja." : error.message,
        variant: "destructive",
      });
      return;
    }
    toast({ title: "Član dodan", description: name });
    setNewMember("");
    refreshMembers();
  };

  const handleDeleteMember = async (id: string, name: string) => {
    if (!confirm(`Izbrisati člana "${name}"? Obstoječe aktivnosti ostanejo nespremenjene.`)) return;
    const { error } = await supabase.from("members").delete().eq("id", id);
    if (error) {
      toast({ title: "Napaka", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Član izbrisan", description: name });
    refreshMembers();
  };

  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleDateString("sl-SI", { day: "2-digit", month: "2-digit", year: "numeric" });
    } catch {
      return iso;
    }
  };
  const formatTime = (t: string) => t?.slice(0, 5) ?? t;
  const labelFor = (a: ActivityRow) =>
    a.aktivnost === "DRUGO" && a.aktivnost_drugo ? a.aktivnost_drugo : a.aktivnost;

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
          <div className="space-y-3">
            <div>
              <h2 className="text-lg font-semibold">Člani</h2>
              <p className="text-sm text-muted-foreground">
                Upravljaj seznam članov, ki se prikažejo v obrazcu evidence.
              </p>
            </div>
            <form onSubmit={handleAddMember} className="flex gap-2">
              <Input
                placeholder="Ime in priimek novega člana"
                value={newMember}
                onChange={(e) => setNewMember(e.target.value)}
                maxLength={100}
              />
              <Button type="submit" disabled={addingMember || !newMember.trim()}>
                <UserPlus className="h-4 w-4 mr-1" />
                Dodaj
              </Button>
            </form>
            <div className="flex flex-wrap gap-2">
              {members.length === 0 ? (
                <p className="text-sm text-muted-foreground">Ni članov.</p>
              ) : (
                members.map((m) => (
                  <div
                    key={m.id}
                    className="flex items-center gap-2 bg-secondary rounded-full pl-3 pr-1 py-1 text-sm"
                  >
                    <span>{m.name}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 rounded-full hover:bg-destructive/10 hover:text-destructive"
                      onClick={() => handleDeleteMember(m.id, m.name)}
                      aria-label={`Izbriši ${m.name}`}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="border-t border-border pt-4 space-y-4">
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

        <div className="bg-card border border-border rounded-2xl shadow-sm p-4 space-y-3">
          <h2 className="text-lg font-semibold">Podrobnosti po osebah</h2>
          <p className="text-sm text-muted-foreground">Kliknite osebo, da vidite vse aktivnosti, na katerih je sodelovala.</p>

          {fetching ? (
            <p className="text-muted-foreground text-sm py-4">Nalagam...</p>
          ) : visible.length === 0 ? (
            <p className="text-muted-foreground text-sm py-4">Ni rezultatov</p>
          ) : (
            <Accordion type="multiple" className="w-full">
              {visible.map(({ name, list }) => (
                <AccordionItem key={name} value={name}>
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center gap-3 flex-1 text-left">
                      <span className="font-medium">{name}</span>
                      <Badge variant={list.length > 0 ? "default" : "secondary"}>
                        {list.length} {list.length === 1 ? "aktivnost" : "aktivnosti"}
                      </Badge>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    {list.length === 0 ? (
                      <p className="text-sm text-muted-foreground py-2">Ni aktivnosti.</p>
                    ) : (
                      <ul className="space-y-3 pt-2">
                        {list.map((a) => (
                          <li
                            key={a.id}
                            className="border border-border rounded-xl p-3 bg-secondary/30 space-y-2"
                          >
                            <div className="flex items-center justify-between gap-2 flex-wrap">
                              <Badge variant="outline" className="font-semibold">
                                {labelFor(a)}
                              </Badge>
                              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                                <Calendar className="h-3.5 w-3.5" />
                                {formatDate(a.datum)}
                              </div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                              <div className="flex items-center gap-1.5">
                                <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                                <span>{formatTime(a.zacetek)} – {formatTime(a.konec)}</span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                                <span>{a.kraj}</span>
                              </div>
                            </div>
                            {a.opis && (
                              <div className="flex items-start gap-1.5 text-sm">
                                <FileText className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
                                <p className="whitespace-pre-wrap">{a.opis}</p>
                              </div>
                            )}
                          </li>
                        ))}
                      </ul>
                    )}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}
        </div>
      </div>
    </main>
  );
}