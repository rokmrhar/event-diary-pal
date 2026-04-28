import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import AppShell from "@/components/AppShell";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useMembers } from "@/hooks/useMembers";
import { formatDateSI, formatTime24 } from "@/lib/format";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Trash2, Calendar, MapPin, Clock, User, Users, Truck, Pencil, Archive } from "lucide-react";

type InterventionRow = {
  id: string;
  user_id: string;
  stevilka: string | null;
  datum: string;
  trajanje_od: string;
  trajanje_do: string;
  cas_polne_ure: string | null;
  naziv: string;
  skupina: string;
  obcina: string;
  vodja: string;
  opombe: string | null;
};

type AttendeeRow = { intervention_id: string; person_name: string };
type VehicleRow = { intervention_id: string; tip_vozila: string; klicni_znak: string | null };

const formatDate = formatDateSI;
const formatTime = formatTime24;

const ArhivIntervencij = () => {
  const { user, loading, isAdmin } = useAuth();
  const navigate = useNavigate();
  const { members } = useMembers();
  const [interventions, setInterventions] = useState<InterventionRow[]>([]);
  const [attendees, setAttendees] = useState<AttendeeRow[]>([]);
  const [vehicles, setVehicles] = useState<VehicleRow[]>([]);
  const [search, setSearch] = useState("");
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState<InterventionRow | null>(null);
  const [editForm, setEditForm] = useState({
    stevilka: "",
    naziv: "",
    datum: "",
    trajanje_od: "",
    trajanje_do: "",
    cas_polne_ure: "",
    vodja: "",
    obcina: "",
    skupina: "",
    opombe: "",
  });
  const [editAttendees, setEditAttendees] = useState<string[]>([]);
  const [attSearch, setAttSearch] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);

  useEffect(() => {
    if (!loading && !user) navigate("/auth", { replace: true });
  }, [user, loading, navigate]);

  const load = async () => {
    const [iRes, aRes, vRes] = await Promise.all([
      supabase.from("interventions").select("*"),
      supabase.from("intervention_attendees").select("intervention_id, person_name"),
      supabase.from("intervention_vehicles").select("intervention_id, tip_vozila, klicni_znak"),
    ]);
    if (iRes.error) {
      toast({ title: "Napaka pri nalaganju", description: iRes.error.message, variant: "destructive" });
      return;
    }
    // Sort by intervention number (stevilka) descending — largest first.
    // Treat numeric-looking strings as numbers; missing values go to the end.
    const sorted = ((iRes.data ?? []) as InterventionRow[]).slice().sort((a, b) => {
      const an = a.stevilka ? Number(a.stevilka) : NaN;
      const bn = b.stevilka ? Number(b.stevilka) : NaN;
      const aValid = !isNaN(an);
      const bValid = !isNaN(bn);
      if (aValid && bValid) return bn - an;
      if (aValid) return -1;
      if (bValid) return 1;
      // Fallback: by date desc
      return (b.datum ?? "").localeCompare(a.datum ?? "");
    });
    setInterventions(sorted);
    setAttendees((aRes.data ?? []) as AttendeeRow[]);
    setVehicles((vRes.data ?? []) as VehicleRow[]);
  };

  useEffect(() => {
    if (user) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return interventions;
    return interventions.filter(
      (i) =>
        i.naziv.toLowerCase().includes(q) ||
        i.vodja.toLowerCase().includes(q) ||
        (i.stevilka ?? "").toLowerCase().includes(q) ||
        i.obcina.toLowerCase().includes(q)
    );
  }, [interventions, search]);

  const handleDelete = async (i: InterventionRow) => {
    if (!confirm(`Izbriši intervencijo "${i.naziv}"?`)) return;
    setBusy(true);
    const { error } = await supabase.from("interventions").delete().eq("id", i.id);
    setBusy(false);
    if (error) {
      toast({ title: "Napaka pri brisanju", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Intervencija izbrisana" });
    load();
  };

  const openEdit = (i: InterventionRow) => {
    setEditing(i);
    setEditForm({
      stevilka: i.stevilka ?? "",
      naziv: i.naziv,
      datum: i.datum,
      trajanje_od: i.trajanje_od?.slice(0, 5) ?? "",
      trajanje_do: i.trajanje_do?.slice(0, 5) ?? "",
      cas_polne_ure: i.cas_polne_ure ?? "",
      vodja: i.vodja,
      obcina: i.obcina,
      skupina: i.skupina,
      opombe: i.opombe ?? "",
    });
    setEditAttendees(attendees.filter((a) => a.intervention_id === i.id).map((a) => a.person_name));
    setAttSearch("");
  };

  const saveEdit = async () => {
    if (!editing) return;
    setSavingEdit(true);
    const { error } = await supabase
      .from("interventions")
      .update({
        stevilka: editForm.stevilka.trim() || null,
        naziv: editForm.naziv.trim(),
        datum: editForm.datum,
        trajanje_od: editForm.trajanje_od,
        trajanje_do: editForm.trajanje_do,
        cas_polne_ure: editForm.cas_polne_ure.trim() || null,
        vodja: editForm.vodja.trim(),
        obcina: editForm.obcina.trim(),
        skupina: editForm.skupina.trim(),
        opombe: editForm.opombe.trim() || null,
      })
      .eq("id", editing.id);
    if (error) {
      setSavingEdit(false);
      toast({ title: "Napaka pri shranjevanju", description: error.message, variant: "destructive" });
      return;
    }
    // Sync attendees: delete existing, insert current selection
    const { error: delErr } = await supabase
      .from("intervention_attendees")
      .delete()
      .eq("intervention_id", editing.id);
    if (delErr) {
      setSavingEdit(false);
      toast({ title: "Napaka pri prisotnih", description: delErr.message, variant: "destructive" });
      return;
    }
    if (editAttendees.length > 0) {
      const { error: insErr } = await supabase
        .from("intervention_attendees")
        .insert(editAttendees.map((person_name) => ({ intervention_id: editing.id, person_name })));
      if (insErr) {
        setSavingEdit(false);
        toast({ title: "Napaka pri prisotnih", description: insErr.message, variant: "destructive" });
        return;
      }
    }
    setSavingEdit(false);
    toast({ title: "Intervencija posodobljena" });
    setEditing(null);
    load();
  };

  const toggleEditAttendee = (name: string) =>
    setEditAttendees((p) => (p.includes(name) ? p.filter((x) => x !== name) : [...p, name]));

  const filteredEditMembers = useMemo(
    () => members.filter((m) => m.name.toLowerCase().includes(attSearch.toLowerCase())),
    [members, attSearch]
  );

  if (loading || !user) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground text-sm">Nalagam...</p>
      </main>
    );
  }

  return (
    <AppShell>
      <div className="max-w-md md:max-w-3xl lg:max-w-5xl mx-auto p-3 sm:p-6 lg:p-8 space-y-4">
        <div className="flex items-center justify-between gap-3">
           <h1 className="text-2xl sm:text-3xl font-bold tracking-tight uppercase flex items-center gap-2">
            <Archive className="h-7 w-7 text-brand-red" /> Arhiv intervencij
          </h1>
          <Button onClick={() => navigate("/intervencija")} size="sm">
            Nova intervencija
          </Button>
        </div>

        <Input
          placeholder="Išči po nazivu, vodji, številki, občini..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        {visible.length === 0 ? (
          <div className="bg-card border border-border rounded-2xl p-8 text-center text-muted-foreground">
            Ni zapisov.
          </div>
        ) : (
          <Accordion type="multiple" className="space-y-2">
            {visible.map((i) => {
              const att = attendees.filter((a) => a.intervention_id === i.id);
              const veh = vehicles.filter((v) => v.intervention_id === i.id);
              const canDelete = isAdmin || i.user_id === user.id;
              return (
                <AccordionItem
                  key={i.id}
                  value={i.id}
                  className="bg-card border border-border rounded-xl px-4"
                >
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex flex-1 items-center justify-between gap-3 pr-2 text-left">
                      <div className="flex flex-col items-start gap-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          {i.stevilka && (
                            <Badge variant="secondary" className="text-xs">#{i.stevilka}</Badge>
                          )}
                          <span className="font-semibold truncate">{i.naziv}</span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                          <span className="inline-flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDate(i.datum)}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatTime(i.trajanje_od)}–{formatTime(i.trajanje_do)}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {i.obcina}
                          </span>
                        </div>
                      </div>
                      <Badge className="shrink-0">SKUP. {i.skupina}</Badge>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-3 pt-2">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                      <div className="flex items-start gap-2">
                        <User className="h-4 w-4 text-muted-foreground mt-0.5" />
                        <div>
                          <div className="text-xs text-muted-foreground">Vodja</div>
                          <div className="font-medium">{i.vodja}</div>
                        </div>
                      </div>
                      {i.cas_polne_ure && (
                        <div className="flex items-start gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground mt-0.5" />
                          <div>
                            <div className="text-xs text-muted-foreground">Čas (h)</div>
                            <div className="font-medium">{i.cas_polne_ure}</div>
                          </div>
                        </div>
                      )}
                    </div>

                    {veh.length > 0 && (
                      <div className="space-y-1">
                        <div className="text-xs text-muted-foreground inline-flex items-center gap-1">
                          <Truck className="h-3 w-3" /> Vozila ({veh.length})
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {veh.map((v, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {v.tip_vozila}
                              {v.klicni_znak ? ` · ${v.klicni_znak}` : ""}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {att.length > 0 && (
                      <div className="space-y-1">
                        <div className="text-xs text-muted-foreground inline-flex items-center gap-1">
                          <Users className="h-3 w-3" /> Prisotni ({att.length})
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {att.map((a, idx) => (
                            <Badge key={idx} variant="secondary" className="text-xs">
                              {a.person_name}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {i.opombe && (
                      <div>
                        <div className="text-xs text-muted-foreground">Opombe</div>
                        <div className="text-sm whitespace-pre-wrap">{i.opombe}</div>
                      </div>
                    )}

                    {canDelete && (
                      <div className="flex justify-end pt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="mr-2"
                          onClick={() => openEdit(i)}
                        >
                          <Pencil className="h-4 w-4 mr-1" /> Uredi
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          disabled={busy}
                          onClick={() => handleDelete(i)}
                        >
                          <Trash2 className="h-4 w-4 mr-1" /> Izbriši
                        </Button>
                      </div>
                    )}
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        )}

        <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
          <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Uredi intervencijo</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="ed-stevilka">Številka</Label>
                <Input id="ed-stevilka" value={editForm.stevilka} onChange={(e) => setEditForm((p) => ({ ...p, stevilka: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ed-skupina">Skupina</Label>
                <Input id="ed-skupina" value={editForm.skupina} onChange={(e) => setEditForm((p) => ({ ...p, skupina: e.target.value }))} />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="ed-naziv">Naziv</Label>
                <Input id="ed-naziv" value={editForm.naziv} onChange={(e) => setEditForm((p) => ({ ...p, naziv: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ed-datum">Datum</Label>
                <Input id="ed-datum" type="date" value={editForm.datum} onChange={(e) => setEditForm((p) => ({ ...p, datum: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ed-cas">Čas (h)</Label>
                <Input id="ed-cas" value={editForm.cas_polne_ure} onChange={(e) => setEditForm((p) => ({ ...p, cas_polne_ure: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ed-od">Trajanje od</Label>
                <Input id="ed-od" type="time" value={editForm.trajanje_od} onChange={(e) => setEditForm((p) => ({ ...p, trajanje_od: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ed-do">Trajanje do</Label>
                <Input id="ed-do" type="time" value={editForm.trajanje_do} onChange={(e) => setEditForm((p) => ({ ...p, trajanje_do: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ed-vodja">Vodja</Label>
                <Select value={editForm.vodja} onValueChange={(v) => setEditForm((p) => ({ ...p, vodja: v }))}>
                  <SelectTrigger id="ed-vodja">
                    <SelectValue placeholder="Izberi vodjo" />
                  </SelectTrigger>
                  <SelectContent>
                    {members.map((m) => (
                      <SelectItem key={m.id} value={m.name}>{m.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ed-obcina">Občina</Label>
                <Input id="ed-obcina" value={editForm.obcina} onChange={(e) => setEditForm((p) => ({ ...p, obcina: e.target.value }))} />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="ed-opombe">Opombe</Label>
                <Textarea id="ed-opombe" rows={3} value={editForm.opombe} onChange={(e) => setEditForm((p) => ({ ...p, opombe: e.target.value }))} />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Prisotni ({editAttendees.length})</Label>
                <Input
                  placeholder="Išči osebo..."
                  value={attSearch}
                  onChange={(e) => setAttSearch(e.target.value)}
                />
                <div className="max-h-56 overflow-auto grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 border border-border rounded-lg p-3 bg-muted/30 text-sm">
                  {filteredEditMembers.length === 0 && (
                    <p className="text-muted-foreground text-center py-2 sm:col-span-2">Ni zadetkov</p>
                  )}
                  {filteredEditMembers.map((m) => (
                    <label key={m.id} className="flex items-center gap-2 cursor-pointer">
                      <Checkbox
                        checked={editAttendees.includes(m.name)}
                        onCheckedChange={() => toggleEditAttendee(m.name)}
                      />
                      <span>{m.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setEditing(null)} disabled={savingEdit}>Prekliči</Button>
              <Button onClick={saveEdit} disabled={savingEdit}>
                {savingEdit ? "Shranjujem..." : "Shrani"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppShell>
  );
};

export default ArhivIntervencij;
