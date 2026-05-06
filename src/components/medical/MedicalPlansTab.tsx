import { useEffect, useMemo, useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePickerSI } from "@/components/ui/date-picker-si";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useMembers } from "@/hooks/useMembers";
import { formatDateSI } from "@/lib/format";

type CheckRow = {
  id: string;
  member_name: string;
  naslednji_pregled: string | null;
};

type Plan = {
  id: string;
  user_id: string;
  member_name: string;
  member_email: string | null;
  medical_check_id: string | null;
  planned_date: string;
  location: string | null;
  opombe: string | null;
  reminder_sent_at: string | null;
};

export default function MedicalPlansTab({ rows, canEdit }: { rows: CheckRow[]; canEdit: boolean }) {
  const { user } = useAuth();
  const { members } = useMembers();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Plan | null>(null);
  const [form, setForm] = useState({ member_name: "", planned_date: "", location: "", opombe: "" });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("medical_plans").select("*").order("planned_date", { ascending: true });
    setPlans((data as Plan[]) ?? []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  // Year buckets — group by year of expiring check (this year, next year...)
  const buckets = useMemo(() => {
    const today = new Date();
    const map = new Map<number, CheckRow[]>();
    for (const r of rows) {
      if (!r.naslednji_pregled) continue;
      const y = new Date(r.naslednji_pregled + "T00:00:00").getFullYear();
      if (y < today.getFullYear()) continue;
      if (!map.has(y)) map.set(y, []);
      map.get(y)!.push(r);
    }
    return [...map.entries()].sort((a, b) => a[0] - b[0]);
  }, [rows]);

  // Eligible members for this year (have a check expiring in current year)
  const currentYear = new Date().getFullYear();
  const eligibleThisYear = rows.filter(
    (r) => r.naslednji_pregled && new Date(r.naslednji_pregled + "T00:00:00").getFullYear() <= currentYear
  );

  const openCreate = () => {
    setEditing(null);
    setForm({ member_name: "", planned_date: "", location: "", opombe: "" });
    setOpen(true);
  };

  const openEdit = (p: Plan) => {
    setEditing(p);
    setForm({
      member_name: p.member_name,
      planned_date: p.planned_date,
      location: p.location ?? "",
      opombe: p.opombe ?? "",
    });
    setOpen(true);
  };

  const remove = async (p: Plan) => {
    if (!confirm("Izbrisati načrtovanje?")) return;
    const { error } = await supabase.from("medical_plans").delete().eq("id", p.id);
    if (error) return toast({ title: "Napaka", description: error.message, variant: "destructive" });
    load();
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!form.member_name || !form.planned_date) {
      return toast({ title: "Manjkajo podatki", description: "Izberi člana in datum.", variant: "destructive" });
    }
    const member = members.find((m) => m.name === form.member_name);
    const check = rows.find((r) => r.member_name === form.member_name);
    const payload = {
      member_name: form.member_name,
      member_email: member?.email ?? null,
      medical_check_id: check?.id ?? null,
      planned_date: form.planned_date,
      location: form.location.trim() || null,
      opombe: form.opombe.trim() || null,
    };
    setSaving(true);
    if (editing) {
      const { error } = await supabase.from("medical_plans").update(payload).eq("id", editing.id);
      setSaving(false);
      if (error) return toast({ title: "Napaka", description: error.message, variant: "destructive" });
      toast({ title: "Posodobljeno" });
    } else {
      const { error } = await supabase.from("medical_plans").insert({ ...payload, user_id: user.id });
      setSaving(false);
      if (error) return toast({ title: "Napaka", description: error.message, variant: "destructive" });
      toast({ title: "Načrtovanje shranjeno" });
    }
    setOpen(false);
    load();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Načrtovanja po letih, glede na datum poteka pregleda.</p>
        {canEdit && (
          <Button onClick={openCreate} className="bg-brand-red hover:bg-brand-red/90 text-brand-red-foreground">
            <Plus className="h-4 w-4 mr-1" /> Novo načrtovanje
          </Button>
        )}
      </div>

      {buckets.length === 0 ? (
        <p className="text-sm text-muted-foreground">Ni članov s prihodnjim potekom pregleda.</p>
      ) : buckets.map(([year, list]) => (
        <section key={year} className="border border-border rounded-xl bg-card">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <h3 className="font-semibold">Leto {year} <span className="text-muted-foreground font-normal">({list.length})</span></h3>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ime in priimek</TableHead>
                <TableHead>Pregled poteče</TableHead>
                <TableHead>Načrtovan datum</TableHead>
                <TableHead>Lokacija</TableHead>
                <TableHead>Opomba</TableHead>
                <TableHead>Opomnik</TableHead>
                {canEdit && <TableHead className="text-right">Akcije</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {list.map((r) => {
                const plan = plans.find((p) => p.member_name === r.member_name && new Date(p.planned_date).getFullYear() === year);
                return (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{r.member_name}</TableCell>
                    <TableCell>{r.naslednji_pregled ? formatDateSI(r.naslednji_pregled) : "—"}</TableCell>
                    <TableCell>{plan ? formatDateSI(plan.planned_date) : <Badge variant="outline">ni načrtovano</Badge>}</TableCell>
                    <TableCell>{plan?.location ?? "—"}</TableCell>
                    <TableCell className="max-w-xs truncate text-sm text-muted-foreground">{plan?.opombe ?? "—"}</TableCell>
                    <TableCell className="text-xs">{plan?.reminder_sent_at ? <Badge className="bg-emerald-600 text-white hover:bg-emerald-600/90">poslan</Badge> : <Badge variant="outline">čaka</Badge>}</TableCell>
                    {canEdit && (
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          {plan ? (
                            <>
                              <Button size="icon" variant="ghost" onClick={() => openEdit(plan)}><Pencil className="h-4 w-4" /></Button>
                              <Button size="icon" variant="ghost" onClick={() => remove(plan)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                            </>
                          ) : (
                            <Button size="sm" variant="outline" onClick={() => { setEditing(null); setForm({ member_name: r.member_name, planned_date: "", location: "", opombe: "" }); setOpen(true); }}>
                              <Plus className="h-3 w-3 mr-1" /> Načrtuj
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </section>
      ))}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Uredi načrtovanje" : "Novo načrtovanje pregleda"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Član (s pregledom v letu)</Label>
              <Select value={form.member_name} onValueChange={(v) => setForm((p) => ({ ...p, member_name: v }))}>
                <SelectTrigger><SelectValue placeholder="Izberi člana" /></SelectTrigger>
                <SelectContent>
                  {eligibleThisYear.map((r) => (
                    <SelectItem key={r.id} value={r.member_name}>
                      {r.member_name} — poteče {r.naslednji_pregled ? formatDateSI(r.naslednji_pregled) : "?"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Datum pregleda</Label>
              <DatePickerSI value={form.planned_date} onChange={(v) => setForm((p) => ({ ...p, planned_date: v }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Lokacija</Label>
              <Input value={form.location} onChange={(e) => setForm((p) => ({ ...p, location: e.target.value }))} placeholder="npr. Holmed Škofja Loka" />
            </div>
            <div className="space-y-1.5">
              <Label>Opombe</Label>
              <Textarea rows={3} value={form.opombe} onChange={(e) => setForm((p) => ({ ...p, opombe: e.target.value }))} placeholder="npr. S sabo vzemi vodo, pošlji zdravniški karton…" />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={saving}>Prekliči</Button>
              <Button type="submit" disabled={saving} className="bg-brand-red hover:bg-brand-red/90 text-brand-red-foreground">
                {saving ? "Shranjujem..." : editing ? "Posodobi" : "Shrani"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}