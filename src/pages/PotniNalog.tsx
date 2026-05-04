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
import { Card, CardContent } from "@/components/ui/card";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { DatePickerSI } from "@/components/ui/date-picker-si";
import { toast } from "@/hooks/use-toast";
import { ClipboardList, Plus, Trash2, Lock } from "lucide-react";
import { formatDateSI } from "@/lib/format";

type Trip = {
  id: string;
  user_id: string;
  vehicle_id: string;
  datum: string;
  relacija_od: string;
  relacija_do: string;
  km_stevec: number | null;
  voznik: string;
  opombe: string | null;
};

type MemberLic = { id: string; name: string; licenca_b: boolean; licenca_c: boolean };

export default function PotniNalog() {
  const { user } = useAuth();
  const { vehicles } = useVehicles();
  const { canEdit } = useModulePermissions();
  const allowed = canEdit("vehicles");

  const [trips, setTrips] = useState<Trip[]>([]);
  const [drivers, setDrivers] = useState<MemberLic[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  const [fDatum, setFDatum] = useState("");
  const [fVehicle, setFVehicle] = useState("");
  const [fOd, setFOd] = useState("");
  const [fDo, setFDo] = useState("");
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
    setFDatum(""); setFVehicle(""); setFOd(""); setFDo(""); setFKm(""); setFVoznik(""); setFOpombe("");
  };

  const submit = async () => {
    if (!user) return;
    if (!fDatum || !fVehicle || !fOd.trim() || !fDo.trim() || !fVoznik) {
      toast({ title: "Manjkajoči podatki", description: "Izpolnite obvezna polja.", variant: "destructive" });
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("vehicle_trips").insert({
      user_id: user.id,
      vehicle_id: fVehicle,
      datum: fDatum,
      relacija_od: fOd.trim(),
      relacija_do: fDo.trim(),
      km_stevec: fKm ? Number(fKm) : null,
      voznik: fVoznik,
      opombe: fOpombe.trim() || null,
    });
    setSaving(false);
    if (error) return toast({ title: "Napaka", description: error.message, variant: "destructive" });
    toast({ title: "Potni nalog shranjen" });
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

        {open && allowed && (
          <Card>
            <CardContent className="p-4 sm:p-6 space-y-4">
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
                  <Label>Opombe</Label>
                  <Textarea rows={2} value={fOpombe} onChange={(e) => setFOpombe(e.target.value)} />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => { setOpen(false); reset(); }}>Prekliči</Button>
                <Button onClick={submit} disabled={saving} className="bg-brand-red hover:bg-brand-red/90 text-brand-red-foreground">
                  {saving ? "Shranjujem..." : "Shrani"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

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
                    <TableCell>{t.relacija_od} → {t.relacija_do}</TableCell>
                    <TableCell>{t.km_stevec ?? "—"}</TableCell>
                    <TableCell>{t.voznik}</TableCell>
                    <TableCell className="text-muted-foreground text-sm max-w-xs truncate">{t.opombe || "—"}</TableCell>
                    {allowed && (
                      <TableCell className="text-right">
                        <Button size="icon" variant="ghost" onClick={() => handleDelete(t.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
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
