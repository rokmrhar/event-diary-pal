import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import AppShell from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useModulePermissions } from "@/hooks/useModulePermissions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { Truck, Plus, Pencil, Trash2, Wrench, ClipboardCheck, ArrowLeft, Lock } from "lucide-react";
import { formatDateSI } from "@/lib/format";

type Vehicle = {
  id: string;
  oznaka: string;
  registracija: string | null;
  znamka: string | null;
  model: string | null;
  st_sedezev: number | null;
  opombe: string | null;
  user_id: string;
};
type Service = { id: string; vehicle_id: string; datum: string; opis: string };
type Inspection = { id: string; vehicle_id: string; zadnji_pregled: string | null; naslednji_pregled: string | null };

export default function Vozila() {
  const { user } = useAuth();
  const { canEdit } = useModulePermissions();
  const allowed = canEdit("vehicles");

  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Vehicle | null>(null);

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Vehicle | null>(null);
  const [fOznaka, setFOznaka] = useState("");
  const [fReg, setFReg] = useState("");
  const [fZnamka, setFZnamka] = useState("");
  const [fModel, setFModel] = useState("");
  const [fSedezev, setFSedezev] = useState("");
  const [fOpombe, setFOpombe] = useState("");
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const [vRes, sRes, iRes] = await Promise.all([
      supabase.from("vehicles").select("*").order("oznaka"),
      supabase.from("vehicle_services").select("id, vehicle_id, datum, opis"),
      supabase.from("vehicle_inspections").select("id, vehicle_id, zadnji_pregled, naslednji_pregled"),
    ]);
    setVehicles((vRes.data ?? []) as Vehicle[]);
    setServices((sRes.data ?? []) as Service[]);
    setInspections((iRes.data ?? []) as Inspection[]);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const servicesByVehicle = useMemo(() => {
    const m: Record<string, Service[]> = {};
    services.forEach((s) => (m[s.vehicle_id] ??= []).push(s));
    return m;
  }, [services]);

  const inspByVehicle = useMemo(() => {
    const m: Record<string, Inspection> = {};
    inspections.forEach((i) => { m[i.vehicle_id] = i; });
    return m;
  }, [inspections]);

  const openCreate = () => {
    setEditing(null);
    setFOznaka(""); setFReg(""); setFZnamka(""); setFModel(""); setFSedezev(""); setFOpombe("");
    setOpen(true);
  };
  const openEdit = (v: Vehicle) => {
    setEditing(v);
    setFOznaka(v.oznaka);
    setFReg(v.registracija ?? "");
    setFZnamka(v.znamka ?? "");
    setFModel(v.model ?? "");
    setFSedezev(v.st_sedezev ? String(v.st_sedezev) : "");
    setFOpombe(v.opombe ?? "");
    setOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !fOznaka.trim()) {
      toast({ title: "Manjka oznaka", variant: "destructive" });
      return;
    }
    setSaving(true);
    const payload = {
      oznaka: fOznaka.trim(),
      registracija: fReg.trim() || null,
      znamka: fZnamka.trim() || null,
      model: fModel.trim() || null,
      st_sedezev: fSedezev ? Number(fSedezev) : null,
      opombe: fOpombe.trim() || null,
    };
    if (editing) {
      const { error } = await supabase.from("vehicles").update(payload).eq("id", editing.id);
      setSaving(false);
      if (error) { toast({ title: "Napaka", description: error.message, variant: "destructive" }); return; }
      toast({ title: "Posodobljeno" });
    } else {
      const { error } = await supabase.from("vehicles").insert({ ...payload, user_id: user.id });
      setSaving(false);
      if (error) { toast({ title: "Napaka", description: error.message, variant: "destructive" }); return; }
      toast({ title: "Vozilo dodano" });
    }
    setOpen(false);
    load();
  };

  const handleDelete = async (v: Vehicle) => {
    if (!confirm(`Izbriši vozilo "${v.oznaka}"?`)) return;
    const { error } = await supabase.from("vehicles").delete().eq("id", v.id);
    if (error) { toast({ title: "Napaka", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Izbrisano" });
    if (selected?.id === v.id) setSelected(null);
    load();
  };

  if (selected) {
    const svc = (servicesByVehicle[selected.id] ?? []).slice().sort((a, b) => b.datum.localeCompare(a.datum));
    const insp = inspByVehicle[selected.id];
    return (
      <AppShell>
        <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-4">
          <div className="flex items-center gap-3 flex-wrap">
            <Button variant="ghost" size="sm" onClick={() => setSelected(null)}>
              <ArrowLeft className="h-4 w-4 mr-1" /> Vsa vozila
            </Button>
            <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
              <Truck className="h-6 w-6 text-brand-red" /> {selected.oznaka}
            </h1>
            {allowed && (
              <Button size="sm" variant="outline" onClick={() => openEdit(selected)}>
                <Pencil className="h-4 w-4 mr-1" /> Uredi
              </Button>
            )}
          </div>

          <Card>
            <CardContent className="p-6 grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
              <Field label="Reg. označba" value={selected.registracija ?? "—"} />
              <Field label="Znamka" value={selected.znamka ?? "—"} />
              <Field label="Model" value={selected.model ?? "—"} />
              <Field label="Št. sedežev" value={selected.st_sedezev ? String(selected.st_sedezev) : "—"} />
              {selected.opombe && <div className="col-span-2 sm:col-span-4"><Field label="Opombe" value={selected.opombe} /></div>}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 space-y-3">
              <h2 className="font-semibold flex items-center gap-2"><ClipboardCheck className="h-4 w-4 text-brand-red" /> Tehnični pregled</h2>
              {insp ? (
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <Field label="Zadnji pregled" value={formatDateSI(insp.zadnji_pregled)} />
                  <Field label="Naslednji pregled" value={formatDateSI(insp.naslednji_pregled)} />
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Ni evidence tehničnega pregleda.</p>
              )}
              <Button asChild size="sm" variant="outline">
                <Link to="/servisi/tehnicni-pregledi">Upravljaj tehnične preglede</Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <h2 className="font-semibold flex items-center gap-2"><Wrench className="h-4 w-4 text-brand-red" /> Knjiga servisov ({svc.length})</h2>
                <Button asChild size="sm" variant="outline">
                  <Link to="/servisi/knjiga">Upravljaj servise</Link>
                </Button>
              </div>
              {svc.length === 0 ? (
                <p className="text-sm text-muted-foreground">Ni vpisov.</p>
              ) : (
                <ul className="divide-y divide-border">
                  {svc.map((s) => (
                    <li key={s.id} className="py-2 text-sm">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-medium">{formatDateSI(s.datum)}</span>
                      </div>
                      <p className="text-muted-foreground">{s.opis}</p>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight uppercase flex items-center gap-2">
              <Truck className="h-7 w-7 text-brand-red" /> VOZILA
          </h1>
          {allowed && (
            <Button onClick={openCreate} className="bg-brand-red hover:bg-brand-red/90 text-brand-red-foreground">
              <Plus className="h-4 w-4 mr-1" /> Novo vozilo
            </Button>
          )}
        </div>

        {!allowed && (
          <div className="flex items-center gap-2 p-3 rounded-lg border border-border bg-muted/40 text-sm text-muted-foreground">
            <Lock className="h-4 w-4" /> Nimaš pravic za urejanje. Vozila si lahko samo ogleduješ.
          </div>
        )}

        {loading ? (
          <p className="text-sm text-muted-foreground">Nalagam...</p>
        ) : vehicles.length === 0 ? (
          <Card><CardContent className="p-8 text-center text-muted-foreground">Ni vozil.</CardContent></Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {vehicles.map((v) => {
              const svcCount = (servicesByVehicle[v.id] ?? []).length;
              const insp = inspByVehicle[v.id];
              return (
                <Card key={v.id} className="hover:shadow-md transition cursor-pointer" onClick={() => setSelected(v)}>
                  <CardContent className="p-4 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <Truck className="h-5 w-5 text-brand-red shrink-0" />
                        <div className="min-w-0">
                          <p className="font-semibold truncate">{v.oznaka}</p>
                          <p className="text-xs text-muted-foreground truncate">{v.registracija ?? "—"}</p>
                        </div>
                      </div>
                      {allowed && (
                        <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                          <Button size="icon" variant="ghost" onClick={() => openEdit(v)}><Pencil className="h-4 w-4" /></Button>
                          <Button size="icon" variant="ghost" onClick={() => handleDelete(v)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                        </div>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {v.znamka || "—"} {v.model ? `• ${v.model}` : ""}
                    </div>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      <Badge variant="outline" className="text-xs"><Wrench className="h-3 w-3 mr-1" /> Št. servisov: {svcCount}</Badge>
                      {insp?.naslednji_pregled && (
                        <Badge variant="outline" className="text-xs"><ClipboardCheck className="h-3 w-3 mr-1" /> Naslednji TP: {formatDateSI(insp.naslednji_pregled)}</Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>{editing ? "Uredi vozilo" : "Novo vozilo"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5"><Label>Oznaka *</Label><Input value={fOznaka} onChange={(e) => setFOznaka(e.target.value)} placeholder="npr. GVC 16/25" required /></div>
                <div className="space-y-1.5"><Label>Reg. označba</Label><Input value={fReg} onChange={(e) => setFReg(e.target.value)} placeholder="ŠEM. 41" /></div>
                <div className="space-y-1.5"><Label>Znamka</Label><Input value={fZnamka} onChange={(e) => setFZnamka(e.target.value)} /></div>
                <div className="space-y-1.5"><Label>Model</Label><Input value={fModel} onChange={(e) => setFModel(e.target.value)} /></div>
                <div className="space-y-1.5"><Label>Št. sedežev</Label><Input type="number" value={fSedezev} onChange={(e) => setFSedezev(e.target.value)} /></div>
              </div>
              <div className="space-y-1.5"><Label>Opombe</Label><Textarea rows={2} value={fOpombe} onChange={(e) => setFOpombe(e.target.value)} /></div>
              <DialogFooter className="gap-2">
                <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={saving}>Prekliči</Button>
                <Button type="submit" disabled={saving} className="bg-brand-red hover:bg-brand-red/90 text-brand-red-foreground">
                  {saving ? "Shranjujem..." : editing ? "Posodobi" : "Shrani"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </AppShell>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground uppercase">{label}</p>
      <p className="font-medium">{value}</p>
    </div>
  );
}
