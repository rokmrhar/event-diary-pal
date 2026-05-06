import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";

type Tpl = { id: string; key: string; subject: string; body_html: string };

const LABELS: Record<string, string> = {
  zdravniski: "Zdravniški pregled (opomnik)",
  tehnicni: "Tehnični pregled (opomnik)",
  nacrtovanje: "Načrtovan zdravniški pregled (članu)",
};

const HINTS: Record<string, string> = {
  zdravniski: "Spremenljivke: {{ime}}, {{datum}}, {{dni}}",
  tehnicni: "Spremenljivke: {{vozilo}}, {{datum}}, {{dni}}",
  nacrtovanje: "Spremenljivke: {{ime}}, {{datum}}, {{lokacija}}, {{opombe}}",
};

export default function EmailTemplatesTab() {
  const [items, setItems] = useState<Tpl[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("email_templates").select("*").order("key");
    if (error) toast({ title: "Napaka", description: error.message, variant: "destructive" });
    setItems((data as Tpl[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const update = (id: string, patch: Partial<Tpl>) =>
    setItems((p) => p.map((x) => (x.id === id ? { ...x, ...patch } : x)));

  const save = async (t: Tpl) => {
    setSaving(t.id);
    const { error } = await supabase.from("email_templates").update({
      subject: t.subject, body_html: t.body_html,
    }).eq("id", t.id);
    setSaving(null);
    if (error) return toast({ title: "Napaka", description: error.message, variant: "destructive" });
    toast({ title: "Shranjeno" });
  };

  if (loading) return <p className="text-sm text-muted-foreground">Nalagam...</p>;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Predloge email sporočil</h2>
        <p className="text-sm text-muted-foreground">Uredi zadevo in vsebino vsake predloge.</p>
      </div>
      {items.map((t) => (
        <section key={t.id} className="border border-border rounded-xl p-4 space-y-3 bg-card">
          <h3 className="font-semibold">{LABELS[t.key] ?? t.key}</h3>
          <p className="text-xs text-muted-foreground">{HINTS[t.key] ?? ""}</p>
          <div className="space-y-1.5">
            <Label>Zadeva</Label>
            <Input value={t.subject} onChange={(e) => update(t.id, { subject: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label>Vsebina (HTML)</Label>
            <Textarea rows={10} value={t.body_html} onChange={(e) => update(t.id, { body_html: e.target.value })} className="font-mono text-xs" />
          </div>
          <Button onClick={() => save(t)} disabled={saving === t.id}>
            {saving === t.id ? "Shranjujem..." : "Shrani predlogo"}
          </Button>
        </section>
      ))}
    </div>
  );
}