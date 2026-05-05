import { useEffect, useMemo, useState } from "react";
import AppShell from "@/components/AppShell";
import PageHeader from "@/components/PageHeader";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useVehicles } from "@/hooks/useVehicles";
import { useMembers } from "@/hooks/useMembers";
import { useModulePermissions } from "@/hooks/useModulePermissions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { DatePickerSI } from "@/components/ui/date-picker-si";
import { toast } from "@/hooks/use-toast";
import { ClipboardList, Plus, Trash2, Lock, Pencil } from "lucide-react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { formatDateSI } from "@/lib/format";

type Trip = {
  id: string;
  user_id: string;
  vehicle_id: string;
  datum: string;
  relacija_od: string;
  relacija_do: string;
  relacija_do2: string | null;
  km_stevec: number | null;
  voznik: string;
  opombe: string | null;
};

type MemberLic = { id: string; name: string; licenca_b: boolean; licenca_c: boolean };

export default function PotniNalog() {
  const { user } = useAuth();
  const { vehicles } = useVehicles();
  const { canEdit } = useModulePermissions();
  const allowed = canEdit("potni_nalog");

  const [trips, setTrips] = useState<Trip[]>([]);
  const [drivers, setDrivers] = useState<MemberLic[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [fDatum, setFDatum] = useState("");
  const [fVehicle, setFVehicle] = useState("");
  const [fOd, setFOd] = useState("");
  const [fDo, setFDo] = useState("");
  const [fDo2, setFDo2] = useState("");
  const [fKm, setFKm] = useState("");
  const [fVoznik, setFVoznik] = useState("");
  const [fOpombe, setFOpombe] = useState("");
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const [tRes, mRes] = await Promise.all([
      supabase.from("vehicle_trips").select("*").order("datum", { ascending: false }),
      supabase.from("members").select("id, name, licenca_b, licenca_c"),
    ]);
    setTrips((tRes.data ?? []) as Trip[]);
    const allMembers = ((mRes.data ?? []) as MemberLic[]).filter((m) => m.licenca_b || m.licenca_c);
    allMembers.sort((a, b) => a.name.localeCompare(b.name, "sl"));
    setDrivers(allMembers);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const vehicleById = useMemo(() => Object.fromEntries(vehicles.map((v) => [v.id, v])), [vehicles]);

  const reset = () => {
    setFDatum(""); setFVehicle(""); setFOd(""); setFDo(""); setFDo2(""); setFKm(""); setFVoznik(""); setFOpombe("");
    setEditingId(null);
  };

  const openEdit = (t: Trip) => {
    setEditingId(t.id);
    setFDatum(t.datum);
    setFVehicle(t.vehicle_id);
    setFOd(t.relacija_od);
    setFDo(t.relacija_do);
    setFDo2(t.relacija_do2 ?? "");
    setFKm(t.km_stevec != null ? String(t.km_stevec) : "");
    setFVoznik(t.voznik);
    setFOpombe(t.opombe ?? "");
    setOpen(true);
  };

  const submit = async () => {
    if (!user) return;
    if (!fDatum || !fVehicle || !fOd.trim() || !fDo.trim() || !fVoznik) {
      toast({ title: "Manjkajoči podatki", description: "Izpolnite obvezna polja.", variant: "destructive" });
      return;
    }
    setSaving(true);
    const payload = {
      vehicle_id: fVehicle,
      datum: fDatum,
      relacija_od: fOd.trim(),
      relacija_do: fDo.trim(),
      relacija_do2: fDo2.trim() || null,
      km_stevec: fKm ? Number(fKm) : null,
      voznik: fVoznik,
      opombe: fOpombe.trim() || null,
    };
    const { error } = editingId
      ? await supabase.from("vehicle_trips").update(payload).eq("id", editingId)
      : await supabase.from("vehicle_trips").insert({ ...payload, user_id: user.id });
    setSaving(false);
    if (error) return toast({ title: "Napaka", description: error.message, variant: "destructive" });
    toast({ title: editingId ? "Potni nalog posodobljen" : "Potni nalog shranjen" });
    reset(); setOpen(false); load();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Izbrisati ta potni nalog?")) return;
    const { error } = await supabase.from("vehicle_trips").delete().eq("id", id);
    if (error) return toast({ title: "Napaka", description: error.message, variant: "destructive" });
    toast({ title: "Izbrisano" }); load();
  };

  return (
    <AppShell>
      <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-4">
        <PageHeader
          title="Potni nalog"
          icon={ClipboardList}
          description="Vnos in pregled voženj vozil"
          actions={
            allowed && (
              <Button onClick={() => { reset(); setOpen(true); }} className="bg-brand-red hover:bg-brand-red/90 text-brand-red-foreground">
                <Plus className="h-4 w-4 mr-1" /> Nov vnos
              </Button>
            )
          }
        />

        {!allowed && (
          <div className="flex items-center gap-2 p-3 rounded-lg border border-border bg-muted/40 text-sm text-muted-foreground">
            <Lock className="h-4 w-4" /> Nimaš pravic za vnos. Potne naloge si lahko samo ogleduješ.
          </div>
        )}

        <Dialog open={open && allowed} onOpenChange={(o) => { if (!o) { setOpen(false); reset(); } }}>
          <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingId ? "Uredi potni nalog" : "Nov potni nalog"}</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Datum *</Label>
                  <DatePickerSI value={fDatum} onChange={setFDatum} />
                </div>
                <div className="space-y-1.5">
                  <Label>Vozilo *</Label>
                  <Select value={fVehicle} onValueChange={setFVehicle}>
                    <SelectTrigger><SelectValue placeholder="Izberi vozilo" /></SelectTrigger>
                    <SelectContent>
                      {vehicles.map((v) => (
                        <SelectItem key={v.id} value={v.id}>
                          {v.oznaka}{v.registracija ? ` • ${v.registracija}` : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Relacija — od *</Label>
                  <Input value={fOd} onChange={(e) => setFOd(e.target.value)} placeholder="npr. Šempeter" />
                </div>
                <div className="space-y-1.5">
                  <Label>Relacija — do *</Label>
                  <Input value={fDo} onChange={(e) => setFDo(e.target.value)} placeholder="npr. Nova Gorica" />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label>Relacija — do (2)</Label>
                  <Input value={fDo2} onChange={(e) => setFDo2(e.target.value)} placeholder="dodatna destinacija (neobvezno)" />
                </div>
                <div className="space-y-1.5">
                  <Label>Št. km na števcu</Label>
                  <Input type="number" value={fKm} onChange={(e) => setFKm(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Voznik *</Label>
                  <Select value={fVoznik} onValueChange={setFVoznik}>
                    <SelectTrigger><SelectValue placeholder="Izberi voznika" /></SelectTrigger>
                    <SelectContent>
                      {drivers.length === 0 ? (
                        <div className="px-2 py-1.5 text-sm text-muted-foreground">
                          Ni voznikov z B ali C izpitom. Označi izpite v adminu.
                        </div>
                      ) : drivers.map((m) => (
                        <SelectItem key={m.id} value={m.name}>
                          {m.name} {m.licenca_b && m.licenca_c ? "(B, C)" : m.licenca_b ? "(B)" : "(C)"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label>Namen</Label>
                  <Textarea rows={2} value={fOpombe} onChange={(e) => setFOpombe(e.target.value)} />
                </div>
            </div>
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => { setOpen(false); reset(); }}>Prekliči</Button>
              <Button onClick={submit} disabled={saving} className="bg-brand-red hover:bg-brand-red/90 text-brand-red-foreground">
                {saving ? "Shranjujem..." : editingId ? "Posodobi" : "Shrani"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <div className="overflow-x-auto border border-border rounded-xl bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Datum</TableHead>
                <TableHead>Vozilo</TableHead>
                <TableHead>Relacija</TableHead>
                <TableHead>Št. km</TableHead>
                <TableHead>Voznik</TableHead>
                <TableHead>Opombe</TableHead>
                {allowed && <TableHead className="text-right w-20"></TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">Nalagam...</TableCell></TableRow>
              ) : trips.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">Ni potnih nalogov</TableCell></TableRow>
              ) : trips.map((t) => {
                const v = vehicleById[t.vehicle_id];
                return (
                  <TableRow key={t.id}>
                    <TableCell>{formatDateSI(t.datum)}</TableCell>
                    <TableCell className="font-medium">{v?.oznaka ?? "—"}</TableCell>
                    <TableCell>
                      {t.relacija_od} → {t.relacija_do}
                      {t.relacija_do2 ? <> → {t.relacija_do2}</> : null}
                    </TableCell>
                    <TableCell>{t.km_stevec ?? "—"}</TableCell>
                    <TableCell>{t.voznik}</TableCell>
                    <TableCell className="text-muted-foreground text-sm max-w-xs truncate">{t.opombe || "—"}</TableCell>
                    {allowed && (
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button size="icon" variant="ghost" onClick={() => openEdit(t)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button size="icon" variant="ghost" onClick={() => handleDelete(t.id)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>
    </AppShell>
  );
}
