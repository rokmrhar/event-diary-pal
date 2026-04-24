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
import { ArrowLeft, ClipboardCheck, Lock, Pencil, Plus, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatDateSI } from "@/lib/format";

type Inspection = {
  id: string;
  user_id: string;
  vehicle_id: string;
  zadnji_pregled: string | null;
  naslednji_pregled: string | null;
  opombe: string | null;
};

export default function TehnicniPregledi() {
  const { user } = useAuth();
  const { canEdit } = useModulePermissions();
  const { vehicles } = useVehicles();
  const allowed = canEdit("inspections");

  const [rows, setRows] = useState<Inspection[]>([]);
  const [loading, setLoading] = useState(true);

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Inspection | null>(null);
  const [fVehicle, setFVehicle] = useState("");
  const [fZadnji, setFZadnji] = useState("");
  const [fNaslednji, setFNaslednji] = useState("");
  const [fOpombe, setFOpombe] = useState("");
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("vehicle_inspections").select("*");
    setRows((data ?? []) as Inspection[]);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const vehById = useMemo(() => {
    const m: Record<string, string> = {};
    vehicles.forEach((v) => (m[v.id] = v.oznaka));
    return m;
  }, [vehicles]);

  const sorted = useMemo(() => {
    return [...rows].sort((a, b) => (a.naslednji_pregled ?? "9999").localeCompare(b.naslednji_pregled ?? "9999"));
  }, [rows]);

  const openCreate = () => {
    setEditing(null);
    setFVehicle(""); setFZadnji(""); setFNaslednji(""); setFOpombe("");
    setOpen(true);
  };
  const openEdit = (r: Inspection) => {
    setEditing(r);
    setFVehicle(r.vehicle_id);
    setFZadnji(r.zadnji_pregled ?? "");
    setFNaslednji(r.naslednji_pregled ?? "");
    setFOpombe(r.opombe ?? "");
    setOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !fVehicle) { toast({ title: "Izberi vozilo", variant: "destructive" }); return; }
    setSaving(true);
    const payload = {
      vehicle_id: fVehicle,
      zadnji_pregled: fZadnji || null,
      naslednji_pregled: fNaslednji || null,
      opombe: fOpombe.trim() || null,
    };
    if (editing) {
      const { error } = await supabase.from("vehicle_inspections").update(payload).eq("id", editing.id);
      setSaving(false);
      if (error) { toast({ title: "Napaka", description: error.message, variant: "destructive" }); return; }
      toast({ title: "Posodobljeno" });
    } else {
      const { error } = await supabase.from("vehicle_inspections").insert({ ...payload, user_id: user.id });
      setSaving(false);
      if (error) { toast({ title: "Napaka", description: error.message, variant: "destructive" }); return; }
      toast({ title: "Tehnični pregled dodan" });
    }
    setOpen(false);
    load();
  };

  const handleDelete = async (r: Inspection) => {
    if (!confirm("Izbriši zapis?")) return;
    const { error } = await supabase.from("vehicle_inspections").delete().eq("id", r.id);
    if (error) { toast({ title: "Napaka", description: error.message, variant: "destructive" }); return; }
    load();
  };

  const today = new Date().toISOString().slice(0, 10);
  const status = (next: string | null) => {
    if (!next) return null;
    if (next < today) return <Badge variant="destructive" className="text-xs">Potekel</Badge>;
    const days = Math.ceil((new Date(next).getTime() - new Date(today).getTime()) / 86400000);
    if (days <= 30) return <Badge className="text-xs bg-amber-500 text-white">Poteka kmalu</Badge>;
    return <Badge variant="outline" className="text-xs">Veljaven</Badge>;
  };

  return (
    <AppShell>
      <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <Button asChild variant="ghost" size="sm"><Link to="/servisi"><ArrowLeft className="h-4 w-4 mr-1" /> Servisi</Link></Button>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight flex items-center gap-2">
              <ClipboardCheck className="h-6 w-6 text-brand-red" /> Tehnični pregledi
            </h1>
          </div>
          {allowed && (
            <Button onClick={openCreate} className="bg-brand-red hover:bg-brand-red/90 text-brand-red-foreground">
              <Plus className="h-4 w-4 mr-1" /> Nov pregled
            </Button>
          )}
        </div>

        {!allowed && (
          <div className="flex items-center gap-2 p-3 rounded-lg border border-border bg-muted/40 text-sm text-muted-foreground">
            <Lock className="h-4 w-4" /> Nimaš pravic za urejanje.
          </div>
        )}

        <div className="overflow-x-auto border border-border rounded-xl bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Vozilo</TableHead>
                <TableHead>Zadnji pregled</TableHead>
                <TableHead>Naslednji pregled</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Opombe</TableHead>
                {allowed && <TableHead className="text-right w-[120px]">Akcije</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Nalagam...</TableCell></TableRow>
              ) : sorted.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Ni zapisov</TableCell></TableRow>
              ) : (
                sorted.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{vehById[r.vehicle_id] ?? "—"}</TableCell>
                    <TableCell>{formatDateSI(r.zadnji_pregled)}</TableCell>
                    <TableCell>{formatDateSI(r.naslednji_pregled)}</TableCell>
                    <TableCell>{status(r.naslednji_pregled)}</TableCell>
                    <TableCell className="text-muted-foreground">{r.opombe ?? "—"}</TableCell>
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
              <DialogTitle>{editing ? "Uredi tehnični pregled" : "Nov tehnični pregled"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label>Vozilo *</Label>
                <Select value={fVehicle} onValueChange={setFVehicle}>
                  <SelectTrigger><SelectValue placeholder="Izberi vozilo" /></SelectTrigger>
                  <SelectContent>
                    {vehicles.map((v) => <SelectItem key={v.id} value={v.id}>{v.oznaka}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5"><Label>Zadnji pregled</Label><Input type="date" value={fZadnji} onChange={(e) => setFZadnji(e.target.value)} /></div>
                <div className="space-y-1.5"><Label>Naslednji pregled</Label><Input type="date" value={fNaslednji} onChange={(e) => setFNaslednji(e.target.value)} /></div>
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