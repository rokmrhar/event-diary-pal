import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Plus, Save, Send, Trash2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Schedule = {
  id: string;
  type: string;
  label: string;
  enabled: boolean;
  hour: number;
  days_before: number;
  interval_days: number;
  last_run_at: string | null;
};

const TYPES = [
  { value: "zdravniski", label: "Zdravniški pregledi" },
  { value: "tehnicni", label: "Tehnični pregledi" },
  { value: "nacrtovanja", label: "Načrtovani zdravniški pregledi" },
];

export default function EmailSchedulesTab() {
  const [items, setItems] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("email_schedules").select("*").order("type");
    if (error) toast({ title: "Napaka", description: error.message, variant: "destructive" });
    setItems((data as Schedule[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const update = (id: string, patch: Partial<Schedule>) =>
    setItems((p) => p.map((x) => (x.id === id ? { ...x, ...patch } : x)));

  const save = async (s: Schedule) => {
    const { error } = await supabase.from("email_schedules").update({
      type: s.type, label: s.label, enabled: s.enabled, hour: s.hour,
      days_before: s.days_before, interval_days: s.interval_days,
    }).eq("id", s.id);
    if (error) return toast({ title: "Napaka", description: error.message, variant: "destructive" });
    toast({ title: "Shranjeno" });
  };

  const add = async () => {
    const { error } = await supabase.from("email_schedules").insert({
      type: "zdravniski", label: "Nov urnik", enabled: true, hour: 7, days_before: 14, interval_days: 1,
    });
    if (error) return toast({ title: "Napaka", description: error.message, variant: "destructive" });
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("Izbrisati urnik?")) return;
    const { error } = await supabase.from("email_schedules").delete().eq("id", id);
    if (error) return toast({ title: "Napaka", description: error.message, variant: "destructive" });
    load();
  };

  const runNow = async (s: Schedule) => {
    setRunning(s.id);
    const { data, error } = await supabase.functions.invoke("send-medical-reminders", {
      body: { mode: s.type },
    });
    setRunning(null);
    if (error) return toast({ title: "Napaka", description: error.message, variant: "destructive" });
    const r = data as { ok: boolean; sent?: number; message?: string; error?: string };
    toast({
      title: r.ok ? "Izvedeno" : "Težava",
      description: r.message ?? r.error ?? `Poslano: ${r.sent ?? 0}`,
      variant: r.ok ? "default" : "destructive",
    });
    load();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Urniki samodejnih opomnikov</h2>
          <p className="text-sm text-muted-foreground">Različni intervali in ure pošiljanja za vsak tip pregleda.</p>
        </div>
        <Button onClick={add}><Plus className="h-4 w-4 mr-1" /> Nov urnik</Button>
      </div>

      {loading ? <p className="text-sm text-muted-foreground">Nalagam...</p> : (
        <div className="overflow-x-auto border border-border rounded-xl">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Vklopljen</TableHead>
                <TableHead>Naziv</TableHead>
                <TableHead>Tip</TableHead>
                <TableHead className="w-20">Ura</TableHead>
                <TableHead className="w-24">Dni vnaprej</TableHead>
                <TableHead className="w-28">Interval (dni)</TableHead>
                <TableHead>Zadnji zagon</TableHead>
                <TableHead className="text-right w-[200px]">Dejanja</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.length === 0 ? (
                <TableRow><TableCell colSpan={8} className="text-center py-6 text-muted-foreground">Ni urnikov</TableCell></TableRow>
              ) : items.map((s) => (
                <TableRow key={s.id}>
                  <TableCell><Switch checked={s.enabled} onCheckedChange={(c) => update(s.id, { enabled: c })} /></TableCell>
                  <TableCell><Input value={s.label} onChange={(e) => update(s.id, { label: e.target.value })} /></TableCell>
                  <TableCell>
                    <Select value={s.type} onValueChange={(v) => update(s.id, { type: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell><Input type="number" min={0} max={23} value={s.hour} onChange={(e) => update(s.id, { hour: parseInt(e.target.value) || 0 })} /></TableCell>
                  <TableCell><Input type="number" min={1} value={s.days_before} onChange={(e) => update(s.id, { days_before: parseInt(e.target.value) || 1 })} /></TableCell>
                  <TableCell><Input type="number" min={1} value={s.interval_days} onChange={(e) => update(s.id, { interval_days: parseInt(e.target.value) || 1 })} /></TableCell>
                  <TableCell className="text-xs text-muted-foreground">{s.last_run_at ? new Date(s.last_run_at).toLocaleString("sl-SI") : "—"}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button size="sm" variant="outline" onClick={() => save(s)}><Save className="h-3 w-3 mr-1" />Shrani</Button>
                      <Button size="sm" variant="outline" onClick={() => runNow(s)} disabled={running === s.id}>
                        <Send className="h-3 w-3 mr-1" />{running === s.id ? "..." : "Pošlji"}
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => remove(s.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}