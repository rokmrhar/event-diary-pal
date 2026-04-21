import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useMembers } from "@/hooks/useMembers";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Calendar, Clock, MapPin, FileText } from "lucide-react";
import { ACTIVITY_TYPES } from "@/lib/people";
import { toast } from "@/hooks/use-toast";

// Barvno kodiranje vrst aktivnosti
const ACTIVITY_COLORS: Record<string, { bg: string; text: string; border: string; lightBg: string }> = {
  "VAJE": { bg: "bg-blue-500", text: "text-blue-500", border: "border-blue-500", lightBg: "bg-blue-50" },
  "DELOVNI PONEDELJEK": { bg: "bg-emerald-500", text: "text-emerald-500", border: "border-emerald-500", lightBg: "bg-emerald-50" },
  "DELOVNI DAN": { bg: "bg-amber-500", text: "text-amber-500", border: "border-amber-500", lightBg: "bg-amber-50" },
  "DRUGO": { bg: "bg-purple-500", text: "text-purple-500", border: "border-purple-500", lightBg: "bg-purple-50" },
};

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

export default function StatsTab() {
  const { members } = useMembers();
  const [activities, setActivities] = useState<ActivityRow[]>([]);
  const [attendees, setAttendees] = useState<AttendeeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
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
      } else {
        setActivities((act.data ?? []) as ActivityRow[]);
        setAttendees((att.data ?? []) as AttendeeRow[]);
      }
      setLoading(false);
    };
    load();
  }, []);

  const activitiesById = useMemo(() => {
    const m = new Map<string, ActivityRow>();
    activities.forEach((a) => m.set(a.id, a));
    return m;
  }, [activities]);

  const perPerson = useMemo(() => {
    const m = new Map<string, ActivityRow[]>();
    members.forEach((p) => m.set(p.name, []));
    for (const at of attendees) {
      const a = activitiesById.get(at.activity_id);
      if (!a) continue;
      if (!m.has(at.person_name)) m.set(at.person_name, []);
      m.get(at.person_name)!.push(a);
    }
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
      .sort((a, b) => {
        const pa = a.name.trim().split(/\s+/);
        const pb = b.name.trim().split(/\s+/);
        const sa = pa.length > 1 ? pa[1] : a.name;
        const sb = pb.length > 1 ? pb[1] : b.name;
        return sa.localeCompare(sb, "sl") || a.name.localeCompare(b.name, "sl");
      });
  }, [perPerson]);

  const visible = stats.filter((s) => s.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-4">
      <Input
        placeholder="Išči osebo..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-sm w-full"
      />

      <div className="hidden sm:block overflow-x-auto border border-border rounded-xl">
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
            {loading ? (
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

      {/* Mobile compact summary */}
      <div className="sm:hidden space-y-2">
        {loading ? (
          <p className="text-center text-muted-foreground py-6 text-sm">Nalagam...</p>
        ) : visible.length === 0 ? (
          <p className="text-center text-muted-foreground py-6 text-sm">Ni rezultatov</p>
        ) : (
          visible.map(({ name, counts }) => (
            <div key={name} className="border border-border rounded-xl p-3 bg-card">
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="font-medium truncate">{name}</span>
                <Badge>{counts.total}</Badge>
              </div>
              <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs text-muted-foreground">
                {ACTIVITY_TYPES.map((t) => (
                  <div key={t} className="flex justify-between">
                    <span className="truncate">{t}</span>
                    <span className="tabular-nums font-medium text-foreground">{counts[t] ?? 0}</span>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      <div className="space-y-2">
        <h3 className="text-base font-semibold">Podrobnosti po osebah</h3>
        {loading ? (
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
  );
}