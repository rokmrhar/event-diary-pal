import { useEffect, useMemo, useState } from "react";
import AppShell from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useMembers } from "@/hooks/useMembers";
import { useModulePermissions } from "@/hooks/useModulePermissions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { VEHICLES } from "@/lib/people";
import { Siren, Plus, Lock, CheckCircle2, Trash2, Radio, User as UserIcon, Clock, Pencil } from "lucide-react";
import { formatDateSI, formatDateTimeSI, formatTime24 } from "@/lib/format";
import { DatePickerSI } from "@/components/ui/date-picker-si";

type MajorEvent = {
  id: string;
  user_id: string;
  naziv: string;
  vodja: string | null;
  delovni_kanali: string | null;
  opombe: string | null;
  status: string;
  opened_at: string;
  closed_at: string | null;
};

type Dogodek = {
  id: string;
  major_event_id: string;
  naziv: string;
  datum: string;
  ura: string | null;
  lokacija: string | null;
  opis: string | null;
  vodja: string | null;
  prisotni: string[];
  vozila: string[];
  vozila_drugo: string | null;
};

export default function VecjiObseg() {
  const { user } = useAuth();
  const { members } = useMembers();
  const { canEdit, loading: permLoading } = useModulePermissions();
  const allowed = canEdit("mass_events");

  const [events, setEvents] = useState<MajorEvent[]>([]);
  const [dogodki, setDogodki] = useState<Dogodek[]>([]);
  const [loading, setLoading] = useState(true);

  // Open new major event dialog
  const [openNew, setOpenNew] = useState(false);
  const [nNaziv, setNNaziv] = useState("");
  const [nVodja, setNVodja] = useState("");
  const [nKanali, setNKanali] = useState("");
  const [nOpombe, setNOpombe] = useState("");

  // Edit major event dialog
  const [editingEvent, setEditingEvent] = useState<MajorEvent | null>(null);

  // Add event inside major event
  const [addingFor, setAddingFor] = useState<MajorEvent | null>(null);
  const [dNaziv, setDNaziv] = useState("");
  const [dDatum, setDDatum] = useState(new Date().toISOString().slice(0, 10));
  const [dUra, setDUra] = useState("");
  const [dLokacija, setDLokacija] = useState("");
  const [dOpis, setDOpis] = useState("");
  const [dVodja, setDVodja] = useState("");
  const [dPrisotni, setDPrisotni] = useState<string[]>([]);
  const [dVozila, setDVozila] = useState<string[]>([]);
  const [dVozilaDrugo, setDVozilaDrugo] = useState("");
  const [dIskanje, setDIskanje] = useState("");

  const refresh = async () => {
    setLoading(true);
    const [eRes, dRes] = await Promise.all([
      supabase.from("major_events").select("*").order("opened_at", { ascending: false }),
      supabase.from("major_event_dogodki").select("*").order("created_at", { ascending: false }),
    ]);
    if (eRes.error) toast({ title: "Napaka", description: eRes.error.message, variant: "destructive" });
    setEvents((eRes.data as MajorEvent[]) ?? []);
    setDogodki(((dRes.data ?? []) as unknown as Dogodek[]).map((d) => ({
      ...d,
      prisotni: Array.isArray(d.prisotni) ? d.prisotni : [],
      vozila: Array.isArray(d.vozila) ? d.vozila : [],
    })));
    setLoading(false);
  };

  useEffect(() => {
    if (user) refresh();
  }, [user]);

  const open = events.filter((e) => e.status === "odprt");
  const closed = events.filter((e) => e.status === "zaključen");

  const dogodkiByEvent = useMemo(() => {
    const map: Record<string, Dogodek[]> = {};
    dogodki.forEach((d) => {
      (map[d.major_event_id] ??= []).push(d);
    });
    return map;
  }, [dogodki]);

  const filteredMembers = useMemo(
    () => members.filter((m) => m.name.toLowerCase().includes(dIskanje.toLowerCase())),
    [members, dIskanje]
  );

  const togglePerson = (n: string) =>
    setDPrisotni((p) => (p.includes(n) ? p.filter((x) => x !== n) : [...p, n]));
  const toggleVehicle = (t: string) =>
    setDVozila((p) => (p.includes(t) ? p.filter((x) => x !== t) : [...p, t]));

  const resetDogodek = () => {
    setDNaziv("");
    setDDatum(new Date().toISOString().slice(0, 10));
    setDUra("");
    setDLokacija("");
    setDOpis("");
    setDVodja("");
    setDPrisotni([]);
    setDVozila([]);
    setDVozilaDrugo("");
    setDIskanje("");
  };

  const handleOpenMajor = async () => {
    if (!user) return;
    if (!nNaziv.trim()) {
      toast({ title: "Manjka naziv", variant: "destructive" });
      return;
    }
    const { error } = await supabase.from("major_events").insert({
      user_id: user.id,
      naziv: nNaziv.trim(),
      vodja: nVodja.trim() || null,
      delovni_kanali: nKanali.trim() || null,
      opombe: nOpombe.trim() || null,
      status: "odprt",
    });
    if (error) {
      toast({ title: "Napaka", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Večji obseg odprt" });
    setOpenNew(false);
    setNNaziv(""); setNVodja(""); setNKanali(""); setNOpombe("");
    refresh();
  };

  const openEditEvent = (ev: MajorEvent) => {
    setEditingEvent(ev);
    setNNaziv(ev.naziv);
    setNVodja(ev.vodja ?? "");
    setNKanali(ev.delovni_kanali ?? "");
    setNOpombe(ev.opombe ?? "");
  };

  const handleSaveEditEvent = async () => {
    if (!editingEvent) return;
    if (!nNaziv.trim()) {
      toast({ title: "Manjka naziv", variant: "destructive" });
      return;
    }
    const { error } = await supabase
      .from("major_events")
      .update({
        naziv: nNaziv.trim(),
        vodja: nVodja.trim() || null,
        delovni_kanali: nKanali.trim() || null,
        opombe: nOpombe.trim() || null,
      })
      .eq("id", editingEvent.id);
    if (error) {
      toast({ title: "Napaka", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Posodobljeno" });
    setEditingEvent(null);
    setNNaziv(""); setNVodja(""); setNKanali(""); setNOpombe("");
    refresh();
  };

  const handleDeleteEvent = async (ev: MajorEvent) => {
    const list = dogodkiByEvent[ev.id] ?? [];
    const msg = list.length > 0
      ? `Izbrišem "${ev.naziv}" in ${list.length} povezanih dogodkov?`
      : `Izbrišem "${ev.naziv}"?`;
    if (!confirm(msg)) return;
    // Delete child dogodki first (no FK cascade configured by code)
    if (list.length > 0) {
      const { error: dErr } = await supabase
        .from("major_event_dogodki")
        .delete()
        .eq("major_event_id", ev.id);
      if (dErr) {
        toast({ title: "Napaka pri dogodkih", description: dErr.message, variant: "destructive" });
        return;
      }
    }
    const { error } = await supabase.from("major_events").delete().eq("id", ev.id);
    if (error) {
      toast({ title: "Napaka", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Izbrisano" });
    refresh();
  };

  const handleAddDogodek = async () => {
    if (!user || !addingFor) return;
    if (!dNaziv.trim() || !dDatum || !dLokacija.trim()) {
      toast({ title: "Manjkajo obvezna polja", description: "Naziv, datum in lokacija.", variant: "destructive" });
      return;
    }
    const { error } = await supabase.from("major_event_dogodki").insert({
      user_id: user.id,
      major_event_id: addingFor.id,
      naziv: dNaziv.trim(),
      datum: dDatum,
      ura: dUra || null,
      lokacija: dLokacija.trim(),
      opis: dOpis.trim() || null,
      vodja: dVodja.trim() || null,
      prisotni: dPrisotni,
      vozila: dVozila,
      vozila_drugo: dVozilaDrugo.trim() || null,
    });
    if (error) {
      toast({ title: "Napaka", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Dogodek dodan" });
    setAddingFor(null);
    resetDogodek();
    refresh();
  };

  const handleClose = async (ev: MajorEvent) => {
    if (!user) return;
    if (!confirm(`Zaključim "${ev.naziv}"? Vsi dogodki bodo preneseni v arhiv intervencij.`)) return;
    const list = dogodkiByEvent[ev.id] ?? [];
    // Insert each dogodek as intervention
    for (const d of list) {
      const { data: ins, error: iErr } = await supabase
        .from("interventions")
        .insert({
          user_id: user.id,
          datum: d.datum,
          trajanje_od: d.ura || "00:00",
          trajanje_do: d.ura || "00:00",
          naziv: `[V.O. ${ev.naziv}] ${d.naziv}`,
          skupina: "VSA",
          obcina: d.lokacija || "Šempeter - Vrtojba",
          obcina_drugo: null,
          vodja: d.vodja || ev.vodja || "—",
          opombe: d.opis || null,
        })
        .select("id")
        .single();
      if (iErr || !ins) {
        toast({ title: "Napaka pri prenosu", description: iErr?.message, variant: "destructive" });
        return;
      }
      if (d.prisotni.length > 0) {
        await supabase.from("intervention_attendees").insert(
          d.prisotni.map((p) => ({ intervention_id: ins.id, person_name: p }))
        );
      }
      if (d.vozila.length > 0) {
        await supabase.from("intervention_vehicles").insert(
          d.vozila.map((tip) => {
            const v = VEHICLES.find((x) => x.tip === tip);
            return { intervention_id: ins.id, tip_vozila: tip, klicni_znak: v?.znak ?? null };
          })
        );
      }
      await supabase
        .from("major_event_dogodki")
        .update({ intervention_id: ins.id })
        .eq("id", d.id);
    }
    const { error } = await supabase
      .from("major_events")
      .update({ status: "zaključen", closed_at: new Date().toISOString() })
      .eq("id", ev.id);
    if (error) {
      toast({ title: "Napaka", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Večji obseg zaključen", description: `Preneseno ${list.length} dogodkov v arhiv.` });
    refresh();
  };

  const handleDeleteDogodek = async (id: string) => {
    if (!confirm("Izbrišem dogodek?")) return;
    const { error } = await supabase.from("major_event_dogodki").delete().eq("id", id);
    if (error) toast({ title: "Napaka", description: error.message, variant: "destructive" });
    else refresh();
  };

  return (
    <AppShell>
      <div className="max-w-5xl mx-auto p-3 sm:p-6 lg:p-8 space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight uppercase flex items-center gap-2">
              <Siren className="h-7 w-7 text-brand-red" />
              Dogodek večjega obsega
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Upravljanje odprtih scenarijev in posameznih dogodkov.
            </p>
          </div>
          {allowed && (
            <Button onClick={() => setOpenNew(true)} className="bg-brand-red hover:bg-brand-red/90 text-brand-red-foreground">
              <Plus className="h-4 w-4 mr-1" /> Večji obseg
            </Button>
          )}
        </div>

        {!permLoading && !allowed && (
          <Card>
            <CardContent className="p-6 text-center space-y-2">
              <Lock className="h-10 w-10 mx-auto text-muted-foreground" />
              <p className="font-semibold">Nimate pravic za urejanje</p>
              <p className="text-sm text-muted-foreground">Lahko si ogledate odprte in zaključene dogodke.</p>
            </CardContent>
          </Card>
        )}

        {/* Open events */}
        <section className="space-y-3">
          <h2 className="text-sm uppercase tracking-wide text-muted-foreground font-semibold">
            Odprti ({open.length})
          </h2>
          {loading ? (
            <p className="text-sm text-muted-foreground">Nalagam...</p>
          ) : open.length === 0 ? (
            <Card><CardContent className="p-6 text-center text-sm text-muted-foreground">Ni odprtih dogodkov večjega obsega.</CardContent></Card>
          ) : (
            open.map((ev) => (
              <Card key={ev.id} className="border-brand-red/40">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div>
                      <CardTitle className="text-lg uppercase flex items-center gap-2">
                        <Siren className="h-5 w-5 text-brand-red animate-pulse" />
                        {ev.naziv}
                      </CardTitle>
                      <div className="flex flex-wrap gap-3 mt-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><UserIcon className="h-3.5 w-3.5" /> Vodja: {ev.vodja || "—"}</span>
                        <span className="flex items-center gap-1"><Radio className="h-3.5 w-3.5" /> Kanali: {ev.delovni_kanali || "—"}</span>
                        <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {formatDateTimeSI(ev.opened_at)}</span>
                      </div>
                      {ev.opombe && <p className="text-sm mt-2">{ev.opombe}</p>}
                    </div>
                    {allowed && (
                      <div className="flex flex-wrap gap-2">
                        <Button size="sm" variant="outline" onClick={() => { setAddingFor(ev); resetDogodek(); }}>
                          <Plus className="h-4 w-4 mr-1" /> Dogodek
                        </Button>
                        <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => handleClose(ev)}>
                          <CheckCircle2 className="h-4 w-4 mr-1" /> Zaključi
                        </Button>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-xs uppercase text-muted-foreground mb-2">
                    Dogodki ({(dogodkiByEvent[ev.id] ?? []).length})
                  </p>
                  <ul className="space-y-2">
                    {(dogodkiByEvent[ev.id] ?? []).map((d) => (
                      <li key={d.id} className="border border-border rounded-lg p-3 bg-muted/30">
                        <div className="flex items-start justify-between gap-2 flex-wrap">
                          <div className="min-w-0 flex-1">
                            <p className="font-semibold text-sm">{d.naziv}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {formatDateSI(d.datum)} {d.ura ? `• ${formatTime24(d.ura)}` : ""} • {d.lokacija || "—"}
                            </p>
                            <div className="flex flex-wrap gap-2 mt-2">
                              {d.vodja && <Badge variant="outline" className="text-xs">Vodja: {d.vodja}</Badge>}
                              {d.prisotni.length > 0 && <Badge variant="outline" className="text-xs">{d.prisotni.length} prisotnih</Badge>}
                              {(d.vozila.length > 0 || d.vozila_drugo) && (
                                <Badge variant="outline" className="text-xs">
                                  Vozila: {[...d.vozila, d.vozila_drugo].filter(Boolean).join(", ")}
                                </Badge>
                              )}
                            </div>
                            {d.opis && <p className="text-sm mt-2 text-foreground/80">{d.opis}</p>}
                          </div>
                          {allowed && (
                            <Button size="icon" variant="ghost" onClick={() => handleDeleteDogodek(d.id)} title="Izbriši">
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          )}
                        </div>
                      </li>
                    ))}
                    {(dogodkiByEvent[ev.id] ?? []).length === 0 && (
                      <li className="text-sm text-muted-foreground text-center py-3">Ni dogodkov.</li>
                    )}
                  </ul>
                </CardContent>
              </Card>
            ))
          )}
        </section>

        {/* Closed events */}
        {closed.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-sm uppercase tracking-wide text-muted-foreground font-semibold">
              Zaključeni ({closed.length})
            </h2>
            <ul className="space-y-2">
              {closed.map((ev) => (
                <li key={ev.id} className="border border-border rounded-lg p-3 bg-muted/30 flex items-center justify-between gap-3 flex-wrap">
                  <div>
                    <p className="font-medium uppercase text-sm">{ev.naziv}</p>
                  <p className="text-xs text-muted-foreground">
                      Odprt: {formatDateTimeSI(ev.opened_at)}
                      {ev.closed_at && ` • Zaključen: ${formatDateTimeSI(ev.closed_at)}`}
                    </p>
                  </div>
                  <Badge variant="outline">{(dogodkiByEvent[ev.id] ?? []).length} dogodkov</Badge>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>

      {/* New major event dialog */}
      <Dialog open={openNew} onOpenChange={setOpenNew}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Odpri večji obseg</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Naziv *</Label>
              <Input value={nNaziv} onChange={(e) => setNNaziv(e.target.value)} placeholder="npr. Požar Vipavska dolina" />
            </div>
            <div className="space-y-1.5">
              <Label>Vodja intervencije</Label>
              <Select value={nVodja} onValueChange={setNVodja}>
                <SelectTrigger>
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
              <Label>Delovni kanali</Label>
              <Input value={nKanali} onChange={(e) => setNKanali(e.target.value)} placeholder="npr. K1, K3" />
            </div>
            <div className="space-y-1.5">
              <Label>Opombe</Label>
              <Textarea value={nOpombe} onChange={(e) => setNOpombe(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenNew(false)}>Prekliči</Button>
            <Button onClick={handleOpenMajor} className="bg-brand-red hover:bg-brand-red/90 text-brand-red-foreground">Odpri</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add dogodek dialog */}
      <Dialog open={!!addingFor} onOpenChange={(o) => !o && setAddingFor(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Dodaj dogodek {addingFor ? `• ${addingFor.naziv}` : ""}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Naziv *</Label>
              <Input value={dNaziv} onChange={(e) => setDNaziv(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Datum *</Label>
                <Input type="date" value={dDatum} onChange={(e) => setDDatum(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Ura</Label>
                <Input type="time" value={dUra} onChange={(e) => setDUra(e.target.value)} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Lokacija *</Label>
              <Input value={dLokacija} onChange={(e) => setDLokacija(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Vodja dogodka</Label>
              <Select value={dVodja} onValueChange={setDVodja}>
                <SelectTrigger>
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
              <Label>Kratek opis</Label>
              <Textarea value={dOpis} onChange={(e) => setDOpis(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Vozila ({dVozila.length})</Label>
              <div className="grid grid-cols-2 gap-2 border border-border rounded-lg p-3 bg-muted/30 text-sm">
                {VEHICLES.map((v) => (
                  <label key={v.tip} className="flex items-center gap-2 cursor-pointer">
                    <Checkbox checked={dVozila.includes(v.tip)} onCheckedChange={() => toggleVehicle(v.tip)} />
                    <span className="font-medium">{v.tip}</span>
                    <span className="text-muted-foreground text-xs">{v.znak}</span>
                  </label>
                ))}
              </div>
              <Input
                placeholder="Druga vozila (prosti tekst)"
                value={dVozilaDrugo}
                onChange={(e) => setDVozilaDrugo(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Prisotni ({dPrisotni.length})</Label>
              <Input placeholder="Išči osebo..." value={dIskanje} onChange={(e) => setDIskanje(e.target.value)} />
              <div className="max-h-56 overflow-auto grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 border border-border rounded-lg p-3 bg-muted/30 text-sm">
                {filteredMembers.map((m) => (
                  <label key={m.id} className="flex items-center gap-2 cursor-pointer">
                    <Checkbox checked={dPrisotni.includes(m.name)} onCheckedChange={() => togglePerson(m.name)} />
                    <span>{m.name}</span>
                  </label>
                ))}
                {filteredMembers.length === 0 && <p className="text-muted-foreground text-center py-2 sm:col-span-2">Ni zadetkov</p>}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddingFor(null)}>Prekliči</Button>
            <Button onClick={handleAddDogodek} className="bg-brand-red hover:bg-brand-red/90 text-brand-red-foreground">Shrani</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}