import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import AppShell from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useModulePermissions } from "@/hooks/useModulePermissions";
import { useVehicles } from "@/hooks/useVehicles";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { ArrowLeft, Lock, Pencil, Plus, Trash2, Wrench } from "lucide-react";
import { formatDateSI } from "@/lib/format";

type Service = { id: string; user_id: string; vehicle_id: string; datum: string; opis: string };

export default function KnjigaServisov() {
  const { user } = useAuth();
  const { canEdit } = useModulePermissions();
  const { vehicles } = useVehicles();
  const allowed = canEdit("services");

  const [rows, setRows] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterVeh, setFilterVeh] = useState("vsi");

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Service | null>(null);
  const [fDatum, setFDatum] = useState(new Date().toISOString().slice(0, 10));
  const [fVehicle, setFVehicle] = useState("");
  const [fOpis, setFOpis] = useState("");
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("vehicle_services")
      .select("*")
      .order("datum", { ascending: false });
    setRows((data ?? []) as Service[]);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const vehById = useMemo(() => {
    const m: Record<string, string> = {};
    vehicles.forEach((v) => (m[v.id] = v.oznaka));
    return m;
  }, [vehicles]);

  const visible = useMemo(() => {
    return rows.filter((r) => {
      if (filterVeh !== "vsi" && r.vehicle_id !== filterVeh) return false;
      const q = search.trim().toLowerCase();
      if (!q) return true;
      return (vehById[r.vehicle_id] ?? "").toLowerCase().includes(q) || r.opis.toLowerCase().includes(q) || r.datum.includes(q);
    });
  }, [rows, search, filterVeh, vehById]);

  const openCreate = () => {
    setEditing(null);
    setFDatum(new Date().toISOString().slice(0, 10));
    setFVehicle("");
    setFOpis("");
    setOpen(true);
  };
  const openEdit = (r: Service) => {
    setEditing(r);
    setFDatum(r.datum);
    setFVehicle(r.vehicle_id);
    setFOpis(r.opis);
    setOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !fVehicle || !fOpis.trim() || !fDatum) {
      toast({ title: "Manjkajoči podatki", variant: "destructive" });
      return;
    }
    setSaving(true);
    if (editing) {
      const { error } = await supabase.from("vehicle_services").update({
        vehicle_id: fVehicle, datum: fDatum, opis: fOpis.trim(),
      }).eq("id", editing.id);
      setSaving(false);
      if (error) { toast({ title: "Napaka", description: error.message, variant: "destructive" }); return; }
      toast({ title: "Posodobljeno" });
    } else {
      const { error } = await supabase.from("vehicle_services").insert({
        user_id: user.id, vehicle_id: fVehicle, datum: fDatum, opis: fOpis.trim(),
      });
      setSaving(false);
      if (error) { toast({ title: "Napaka", description: error.message, variant: "destructive" }); return; }
      toast({ title: "Servis dodan" });
    }
    setOpen(false);
    load();
  };

  const handleDelete = async (r: Service) => {
    if (!confirm("Izbriši servis?")) return;
    const { error } = await supabase.from("vehicle_services").delete().eq("id", r.id);
    if (error) { toast({ title: "Napaka", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Izbrisano" });
    load();
  };

  return (
    <AppShell>
      <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <Button asChild variant="ghost" size="sm"><Link to="/servisi"><ArrowLeft className="h-4 w-4 mr-1" /> Servisi</Link></Button>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight flex items-center gap-2">
              <Wrench className="h-6 w-6 text-brand-red" /> Knjiga servisov in popravil
            </h1>
          </div>
          {allowed && (
            <Button onClick={openCreate} className="bg-brand-red hover:bg-brand-red/90 text-brand-red-foreground">
              <Plus className="h-4 w-4 mr-1" /> Nov servis
            </Button>
          )}
        </div>

        {!allowed && (
          <div className="flex items-center gap-2 p-3 rounded-lg border border-border bg-muted/40 text-sm text-muted-foreground">
            <Lock className="h-4 w-4" /> Nimaš pravic za urejanje. Zapise lahko samo pregleduješ.
          </div>
        )}

        <div className="flex flex-wrap gap-3">
          <Input placeholder="Išči..." value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-xs" />
          <Select value={filterVeh} onValueChange={setFilterVeh}>
            <SelectTrigger className="w-[220px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="vsi">Vsa vozila</SelectItem>
              {vehicles.map((v) => <SelectItem key={v.id} value={v.id}>{v.oznaka}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div className="overflow-x-auto border border-border rounded-xl bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Datum</TableHead>
                <TableHead>Vozilo</TableHead>
                <TableHead>Opis popravila / servisa</TableHead>
                {allowed && <TableHead className="text-right w-[120px]">Akcije</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">Nalagam...</TableCell></TableRow>
              ) : visible.length === 0 ? (
                <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">Ni zapisov</TableCell></TableRow>
              ) : (
                visible.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell>{formatDateSI(r.datum)}</TableCell>
                    <TableCell className="font-medium">{vehById[r.vehicle_id] ?? "—"}</TableCell>
                    <TableCell className="text-muted-foreground max-w-xl">{r.opis}</TableCell>
                    {allowed && (
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button size="icon" variant="ghost" onClick={() => openEdit(r)}><Pencil className="h-4 w-4" /></Button>
                          <Button size="icon" variant="ghost" onClick={() => handleDelete(r)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>{editing ? "Uredi servis" : "Nov servis"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5"><Label>Datum *</Label><Input type="date" value={fDatum} onChange={(e) => setFDatum(e.target.value)} required /></div>
              <div className="space-y-1.5">
                <Label>Vozilo *</Label>
                <Select value={fVehicle} onValueChange={setFVehicle}>
                  <SelectTrigger><SelectValue placeholder="Izberi vozilo" /></SelectTrigger>
                  <SelectContent>
                    {vehicles.map((v) => <SelectItem key={v.id} value={v.id}>{v.oznaka}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5"><Label>Opis popravila *</Label><Textarea rows={4} value={fOpis} onChange={(e) => setFOpis(e.target.value)} required /></div>
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