import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useMembers } from "@/hooks/useMembers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Pencil, Trash2 } from "lucide-react";
import { ACTIVITY_TYPES } from "@/lib/people";
import { toast } from "@/hooks/use-toast";
import { formatDateSI, formatTime24 } from "@/lib/format";

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
type AttendeeRow = { id: string; person_name: string; activity_id: string };

const formatDate = formatDateSI;
const formatTime = formatTime24;
const labelFor = (a: ActivityRow) =>
  a.aktivnost === "DRUGO" && a.aktivnost_drugo ? a.aktivnost_drugo : a.aktivnost;

export default function ActivitiesTab() {
  const { members } = useMembers();
  const [activities, setActivities] = useState<ActivityRow[]>([]);
  const [attendees, setAttendees] = useState<AttendeeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<ActivityRow | null>(null);
  const [editAttendees, setEditAttendees] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const [act, att] = await Promise.all([
      supabase
        .from("activities")
        .select("id, datum, aktivnost, aktivnost_drugo, zacetek, konec, kraj, opis")
        .order("datum", { ascending: false }),
      supabase.from("activity_attendees").select("id, person_name, activity_id"),
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

  useEffect(() => {
    load();
  }, []);

  const attendeesByActivity = useMemo(() => {
    const m = new Map<string, string[]>();
    for (const at of attendees) {
      if (!m.has(at.activity_id)) m.set(at.activity_id, []);
      m.get(at.activity_id)!.push(at.person_name);
    }
    return m;
  }, [attendees]);

  const visible = activities.filter((a) => {
    const q = search.toLowerCase();
    return (
      labelFor(a).toLowerCase().includes(q) ||
      a.kraj.toLowerCase().includes(q) ||
      a.opis.toLowerCase().includes(q) ||
      a.datum.includes(q)
    );
  });

  const startEdit = (a: ActivityRow) => {
    setEditing({ ...a });
    setEditAttendees(attendeesByActivity.get(a.id) ?? []);
  };

  const handleDelete = async (a: ActivityRow) => {
    if (!confirm(`Izbrisati aktivnost "${labelFor(a)}" (${formatDate(a.datum)})?`)) return;
    // Delete attendees first (FK), then the activity
    const { error: attErr } = await supabase.from("activity_attendees").delete().eq("activity_id", a.id);
    if (attErr) {
      toast({ title: "Napaka", description: attErr.message, variant: "destructive" });
      return;
    }
    const { error } = await supabase.from("activities").delete().eq("id", a.id);
    if (error) {
      toast({ title: "Napaka", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Aktivnost izbrisana" });
    load();
  };

  const togglePerson = (name: string) => {
    setEditAttendees((prev) =>
      prev.includes(name) ? prev.filter((p) => p !== name) : [...prev, name]
    );
  };

  const saveEdit = async () => {
    if (!editing) return;
    if (
      !editing.datum ||
      !editing.zacetek ||
      !editing.konec ||
      !editing.kraj ||
      !editing.opis ||
      editAttendees.length === 0
    ) {
      toast({ title: "Manjkajoči podatki", variant: "destructive" });
      return;
    }
    setSaving(true);
    const { error } = await supabase
      .from("activities")
      .update({
        datum: editing.datum,
        aktivnost: editing.aktivnost,
        aktivnost_drugo: editing.aktivnost === "DRUGO" ? editing.aktivnost_drugo : null,
        zacetek: editing.zacetek,
        konec: editing.konec,
        kraj: editing.kraj,
        opis: editing.opis,
      })
      .eq("id", editing.id);
    if (error) {
      setSaving(false);
      toast({ title: "Napaka", description: error.message, variant: "destructive" });
      return;
    }
    // Sync attendees: delete all, insert new
    await supabase.from("activity_attendees").delete().eq("activity_id", editing.id);
    if (editAttendees.length > 0) {
      const { error: insErr } = await supabase
        .from("activity_attendees")
        .insert(editAttendees.map((person_name) => ({ activity_id: editing.id, person_name })));
      if (insErr) {
        setSaving(false);
        toast({ title: "Napaka pri prisotnih", description: insErr.message, variant: "destructive" });
        return;
      }
    }
    setSaving(false);
    toast({ title: "Aktivnost posodobljena" });
    setEditing(null);
    load();
  };

  return (
    <div className="space-y-4">
      <Input
        placeholder="Išči aktivnost (tip, kraj, opis, datum)..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-sm w-full"
      />

      {/* Desktop / tablet table */}
      <div className="hidden md:block overflow-x-auto border border-border rounded-xl">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Datum</TableHead>
              <TableHead>Aktivnost</TableHead>
              <TableHead>Čas</TableHead>
              <TableHead>Kraj</TableHead>
              <TableHead className="text-center">Prisotni</TableHead>
              <TableHead className="w-[120px] text-right">Dejanja</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  Nalagam...
                </TableCell>
              </TableRow>
            ) : visible.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  Ni aktivnosti
                </TableCell>
              </TableRow>
            ) : (
              visible.map((a) => (
                <TableRow key={a.id}>
                  <TableCell className="whitespace-nowrap">{formatDate(a.datum)}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{labelFor(a)}</Badge>
                  </TableCell>
                  <TableCell className="whitespace-nowrap tabular-nums">
                    {formatTime(a.zacetek)}–{formatTime(a.konec)}
                  </TableCell>
                  <TableCell>{a.kraj}</TableCell>
                  <TableCell className="text-center tabular-nums">
                    {(attendeesByActivity.get(a.id) ?? []).length}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => startEdit(a)}
                        aria-label="Uredi"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="hover:bg-destructive/10 hover:text-destructive"
                        onClick={() => handleDelete(a)}
                        aria-label="Izbriši"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-3">
        {loading ? (
          <p className="text-center text-muted-foreground py-8 text-sm">Nalagam...</p>
        ) : visible.length === 0 ? (
          <p className="text-center text-muted-foreground py-8 text-sm">Ni aktivnosti</p>
        ) : (
          visible.map((a) => (
            <div key={a.id} className="border border-border rounded-xl p-3 bg-card space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-1 min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="outline">{labelFor(a)}</Badge>
                    <span className="text-sm text-muted-foreground">{formatDate(a.datum)}</span>
                  </div>
                  <p className="text-sm tabular-nums">
                    {formatTime(a.zacetek)}–{formatTime(a.konec)} • {a.kraj}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Prisotni: {(attendeesByActivity.get(a.id) ?? []).length}
                  </p>
                </div>
                <div className="flex flex-col gap-1 shrink-0">
                  <Button size="icon" variant="ghost" onClick={() => startEdit(a)} aria-label="Uredi">
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => handleDelete(a)}
                    aria-label="Izbriši"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Uredi aktivnost</DialogTitle>
          </DialogHeader>
          {editing && (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="e-datum">Datum</Label>
                <Input
                  id="e-datum"
                  type="date"
                  value={editing.datum}
                  onChange={(e) => setEditing({ ...editing, datum: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Aktivnost</Label>
                <Select
                  value={editing.aktivnost}
                  onValueChange={(v) => setEditing({ ...editing, aktivnost: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ACTIVITY_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {editing.aktivnost === "DRUGO" && (
                  <Input
                    placeholder="Vnesi aktivnost"
                    value={editing.aktivnost_drugo ?? ""}
                    onChange={(e) => setEditing({ ...editing, aktivnost_drugo: e.target.value })}
                  />
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="e-zac">Začetek</Label>
                  <Input
                    id="e-zac"
                    type="time"
                    value={editing.zacetek?.slice(0, 5) ?? ""}
                    onChange={(e) => setEditing({ ...editing, zacetek: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="e-kon">Konec</Label>
                  <Input
                    id="e-kon"
                    type="time"
                    value={editing.konec?.slice(0, 5) ?? ""}
                    onChange={(e) => setEditing({ ...editing, konec: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="e-kraj">Kraj</Label>
                <Input
                  id="e-kraj"
                  value={editing.kraj}
                  onChange={(e) => setEditing({ ...editing, kraj: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="e-opis">Opis</Label>
                <Textarea
                  id="e-opis"
                  value={editing.opis}
                  onChange={(e) => setEditing({ ...editing, opis: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Prisotni ({editAttendees.length})</Label>
                <div className="max-h-48 overflow-auto space-y-2 border border-border rounded-xl p-3 text-sm bg-secondary/30">
                  {members.map((m) => (
                    <label key={m.id} className="flex items-center gap-2 cursor-pointer">
                      <Checkbox
                        checked={editAttendees.includes(m.name)}
                        onCheckedChange={() => togglePerson(m.name)}
                      />
                      <span>{m.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)} disabled={saving}>
              Prekliči
            </Button>
            <Button onClick={saveEdit} disabled={saving}>
              {saving ? "Shranjujem..." : "Shrani"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}